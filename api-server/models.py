from sqlalchemy import Column, String, Integer, ForeignKey, Boolean, UniqueConstraint
from sqlalchemy.orm import relationship
from database import Base

class Node(Base):
    __tablename__ = "nodes"
    
    id = Column(String(50), primary_key=True, index=True) # e.g., "node1"
    name = Column(String(100), nullable=False)            # e.g., "Computer Org Lab Room 202"
    pin_capacity = Column(Integer, nullable=False)        # e.g., 4 or 8 relays
    
    # Cascade deletes: If a node is removed, wipe its appliance rows out automatically
    appliances = relationship("Appliance", back_populates="owner", cascade="all, delete-orphan")


class Appliance(Base):
    __tablename__ = "appliances"
    
    id = Column(Integer, primary_key=True, index=True)
    node_id = Column(String(50), ForeignKey("nodes.id"), nullable=False)
    relay_key = Column(String(20), nullable=False)       # e.g., "relay_1", "relay_2"
    pin = Column(String(10), nullable=False)             # Hardware GPIO Pin e.g., "4", "5"
    name = Column(String(100), nullable=False)           # User customized name or default
    status = Column(String(10), default="OFF")           # "ON" or "OFF"
    is_active = Column(Boolean, default=False)           # Hidden/locked from main UI if False
    
    owner = relationship("Node", back_populates="appliances")

    # Enforce database integrity: Prevent duplicate pin mappings on the same ESP32 node
    __table_args__ = (
        UniqueConstraint('node_id', 'pin', name='_node_pin_uc'),
        UniqueConstraint('node_id', 'relay_key', name='_node_relay_key_uc'),
    )