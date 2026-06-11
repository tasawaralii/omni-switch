import React, { useState, useEffect } from "react";
import Dashboard from "./pages/Dashboard"; // Ensure casing matches your file structure
import Config from "./pages/Config";       // Ensure casing matches your file structure

const API_BASE_URL = import.meta.env.VITE_API_URL;

function App() {
  // Navigation State: 'dashboard' | 'config'
  const [activeTab, setActiveTab] = useState("dashboard");

  // Global State
  const [nodes, setNodes] = useState({});
  const [totalOn, setTotalOn] = useState(0);
  const [totalNodes, setTotalNodes] = useState(0);
  const [loading, setLoading] = useState(true);

  // Polling mechanism to sync with FastAPI layer
  const fetchState = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/appliances`);
      const data = await response.json();
      setNodes(data.nodes || {});
      setTotalOn(data.total_on_appliances || 0);
      setTotalNodes(data.total_nodes || 0);
      setLoading(false);
    } catch (error) {
      console.error("Failed syncing infrastructure topology:", error);
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

  if (loading) {
    return (
      <div className="w-full max-w-md mx-auto flex justify-center items-center h-screen bg-slate-950 text-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-sm font-semibold tracking-wider text-slate-400">SYNCING SYSTEM SCHEMATICS...</p>
        </div>
      </div>
    );
  }

  return (
    // FIX 1: Added 'w-full' here to force the container to expand consistently across all views
    <div className="w-full max-w-md mx-auto bg-slate-950 min-h-screen text-slate-100 font-sans pb-24 relative flex flex-col shadow-2xl">
      
      {/* Universal Mobile Top Header bar status widget */}
      <header className="p-6 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-800 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">LogicNode</h1>
        </div>
      </header>

      {/* Main Core View Router Content Blocks */}
      <div className="flex-1 px-4 py-6">
        {activeTab === "dashboard" ? (
          <Dashboard nodes={nodes} setTotalOn={setTotalOn} setNodes={setNodes} globalFetch={fetchState}/>
        ) : (
          <Config globalFetch={fetchState} />
        )}
      </div>
    
      {/* FIX 2: Added 'w-full' here to ensure the fixed footer respects the max-w-md constraint perfectly */}
      <footer className="fixed bottom-0 left-0 right-0 w-full max-w-md mx-auto bg-slate-900/90 backdrop-blur-md border-t border-slate-800 z-40 px-6 py-2.5 flex justify-around shadow-2xl">
        <button
          onClick={() => { setActiveTab("dashboard");}}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === "dashboard" ? "text-indigo-400" : "text-slate-500 hover:text-slate-300"}`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V16zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V16z" />
          </svg>
          <span className="text-[10px] font-bold tracking-wider uppercase">Dashboard</span>
        </button>

        <button
          onClick={() => { setActiveTab("config");}}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === "config" ? "text-indigo-400" : "text-slate-500 hover:text-slate-300"}`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-[10px] font-bold tracking-wider uppercase">Provision</span>
        </button>
      </footer>
    </div>
  );
}

export default App;