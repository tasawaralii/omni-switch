# OmniSwitch 🌐⚡

![Architecture](https://img.shields.io/badge/Architecture-Decoupled_IoT-indigo)
![Backend](https://img.shields.io/badge/Backend-FastAPI-009688)
![Frontend](https://img.shields.io/badge/Frontend-React_+_Tailwind-61DAFB)
![Hardware](https://img.shields.io/badge/Hardware-ESP32-E7352C)
![License](https://img.shields.io/badge/License-MIT-success)

**OmniSwitch** is an open-source, scalable, cloud-integrated Internet of Things (IoT) infrastructure designed to manage and control electrical appliances across laboratories, departmental rooms, and smart homes. 

Built as a decoupled full-stack ecosystem, it bridges low-level hardware (ESP32 microcontrollers) with a high-level React dashboard using a high-speed MQTT messaging pipeline and a FastAPI coordination layer.

---

## ✨ Key Features

* **Dynamic Hardware Provisioning:** Register new ESP32 hubs via a simple UI wizard and dynamically map multi-channel relays to specific GPIO pins.
* **Decoupled Architecture:** Utilizes the **MQTT Protocol** (via HiveMQ) for asynchronous, low-latency command execution, dropping traditional rigid HTTP setups.
* **Scalable Backend:** A **FastAPI** coordination layer maintaining a relational **PostgreSQL** database to store hub configurations, pin mappings, and appliance states.
* **Responsive Control Matrix:** A mobile-first **React/Tailwind** dashboard that completely isolates "Live Control" from "Hardware Configuration" views.
* **Optimistic UI:** Instant visual feedback on the frontend before the cloud handshake completes, ensuring a native-feeling experience with zero interface latency.

---

## 🛠 Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Hardware** | ESP32-WROOM-32, Active-LOW Mechanical Relay Modules |
| **Firmware** | C++, Arduino Core, `WiFi.h`, `PubSubClient` |
| **Messaging** | HiveMQ (Cloud MQTT Broker) |
| **Backend** | Python 3.10+, FastAPI, SQLAlchemy |
| **Database** | PostgreSQL |
| **Frontend** | React (Vite), Tailwind CSS v4 |

---

## 🏗 System Architecture Flow

The system operates on a Publish-Subscribe (Pub/Sub) pattern to ensure global connectivity without local network port-forwarding:

1. **User Interaction:** User toggles a switch on the React Dashboard.
2. **API Coordination:** A `POST` request is sent to the FastAPI backend.
3. **State Persistence:** FastAPI updates the PostgreSQL database ensuring structural integrity.
4. **MQTT Dispatch:** FastAPI publishes a micro-payload (e.g., `4:ON`) to a specific node's topic (e.g., `OmniSwitch/node2/relay/control`).
5. **Hardware Execution:** The ESP32 subscribed to that topic intercepts the packet, parses the GPIO pin target, and triggers the physical Active-LOW relay.

---

## 🚀 Getting Started

### Prerequisites
* Python 3.10+
* Node.js 18+
* Arduino IDE (with ESP32 board manager installed)
* A PostgreSQL Instance

### 1. Backend Setup (FastAPI)
Navigate to the backend directory, install the required dependencies, and launch the ASGI server.

```bash
cd api-server
pip install -r requirements.txt
```
*Configure your `DATABASE_URL` in `.env`.*
```bash
uvicorn main:app --reload
```

### 2. Frontend Setup (React/Vite)
Navigate to the frontend directory, install the node modules, and start the development server.

```bash
cd web-app
npm install
npm run dev
```

### 3. Hardware Setup (ESP32)
1. Open the `.ino` firmware file in Arduino IDE.
2. Update the network credentials:
   ```cpp
   const char* ssid     = "YOUR_WIFI_NAME"; // Note: Must be 2.4GHz
   const char* password = "YOUR_WIFI_PASSWORD";
   ```
3. Update the `PROJECT_ID` and `NODE_ID` to match your database provisioning.
4. Flash the code to the ESP32. Ensure the board is powered by a stable 5V source to prevent Wi-Fi radio brownouts.

---

## 💡 Hardware Engineering Notes
* **ESP32 Breadboard Spanning:** Standard ESP32 boards are too wide for standard breadboards. Use a dual-breadboard setup to expose all GPIO pins for relay wiring.
* **Active-LOW Logic:** The relay modules trigger on `LOW` (0V) and turn off on `HIGH` (3.3V). The firmware inherently handles this logic inversion.

---

## 🤝 Contributing

OmniSwitch is an open-source project, and contributions are highly welcome! Whether it's fixing bugs, improving the UI, or adding new hardware support features, your help is appreciated.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License
Distributed under the MIT License. See `LICENSE` for more information.