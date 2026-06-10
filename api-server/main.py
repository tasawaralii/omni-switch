from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import paho.mqtt.client as mqtt
import random

app = FastAPI(title="LogicNode Departmental Gateway")

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

# Mock Database: Tracking appliances across the department
db_appliances = {
    "node1": {
        "relay_1": {"pin": "4", "name": "Lab 1 Main Light", "location": "Lab 1", "status": "OFF"},
        "relay_2": {"pin": "5", "name": "Lab 1 Side Light", "location": "Lab 1", "status": "OFF"},
        "relay_3": {"pin": "18", "name": "Lab 1 Projector", "location": "Lab 1", "status": "OFF"},
        "relay_4": {"pin": "19", "name": "Lab 1 Fan", "location": "Lab 1", "status": "OFF"},
    },
    "node2": {
        "relay_1": {"pin": "4", "name": "Lab 1 Main Light", "location": "Lab 1", "status": "OFF"},
        "relay_2": {"pin": "5", "name": "Lab 1 Side Light", "location": "Lab 1", "status": "OFF"},
        "relay_3": {"pin": "18", "name": "Lab 1 Projector", "location": "Lab 1", "status": "OFF"},
        "relay_4": {"pin": "19", "name": "Lab 1 Fan", "location": "Lab 1", "status": "OFF"},
    }
}

# Setup MQTT Client for Python Backend
mqtt_client = mqtt.Client(callback_api_version=mqtt.CallbackAPIVersion.VERSION2, client_id=f"FastAPI-Backend-{random.randint(0, 1000)}")

@app.on_event("startup")
def startup_event():
    # Connect to the cloud broker when FastAPI starts up
    mqtt_client.connect(MQTT_BROKER, MQTT_PORT, 60)
    mqtt_client.loop_start()

@app.on_event("shutdown")
def shutdown_event():
    mqtt_client.loop_stop()
    mqtt_client.disconnect()

class ControlRequest(BaseModel):
    appliance_id: str
    state: str  # "ON" or "OFF"

@app.get("/appliances")
def get_appliances():
    """
    Returns the current status of all appliances and calculates 
    the total number of active ('ON') appliances instantly.
    """
    total_nodes = len(db_appliances)
    on_count = sum(1 for node in db_appliances.values() for app in node.values() if app["status"] == "ON")
    return {
        "total_nodes": total_nodes,
        "total_on_appliances": on_count,
        "appliances": db_appliances
    }

@app.post("/appliances/control/{node_id}")
def control_appliance(node_id: str, request: ControlRequest):
    """
    Updates the appliance state in the database and dispatches
    the MQTT packet over the internet to trigger the physical hardware.
    """
    if node_id not in db_appliances:
        raise HTTPException(status_code=404, detail="Node not found")
    
    if request.state not in ["ON", "OFF"]:
        raise HTTPException(status_code=400, detail="State must be 'ON' or 'OFF'")
    
    # 1. Update the local state database record
    db_appliances[node_id][request.appliance_id]["status"] = request.state
    appliance = db_appliances[node_id][request.appliance_id]
    
    # 2. Fire the MQTT command over the internet to HiveMQ
    # For this basic test, any command updates our single prototype relay
    mqtt_client.publish(f"{PROJECT_ID}/{node_id}/relay/control", f"{appliance['pin']}:{request.state}")
    
    return {
        "success": True,
        "message": f"Dispatched {request.state} to {request.appliance_id}",
        "current_state": db_appliances[node_id][request.appliance_id]
    }