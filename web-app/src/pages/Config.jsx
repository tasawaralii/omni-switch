import React, { useState, useEffect } from "react";
import NodeButton from "../components/NodeButton";
import NodeNameForm from "../components/NodeNameForm";
import ApplianceConfigRow from "../components/ApplianceConfigRow";

const API_BASE_URL = "http://127.0.0.1:8000";

function Config({ globalFetch }) {
  const [localNodes, setLocalNodes] = useState({});
  const [selectedConfigNodeId, setSelectedConfigNodeId] = useState(null);
  const [showAddNodeModal, setShowAddNodeModal] = useState(false);
  const [newNodeForm, setNewNodeForm] = useState({ id: "", name: "", pin_capacity: 4, pins: ["", "", "", ""] });

  const fetchLocalConfig = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/appliances`);
      const data = await response.json();
      setLocalNodes(data.nodes || {});
    } catch (error) {
      console.error("Configuration loading error:", error);
    }
  };

  // Fetch exactly once when the config tab mounts
  useEffect(() => {
    fetchLocalConfig();
  }, []);

  const handleProvisionNode = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/nodes/provision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newNodeForm),
      });
      if (response.ok) {
        setShowAddNodeModal(false);
        setNewNodeForm({ id: "", name: "", pin_capacity: 4, pins: ["", "", "", ""] });
        await fetchLocalConfig();
        globalFetch();
      }
    } catch (error) {
      print(error);
    }
  };

  return (
    <>
      <div>
        {!selectedConfigNodeId ? (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">All nodes</h2>
              <button onClick={() => setShowAddNodeModal(true)} className="bg-indigo-600 text-white w-20 h-8 rounded-xl font-bold text-sm">
                + Add
              </button>
            </div>
            <div className="space-y-3">
              {Object.entries(localNodes).map(([id, node]) => (
                <NodeButton key={id} id={id} node={node} setSelectedConfigNodeId={setSelectedConfigNodeId} />
              ))}
            </div>
          </div>
        ) : (
          <div>
            <button onClick={() => setSelectedConfigNodeId(null)} className="mb-6 text-xs font-bold uppercase tracking-wider text-indigo-400">
              ← Back to Topology
            </button>

            <NodeNameForm 
              selectedConfigNodeId={selectedConfigNodeId} 
              nodes={localNodes} 
              setNodes={setLocalNodes} 
              refreshConfig={fetchLocalConfig}
              globalFetch={globalFetch}
            />

            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Relay Port Configurations</h3>
            <div className="space-y-3">
              {Object.entries(localNodes[selectedConfigNodeId]?.appliances || {}).map(([relayKey, relayData]) => (
                <ApplianceConfigRow 
                  key={relayKey}
                  nodeId={selectedConfigNodeId}
                  relayKey={relayKey}
                  relayData={relayData}
                  refreshConfig={fetchLocalConfig}
                  globalFetch={globalFetch}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Node Modal stays exactly same as your previous code snippet */}
      {showAddNodeModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex justify-center items-end z-50">
          <div className="bg-slate-900 border-t border-slate-800 rounded-t-3xl p-6 w-full max-w-md max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-black text-slate-100">Provision ESP32 Hub</h3>
              <button onClick={() => setShowAddNodeModal(false)} className="text-slate-400 bg-slate-800 h-7 w-7 rounded-full">✕</button>
            </div>
            <form onSubmit={handleProvisionNode} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Unique Hardware ID</label>
                <input required type="text" value={newNodeForm.id} onChange={(e) => setNewNodeForm({ ...newNodeForm, id: e.target.value })} className="w-full bg-slate-950 border border-slate-800 px-4 py-2.5 rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Functional Room Location</label>
                <input required type="text" value={newNodeForm.name} onChange={(e) => setNewNodeForm({ ...newNodeForm, name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 px-4 py-2.5 rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Relay Capacity</label>
                <select value={newNodeForm.pin_capacity} onChange={(e) => { const cap = parseInt(e.target.value); setNewNodeForm({ ...newNodeForm, pin_capacity: cap, pins: Array(cap).fill("") }); }} className="w-full bg-slate-950 border border-slate-800 px-4 py-2.5 rounded-xl text-sm">
                  <option value={4}>4 Channels</option>
                  <option value={8}>8 Channels</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-2">Assign Pins</label>
                <div className="grid grid-cols-2 gap-2">
                  {newNodeForm.pins.map((pin, i) => (
                    <div key={i} className="flex bg-slate-950 border border-slate-800 items-center px-3 py-1.5 rounded-xl">
                      <span className="text-xs font-mono text-slate-500 pr-2">R_{i + 1}</span>
                      <input required type="text" value={pin} onChange={(e) => { const updatedPins = [...newNodeForm.pins]; updatedPins[i] = e.target.value; setNewNodeForm({ ...newNodeForm, pins: updatedPins }); }} className="w-full bg-transparent outline-none pl-3 text-sm text-indigo-400" />
                    </div>
                  ))}
                </div>
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl uppercase text-sm tracking-wider">
                Provision Hub
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default Config;