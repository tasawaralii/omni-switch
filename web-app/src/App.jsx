import React, { useState, useEffect } from "react";

const API_BASE_URL = "http://127.0.0.1:8000";

function App() {
  const [appliances, setAppliances] = useState({});
  const [totalOn, setTotalOn] = useState(0);
  const [loading, setLoading] = useState(true);

  // Poll the API every 3 seconds to keep data synchronized and accurate
  const fetchState = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/appliances`);
      const data = await response.json();
      setAppliances(data.appliances);
      setTotalOn(data.total_on_appliances);
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

  const toggleAppliance = async (id, currentStatus) => {
    const nextState = currentStatus === "ON" ? "OFF" : "ON";
    
    // Optimistic UI Update: change state locally first for zero perceived latency
    setAppliances((prev) => ({
      ...prev,
      [id]: { ...prev[id], status: nextState },
    }));
    if (nextState === "ON") setTotalOn((c) => c + 1);
    else setTotalOn((c) => c - 1);

    try {
      await fetch(`${API_BASE_URL}/appliances/control`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appliance_id: id, state: nextState }),
      });
    } catch (error) {
      console.error("Failed to transmit hardware state change:", error);
      fetchState(); // Revert back to server state if network handshake fails
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontFamily: "Arial" }}>
        <h3>Loading System Node Configurations...</h3>
      </div>
    );
  }

  return (
    <div style={{ maxW: "480px", margin: "0 auto", padding: "20px", fontFamily: "system-ui, sans-serif", backgroundColor: "#f9f9fb", minHeight: "100vh" }}>
      {/* Header Widget */}
      <header style={{ backgroundColor: "#1e1e2f", color: "white", padding: "24px", borderRadius: "16px", marginBottom: "20px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
        <h3 style={{ margin: 0, fontSize: "14px", textTransform: "uppercase", letterSpacing: "1px", opacity: 0.7 }}>LogicNode Central</h3>
        <h1 style={{ margin: "8px 0 0 0", fontSize: "28px" }}>{totalOn} Active</h1>
        <p style={{ margin: "4px 0 0 0", fontSize: "14px", opacity: 0.8 }}>Appliances running in department</p>
      </header>

      {/* Main Grid Section */}
      <main>
        <h2 style={{ fontSize: "18px", marginBottom: "12px", color: "#333" }}>Department Blueprint</h2>
        
        {Object.entries(appliances).map(([id, app]) => (
          <div key={id} style={{
            backgroundColor: "white",
            padding: "16px",
            borderRadius: "12px",
            marginBottom: "12px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
            border: app.status === "ON" ? "1px solid #4edf7a" : "1px solid #eaeaea",
            transition: "all 0.2s ease"
          }}>
            <div>
              <h4 style={{ margin: 0, fontSize: "16px", color: "#111" }}>{app.name}</h4>
              <span style={{ fontSize: "12px", color: "#888", backgroundColor: "#f1f1f5", padding: "2px 6px", borderRadius: "4px", marginTop: "4px", display: "inline-block" }}>
                {app.location}
              </span>
            </div>

            {/* Toggle Switch Button */}
            <button 
              onClick={() => toggleAppliance(id, app.status)}
              style={{
                backgroundColor: app.status === "ON" ? "#4edf7a" : "#e4e4e7",
                color: app.status === "ON" ? "white" : "#333",
                border: "none",
                padding: "10px 20px",
                borderRadius: "20px",
                fontWeight: "bold",
                cursor: "pointer",
                boxShadow: app.status === "ON" ? "0 4px 8px rgba(78,223,122,0.2)" : "none",
                transition: "all 0.2s ease"
              }}
            >
              {app.status === "ON" ? "RUNNING" : "OFF"}
            </button>
          </div>
        ))}
      </main>
    </div>
  );
}

export default App;