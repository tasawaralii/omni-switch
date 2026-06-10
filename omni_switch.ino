#include <WiFi.h>

// Replace with your network credentials
const char* ssid     = "tasawaralii";
const char* password = "12345678";

// Set web server port number to 80 (Standard HTTP port)
WiFiServer server(80);

// Variable to store the HTTP request
String header;

// Assign relay pin (We used D5 yesterday)
const int relayPin = 5;

void setup() {
  Serial.begin(115200);
  
  // Set the relay pin as an OUTPUT and turn it off by default (HIGH for active-low)
  pinMode(relayPin, OUTPUT);
  digitalWrite(relayPin, HIGH); 

  // Connect to Wi-Fi network
  Serial.print("Connecting to ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  // Print local IP address and start web server
  Serial.println("");
  Serial.println("WiFi connected.");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
  server.begin();
}

void loop() {
  WiFiClient client = server.available();   // Listen for incoming clients (like your mobile browser)

  if (client) {                             // If a new client connects,
    Serial.println("New Client.");          
    String currentLine = "";                // make a String to hold incoming data from the client
    while (client.connected()) {            // loop while the client's connected
      if (client.available()) {             // if there's bytes to read from the client,
        char c = client.read();             // read a byte
        Serial.write(c);                    // print it out the serial monitor
        header += c;
        if (c == '\n') {                    // if the byte is a newline character
          // if the current line is blank, you got two newline characters in a row.
          // that's the end of the client HTTP request, so send a response:
          if (currentLine.length() == 0) {
            // HTTP headers always start with a response code (e.g. HTTP/1.1 200 OK)
            client.println("HTTP/1.1 200 OK");
            client.println("Content-type:text/html");
            client.println("Connection: close");
            client.println();
            
            // Turns the GPIOs on and off based on URL routes
            if (header.indexOf("GET /relay/on") >= 0) {
              Serial.println("Relay ON");
              digitalWrite(relayPin, LOW); // Active Low turns relay ON
            } else if (header.indexOf("GET /relay/off") >= 0) {
              Serial.println("Relay OFF");
              digitalWrite(relayPin, HIGH); // Active Low turns relay OFF
            }
            
            // Display the HTML web page
            client.println("<!DOCTYPE html><html>");
            client.println("<head><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">");
            client.println("<style>html { font-family: Arial; text-align: center;}");
            client.println(".button { background-color: #4CAF50; border: none; color: white; padding: 16px 40px; text-decoration: none; font-size: 30px; margin: 2px; cursor: pointer;}");
            client.println(".button2 {background-color: #f44336;}</style></head>");
            
            // Web Page Heading
            client.println("<body><h1>LogicNode Minimal Control</h1>");
            
            // Display buttons for Relay
            client.println("<p><a href=\"/relay/on\"><button class=\"button\">TURN ON</button></a></p>");
            client.println("<p><a href=\"/relay/off\"><button class=\"button button2\">TURN OFF</button></a></p>");
            client.println("</body></html>");
            
            // The HTTP response ends with another blank line
            client.println();
            break;
          } else { // if you got a newline, then clear currentLine
            currentLine = "";
          }
        } else if (c != '\r') {  // if you got anything else but a carriage return character,
          currentLine += c;      // add it to the end of the currentLine
        }
      }
    }
    // Clear the header variable
    header = "";
    // Close the connection
    client.stop();
    Serial.println("Client disconnected.");
    Serial.println("");
  }
}