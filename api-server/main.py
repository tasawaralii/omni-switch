from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import paho.mqtt.client as mqtt
import random
from typing import List
import models
from database import get_db, engine
from schemas import (
    ControlRequest,
    NodeCreateRequest,
    ProvisionNodeResponse,
    GetAppliancesResponse,
    ControlApplianceResponse,
    UpdateSuccessResponse
)
from sqlalchemy.orm import Session

app = FastAPI(title="OmniSwitch Departmental Gateway")

models.Base.metadata.create_all(bind=engine)

# Enable CORS so your front-end web app can talk to this API safely
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PROJECT_ID = "omni-switch-2677"
MQTT_BROKER = "broker.hivemq.com"
MQTT_PORT = 1883

# Setup MQTT Client for Python Backend
mqtt_client = mqtt.Client(
    callback_api_version=mqtt.CallbackAPIVersion.VERSION2,
    client_id=f"FastAPI-Backend-{random.randint(0, 1000)}",
)


@app.on_event("startup")
def startup_event():
    # Connect to the cloud broker when FastAPI starts up
    mqtt_client.connect(MQTT_BROKER, MQTT_PORT, 60)
    mqtt_client.loop_start()


@app.on_event("shutdown")
def shutdown_event():
    mqtt_client.loop_stop()
    mqtt_client.disconnect()

@app.put("/nodes/update_name/{node_id}", response_model=UpdateSuccessResponse)
def update_node_name(node_id: str, name: str, db: Session = Depends(get_db)):
    node = db.query(models.Node).filter(models.Node.id == node_id).first()
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    node.name = name
    db.commit()
    return {"success": True, "message": f"Node name updated to {name}"}

@app.put("/appliances/update/{node_id}/{relay_key}", response_model=UpdateSuccessResponse)
def update_appliance_details(node_id: str, relay_key: str, name: str, is_active: bool, db: Session = Depends(get_db)):
    appliance = (
        db.query(models.Appliance)
        .filter(models.Appliance.node_id == node_id)
        .filter(models.Appliance.relay_key == relay_key)
        .first()
    )
    if not appliance:
        raise HTTPException(status_code=404, detail="Appliance not found")
    appliance.name = name
    appliance.is_active = is_active
    db.commit()
    return {"success": True, "message": f"Appliance {relay_key} updated successfully."}

@app.post("/nodes/provision", response_model=ProvisionNodeResponse)
def provision_new_node(request: NodeCreateRequest, db: Session = Depends(get_db)):
    # 1. Safety Check: Verify the array matches the specified capacity
    if len(request.pins) != request.pin_capacity:
        raise HTTPException(
            status_code=400,
            detail="Provided pins array length must match the specified pin capacity exactly.",
        )

    # 2. Check if node ID already exists
    existing_node = db.query(models.Node).filter(models.Node.id == request.id).first()
    if existing_node:
        raise HTTPException(status_code=400, detail="Node ID already registered.")

    # 3. Create and add the parent Node row
    new_node = models.Node(
        id=request.id, name=request.name, pin_capacity=request.pin_capacity
    )
    db.add(new_node)

    # 4. Loop and auto-generate the inactive placeholders
    for index, pin_assignment in enumerate(request.pins, start=1):
        placeholder_appliance = models.Appliance(
            node_id=request.id,
            relay_key=f"relay_{index}",
            pin=pin_assignment,
            name=f"Unassigned Relay Slot {index}",  # Default Name
            status="OFF",
            is_active=False,  # Locked by default
        )
        db.add(placeholder_appliance)

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, detail=f"Database write execution error: {str(e)}"
        )

    return {
        "success": True,
        "message": f"Successfully provisioned {request.id} with {request.pin_capacity} isolated relay slots.",
    }


@app.get("/appliances", response_model=GetAppliancesResponse)
def get_appliances(db: Session = Depends(get_db)):
    nodes = db.query(models.Node).all()

    total_nodes = len(nodes)
    total_on = 0
    formatted_nodes = {}

    for node in nodes:
        node_appliances = {}
        for app in node.appliances:
            node_appliances[app.relay_key] = {
                "id": app.id,
                "pin": app.pin,
                "name": app.name,
                "status": app.status,
                "is_active": app.is_active,  # Sent to frontend for UI filtering
            }

            # Only increment counter if the appliance is actually deployed/active and turned ON
            if app.is_active and app.status == "ON":
                total_on += 1

        formatted_nodes[node.id] = {
            "name": node.name,
            "pin_capacity": node.pin_capacity,
            "appliances": node_appliances,
        }

    return {
        "total_nodes": total_nodes,
        "total_on_appliances": total_on,
        "nodes": formatted_nodes,
    }

@app.post("/appliances/control/{node_id}/{relay_key}", response_model=ControlApplianceResponse)
def control_appliance(
    node_id: str, relay_key: str, request: ControlRequest, db: Session = Depends(get_db)
):
    """
    Updates the appliance state in the database and dispatches
    the MQTT packet over the internet to trigger the physical hardware.
    """
    appliance = (
        db.query(models.Appliance)
        .filter(models.Appliance.node_id == node_id)
        .filter(models.Appliance.relay_key == relay_key)
        .first()
    )

    if not appliance:
        raise HTTPException(status_code=404, detail="Appliance not found")

    if request.state not in ["ON", "OFF"]:
        raise HTTPException(status_code=400, detail="State must be 'ON' or 'OFF'")

    # 1. Update the Python object
    appliance.status = request.state

    # 2. Commit the transaction to Postgres FIRST
    db.commit()
    db.refresh(appliance) # Safe to call now, though technically optional after a simple commit

    # 3. Fire the MQTT command SECOND (only runs if the database save was successful)
    mqtt_client.publish(
        f"{PROJECT_ID}/{node_id}/relay/control", f"{appliance.pin}:{request.state}"
    )

    return {
        "success": True,
        "message": f"Dispatched {request.state} to {relay_key}",
        "current_state": appliance.status,
    }