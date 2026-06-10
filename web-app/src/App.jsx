import React, { useState, useEffect } from "react";

const API_BASE_URL = "http://127.0.0.1:8000";

function App() {
  const [appliances, setAppliances] = useState({});
  const [totalOn, setTotalOn] = useState(0);
  const [totalNodes, setTotalNodes] = useState(0);
  const [activeNode, setActiveNode] = useState("node1"); // Default selected node
  const [loading, setLoading] = useState(true);

  const fetchState = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/appliances`);
      const data = await response.json();
      setAppliances(data.appliances);
      setTotalOn(data.total_on_appliances);
      setTotalNodes(data.total_nodes);
      setLoading(false);
    } catch (error) {
      console.error("Error connecting to backend gateway:", error);
    }
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 3000);
    return () => clearInterval(interval);
  }, []);

  const toggleAppliance = async (relayKey, currentStatus) => {
    const nextState = currentStatus === "ON" ? "OFF" : "ON";

    // Optimistic UI Update for nested node object structure
    setAppliances((prev) => ({
      ...prev,
      [activeNode]: {
        ...prev[activeNode],
        [relayKey]: {
          ...prev[activeNode][relayKey],
          status: nextState,
        },
      },
    }));

    if (nextState === "ON") setTotalOn((c) => c + 1);
    else setTotalOn((c) => c - 1);

    try {
      // Hits the dynamic path matching your /appliances/control/{node_id} endpoint
      await fetch(`${API_BASE_URL}/appliances/control/${activeNode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          appliance_id: relayKey, // Sending the key (relay_1, relay_2, etc.)
          state: nextState 
        }),
      });
    } catch (error) {
      console.error("Failed to transmit hardware state change:", error);
      fetchState(); // Rollback to server state if connection drops
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <h3 className="text-slate-600 font-medium">Loading LogicNode Matrix...</h3>
        </div>
      </div>
    );
  }

  // Safely extract the relays for the currently selected node tab
  const currentNodeRelays = appliances[activeNode] || {};

  return (
    <div className="max-w-md mx-auto px-4 py-6 bg-slate-50 min-h-screen font-sans antialiased">
      
      {/* Header Stat Board */}
      <header className="bg-slate-900 text-white p-6 rounded-2xl mb-6 shadow-xl shadow-slate-900/10 transition-all">
        <div className="flex justify-between items-center opacity-75">
          <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">LogicNode Infrastructure</h3>
          <span className="text-xs bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700">{totalNodes} Active Nodes</span>
        </div>
        <h1 className="text-3xl font-extrabold mt-3 tracking-tight">{totalOn} Active</h1>
        <p className="text-sm opacity-80 mt-1">Appliances currently running in department</p>
      </header>

      {/* Node Switcher Tabs */}
      <div className="mb-6">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Select Hub Node</label>
        <div className="flex bg-slate-200/80 p-1 rounded-xl gap-1">
          {Object.keys(appliances).map((nodeId) => (
            <button
              key={nodeId}
              onClick={() => setActiveNode(nodeId)}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg capitalize transition-all duration-150 ${
                activeNode === nodeId
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {nodeId}
            </button>
          ))}
        </div>
      </div>

      {/* Appliances List for Selected Node */}
      <main>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-md font-bold text-slate-800 uppercase tracking-wide">Device Controls</h2>
          <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full capitalize">
            Viewing {activeNode}
          </span>
        </div>
        
        <div className="space-y-3">
          {Object.entries(currentNodeRelays).length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No appliances registered to this node.</p>
          ) : (
            Object.entries(currentNodeRelays).map(([relayKey, relayData]) => {
              const isOn = relayData.status === "ON";
              return (
                <div 
                  key={relayKey} 
                  className={`bg-white p-4 rounded-xl flex justify-between items-center shadow-sm border transition-all duration-200 ${
                    isOn ? "border-emerald-500 ring-1 ring-emerald-500/20" : "border-slate-200/60"
                  }`}
                >
                  <div>
                    <h4 className="font-semibold text-slate-900 text-base leading-tight">{relayData.name}</h4>
                    <div className="flex gap-2 items-center mt-1.5">
                      <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {relayData.location}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        Pin {relayData.pin}
                      </span>
                    </div>
                  </div>

                  {/* Switch Action Trigger */}
                  <button 
                    onClick={() => toggleAppliance(relayKey, relayData.status)}
                    className={`px-4 py-2 text-xs font-bold tracking-wider rounded-full transition-all duration-150 border uppercase ${
                      isOn 
                        ? "bg-emerald-500 text-white border-emerald-600 shadow-md shadow-emerald-500/10 active:scale-95" 
                        : "bg-white text-slate-600 border-slate-300 hover:border-slate-400 active:bg-slate-50"
                    }`}
                  >
                    {isOn ? "Running" : "Off"}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}

export default App;