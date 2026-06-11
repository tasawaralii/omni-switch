import React, { useState, useEffect } from "react";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const NodeNameForm = ({ selectedConfigNodeId, nodes, setNodes, refreshConfig, globalFetch }) => {
  const [nodeName, setNodeName] = useState("");

  useEffect(() => {
    if (nodes[selectedConfigNodeId]) {
      setNodeName(nodes[selectedConfigNodeId].name || "");
    }
  }, [selectedConfigNodeId, nodes]);

  const handleSaveName = async (e) => {
    e.preventDefault();
    try {
      const url = `${API_BASE_URL}/nodes/update_name/${selectedConfigNodeId}?name=${encodeURIComponent(nodeName)}`;
      const response = await fetch(url, { method: "PUT" });
      if (response.ok) {
        // Sync local static configuration view AND global memory layout state shell cleanly
        await refreshConfig();
        globalFetch();
        alert("Hub moniker adjusted successfully.");
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSaveName} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 mb-6 shadow-xl">
      <div>
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1">Hub Identifier (Locked)</label>
        <input type="text" disabled value={selectedConfigNodeId} className="w-full bg-slate-950 border border-slate-800 px-4 py-2.5 rounded-xl text-slate-500 font-mono text-sm cursor-not-allowed" />
      </div>
      <div>
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Editable Hub Name</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={nodeName}
            onChange={(e) => setNodeName(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 outline-none px-4 py-2.5 rounded-xl text-slate-100 text-sm font-medium"
            required
          />
          <button type="submit" className="bg-indigo-600 text-white font-bold px-4 rounded-xl text-xs uppercase tracking-wider">
            Save
          </button>
        </div>
      </div>
    </form>
  );
};

export default NodeNameForm;