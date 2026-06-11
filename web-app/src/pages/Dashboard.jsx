import React, { useState, useEffect } from "react";

const API_BASE_URL = "http://127.0.0.1:8000";

function Dashboard({ nodes, setTotalOn, setNodes, globalFetch }) {

  const [selectedDashboardNode, setSelectedDashboardNode] = useState(null);

  useEffect(() => {
    globalFetch();
    const interval = setInterval(globalFetch, 3000);
    return () => clearInterval(interval);
  }, []);

  // Appliance Control Toggle Switch Handler
  const toggleAppliance = async (nodeId, relayKey, currentStatus) => {
    const nextState = currentStatus === "ON" ? "OFF" : "ON";

    // Optimistic state updates for zero-latency mobile interactions
    setNodes((prev) => {
      const updated = { ...prev };
      if (updated[nodeId]?.appliances?.[relayKey]) {
        updated[nodeId].appliances[relayKey].status = nextState;
      }
      return updated;
    });
    setTotalOn((prev) => (nextState === "ON" ? prev + 1 : prev - 1));

    try {
      await fetch(`${API_BASE_URL}/appliances/control/${nodeId}/${relayKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: nextState }),
      });
    } catch (error) {
      console.error("Network synchronization abort:", error);
      globalFetch(); // Rollback on hardware connection dropping
    }
  };
  return (
    <>
      <div>
        {!selectedDashboardNode ? (
          <div>
            {/* <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Department Blueprint</h2> */}
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(nodes).map(([id, node]) => {
                // Count only active appliances running under this specific hub layout
                const activeApps = Object.values(node.appliances).filter(a => a.is_active);
                const onAppsCount = activeApps.filter(a => a.status === "ON").length;

                return (
                  <button
                    key={id}
                    onClick={() => setSelectedDashboardNode(id)}
                    className="bg-slate-900 border border-slate-800 p-5 rounded-2xl text-left hover:border-indigo-500/50 active:scale-98 transition-all flex flex-col justify-between h-36 relative group overflow-hidden shadow-lg"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl group-hover:bg-indigo-500/10 transition-all" />
                    <div>
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">{id}</span>
                      <h3 className="text-base font-bold text-slate-200 mt-1 line-clamp-1">{node.name}</h3>
                    </div>
                    <div className="mt-4 flex justify-between items-center w-full z-10">
                      <span className="text-xs text-slate-400 font-medium">{activeApps.length} Deployed</span>
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full 
                          `}>
                        {onAppsCount} Running
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Sub-View: Dynamic Single Room Appliance Overlay Control Stack */
          <div>
            <button
              onClick={() => setSelectedDashboardNode(null)}
              className="mb-6 flex items-center text-xs font-bold uppercase tracking-wider text-indigo-400 hover:text-indigo-300"
            >
              ← Back to Blueprints
            </button>
            <div className="bg-gradient-to-br from-slate-900 to-slate-900/60 p-6 rounded-2xl border border-slate-800 mb-6 shadow-xl">
              <span className="text-xs font-mono text-slate-500 block uppercase">{selectedDashboardNode}</span>
              <h2 className="text-2xl font-black tracking-tight mt-1 text-slate-100">{nodes[selectedDashboardNode]?.name}</h2>
            </div>

            <div className="space-y-3">
              {Object.entries(nodes[selectedDashboardNode]?.appliances || {})
                .filter(([_, data]) => data.is_active) // STATED REQUIREMENT: View only active items
                .map(([relayKey, relayData]) => {
                  const isOn = relayData.status === "ON";
                  return (
                    <div key={relayKey} className={`p-4 bg-slate-900 border rounded-2xl flex justify-between items-center transition-all ${isOn ? "border-emerald-500/50 bg-emerald-950/5" : "border-slate-800"}`}>
                      <div>
                        <h4 className="font-bold text-slate-200 text-base">{relayData.name}</h4>
                        <div className="flex gap-2 items-center mt-1.5">
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded uppercase font-semibold">{relayKey}</span>
                          <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/50 px-2 py-0.5 rounded font-semibold">GPIO {relayData.pin}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleAppliance(selectedDashboardNode, relayKey, relayData.status)}
                        className={`w-14 h-8 rounded-full p-1 transition-all duration-200 ${isOn ? "bg-emerald-500 flex justify-end" : "bg-slate-700 flex justify-start"}`}
                      >
                        <span className="bg-white w-6 h-6 rounded-full block shadow-md transform transition-transform" />
                      </button>
                    </div>
                  );
                })}
              {Object.values(nodes[selectedDashboardNode]?.appliances || {}).filter(a => a.is_active).length === 0 && (
                <p className="text-center text-sm text-slate-500 py-12">No active hardware channels mapped to this room infrastructure.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default Dashboard;