import React, { useState, useEffect } from "react";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const ApplianceConfigRow = ({ nodeId, relayKey, relayData, refreshConfig, globalFetch }) => {
  const [localName, setLocalName] = useState(relayData.name || "");
  const [isActive, setIsActive] = useState(relayData.is_active || false);

  useEffect(() => {
    setLocalName(relayData.name || "");
    setIsActive(relayData.is_active || false);
  }, [relayData]);

  const commitDetailsToServer = async (targetName, targetActiveStatus) => {
    try {
      // Direct path configuration matching: PUT /appliances/update/{node_id}/{relay_key}
      const url = `${API_BASE_URL}/appliances/update/${nodeId}/${relayKey}?name=${encodeURIComponent(targetName)}&is_active=${targetActiveStatus}`;
      const response = await fetch(url, { method: "PUT" });
      if (response.ok) {
        // Sync static structure config AND global data variables
        await refreshConfig();
        globalFetch();
      }
    } catch (error) {
      console.error("Error patching appliance fields:", error);
    }
  };

  const handleCheckboxChange = (e) => {
    const checked = e.target.checked;
    setIsActive(checked);
    // Fires instantly using the stable local input name state context
    commitDetailsToServer(localName, checked);
  };

  const handleInputBlur = () => {
    // Only fire PUT query string if the local modifications diverged from the persistent copy
    if (localName !== relayData.name) {
      commitDetailsToServer(localName, isActive);
    }
  };

  return (
    <div className={`p-4 rounded-2xl bg-slate-900 border transition-all duration-200 ${isActive ? "border-slate-800" : "border-slate-800/40 opacity-70"}`}>
      <div className="flex justify-between items-center mb-3">
        <div className="flex gap-2 items-center">
          <span className="text-[11px] font-mono font-bold px-2 py-0.5 bg-slate-950 border border-slate-800 rounded uppercase text-slate-400">{relayKey}</span>
          <span className="text-[11px] font-mono font-bold px-2 py-0.5 bg-indigo-950/60 border border-indigo-900/40 rounded text-indigo-400">GPIO {relayData.pin}</span>
        </div>
        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-400 select-none">
          <span>Active</span>
          <input
            type="checkbox"
            checked={isActive}
            onChange={handleCheckboxChange}
            className="accent-indigo-500 h-4 w-4 cursor-pointer"
          />
        </label>
      </div>
      
      <input
        type="text"
        disabled={!isActive}
        value={localName}
        onChange={(e) => setLocalName(e.target.value)}
        onBlur={handleInputBlur}
        placeholder="Deactivated mapping space"
        className={`w-full bg-slate-950 border outline-none px-3 py-2 rounded-xl text-sm font-medium transition-all ${
          !isActive
            ? "border-slate-800/30 text-slate-600 cursor-not-allowed"
            : "border-slate-800 focus:border-indigo-500/60 text-slate-200"
        }`}
      />
    </div>
  );
};

export default ApplianceConfigRow;