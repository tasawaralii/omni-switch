from pydantic import BaseModel, Field
from typing import Dict, List



class ControlRequest(BaseModel):
    state: str


class NodeCreateRequest(BaseModel):
    id: str               # e.g., "node3"
    name: str             # e.g., "Lab 2"
    pin_capacity: int     # e.g., 4
    pins: List[str]
    
class ProvisionNodeResponse(BaseModel):
    success: bool = Field(..., example=True)
    message: str = Field(..., example="Successfully provisioned Node-01 with 4 isolated relay slots.")
    
class ControlApplianceResponse(BaseModel):
    success: bool = Field(..., example=True)
    message: str = Field(..., example="Dispatched ON to relay_1")
    current_state: str = Field(..., example="ON")
    
class ApplianceDetail(BaseModel):
    id: int = Field(..., example=1)
    pin: int = Field(..., example=14)
    name: str = Field(..., example="Unassigned Relay Slot 1")
    status: str = Field(..., example="OFF")
    is_active: bool = Field(..., example=False)
    
class NodeDetail(BaseModel):
    name: str = Field(..., example="Living Room Hub")
    pin_capacity: int = Field(..., example=4)
    appliances: Dict[str, ApplianceDetail] = Field(
        ..., 
        description="Dictionary mapping relay keys (e.g., 'relay_1') to appliance details"
    )
    
class GetAppliancesResponse(BaseModel):
    total_nodes: int = Field(..., example=1)
    total_on_appliances: int = Field(..., example=0)
    nodes: Dict[str, NodeDetail] = Field(
        ..., 
        description="Dictionary mapping node IDs to node details"
    )
    
    
class UpdateSuccessResponse(BaseModel):
    success: bool
    message: str