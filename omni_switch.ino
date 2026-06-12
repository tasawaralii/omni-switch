#include <WiFi.h>
#include <PubSubClient.h>

#define PROJECT_ID "omni-switch-2677"
#define NODE_ID "node1"

// Network Credentials
const char* ssid     = "YOUR_WIFI_NAME";
const char* password = "YOUR_WIFI_PASSWORD";

// MQTT Broker Setup
const char* mqtt_server = "broker.hivemq.com";
const int mqtt_port = 1883;

// MQTT Topics

const String topic_sub_str = String(PROJECT_ID) + "/" + String(NODE_ID) + "/relay/control";
const String topic_pub_str = String(PROJECT_ID) + "/" + String(NODE_ID) + "/relay/status";

// Convert to const char* where PubSubClient requires it
const char* topic_sub = topic_sub_str.c_str();
const char* topic_pub = topic_pub_str.c_str();

// --- MULTI-PIN CONFIGURATION ---
// Add any safe GPIO pins you want to control here
const int relayPins[] = {5, 4, 18, 19, 21}; 
const int numRelays = sizeof(relayPins) / sizeof(relayPins[0]);

WiFiClient espClient;
PubSubClient client(espClient);

void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi connected");
}

// Checks if a requested pin is inside our managed array
bool isValidPin(int pin) {
  for (int i = 0; i < numRelays; i++) {
    if (relayPins[i] == pin) return true;
  }
  return false;
}

// Callback processes commands formatted as "PIN:STATE" (e.g., "4:ON" or "18:OFF")
void callback(char* topic, byte* payload, unsigned int length) {
  String message = "";
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  
  Serial.print("Command received: ");
  Serial.println(message);

  // Parse the delimiter ':'
  int delimiterIndex = message.indexOf(':');
  if (delimiterIndex == -1) {
    Serial.println("Invalid payload format. Use 'PIN:STATE' (e.g., '4:ON')");
    return;
  }

  String pinStr = message.substring(0, delimiterIndex);
  String stateStr = message.substring(delimiterIndex + 1);

  int targetPin = pinStr.toInt();
  stateStr.toUpperCase(); // Ensure "ON" or "OFF" handling

  if (!isValidPin(targetPin)) {
    Serial.printf("Error: GPIO %d is not configured in the relay array.\n", targetPin);
    return;
  }

  // Control the specific relay (Active Low setup preserved)
  if (stateStr == "ON") {
    digitalWrite(targetPin, LOW);   
    String statusPayload = "GPIO " + String(targetPin) + " IS ON";
    client.publish(topic_pub, statusPayload.c_str());
  } else if (stateStr == "OFF") {
    digitalWrite(targetPin, HIGH);  
    String statusPayload = "GPIO " + String(targetPin) + " IS OFF";
    client.publish(topic_pub, statusPayload.c_str());
  }
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    String clientId = "ESP32Client-";
    clientId += String(random(0xffff), HEX);
    
    if (client.connect(clientId.c_str())) {
      Serial.println("connected to broker!");
      client.subscribe(topic_sub);
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);

  // Initialize all specified pins in the array
  for (int i = 0; i < numRelays; i++) {
    pinMode(relayPins[i], OUTPUT);
    digitalWrite(relayPins[i], HIGH); // Default off (Active Low)
    Serial.printf("Initialized GPIO %d as OUTPUT\n", relayPins[i]);
  }

  setup_wifi();
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
}