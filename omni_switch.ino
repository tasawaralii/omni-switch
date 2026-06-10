#include <WiFi.h>
#include <PubSubClient.h>

// Network Credentials
const char* ssid     = "babyxboss Mobile";
const char* password = "11111111";

// MQTT Broker Setup (Public Testing Server)
const char* mqtt_server = "broker.hivemq.com";
const int mqtt_port = 1883;

// unique string for public mqtt server identification so channel is private!
#define PROJECT_ID "omni-switch-2677" 

// MQTT Topics
const char* topic_sub = PROJECT_ID "/relay/control";
const char* topic_pub = PROJECT_ID "/relay/status";

const int relayPin = 5;

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
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

// This function runs automatically whenever a message arrives from the broker
void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived on topic: ");
  Serial.print(topic);
  Serial.print(". Message: ");
  
  String message = "";
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  Serial.println(message);

  // Control the relay based on the message
  if (message == "ON") {
    digitalWrite(relayPin, LOW);   // Turn relay ON (Active Low)
    client.publish(topic_pub, "LAMP IS ON");
  } else if (message == "OFF") {
    digitalWrite(relayPin, HIGH);  // Turn relay OFF
    client.publish(topic_pub, "LAMP IS OFF");
  }
}

void reconnect() {
  // Loop until we're reconnected
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    // Attempt to connect with a unique client ID
    String clientId = "ESP32Client-";
    clientId += String(random(0xffff), HEX);
    
    if (client.connect(clientId.c_str())) {
      Serial.println("connected to broker!");
      // Once connected, subscribe to our control topic
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
  pinMode(relayPin, OUTPUT);
  digitalWrite(relayPin, HIGH); // Default off

  setup_wifi();
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop(); // Keeps the connection alive and checks for incoming messages
}