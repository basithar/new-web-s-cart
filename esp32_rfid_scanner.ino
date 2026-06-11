/**
 * =========================================================================
 *                   ESP32-S3 RFID SMART SHOPPING CART FIRMWARE
 * =========================================================================
 * 
 * This sketch runs on an ESP32-S3 connected to an MFRC522 RFID Reader.
 * It establishes a Wi-Fi connection, transmits heartbeats periodically,
 * and posts scanned card UIDs to the Express server API in real-time.
 * 
 * -------------------------------------------------------------------------
 * 🔴 MFRC522 to ESP32-S3 Hardware Pin Mappings (SPI):
 * -------------------------------------------------------------------------
 *   RC522 Pin  |  ESP32-S3 Pin  |  Description
 *   -----------|----------------|-----------------------------------------
 *   SDA (SS)   |  GPIO 10       |  SPI Chip Select (Configurable below)
 *   SCK        |  GPIO 12       |  SPI Clock
 *   MOSI       |  GPIO 11       |  SPI Master Out Slave In
 *   MISO       |  GPIO 13       |  SPI Master In Slave Out
 *   IRQ        |  N/C           |  Interrupt Request (Not used)
 *   GND        |  GND           |  Common Ground
 *   RST        |  GPIO 9        |  Reset Pin (Configurable below)
 *   3.3V       |  3.3V          |  Power Input (DO NOT connect to 5V!)
 * -------------------------------------------------------------------------
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>

// --- Wi-Fi Settings ---
const char* ssid = "YOUR_WIFI_SSID";           // Replace with your WiFi SSID
const char* password = "YOUR_WIFI_PASSWORD";   // Replace with your WiFi Password

// --- API Endpoint Settings ---
// Replace with your local machine's IP address. Do NOT use "localhost" or "127.0.0.1".
const char* serverAddress = "http://192.168.1.100:5000"; 

// --- Pin Allocations ---
#define RST_PIN   9    // Reset Pin for RC522
#define SS_PIN    10   // Chip Select Pin for RC522

MFRC522 mfrc522(SS_PIN, RST_PIN);  // Create MFRC522 instance
unsigned long lastHeartbeatTime = 0;
const unsigned long heartbeatInterval = 5000; // Heartbeat check every 5 seconds

void setup() {
  Serial.begin(115200);
  while (!Serial); // Wait for Serial monitor to load
  
  Serial.println("\n-------------------------------------------");
  Serial.println("🚀 Initializing Smart Shopping Cart Scanner...");
  Serial.println("-------------------------------------------");

  // 1. Establish Wi-Fi Connection
  WiFi.begin(ssid, password);
  Serial.print("Connecting to Wi-Fi: ");
  Serial.println(ssid);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("\n✨ Wi-Fi Connected!");
  Serial.print("IP Address Assigned: ");
  Serial.println(WiFi.localIP());

  // 2. Initialize SPI Bus and RC522 Hardware Reader
  SPI.begin(12, 13, 11, 10); // SCK, MISO, MOSI, SS pins for custom SPI on ESP32-S3
  mfrc522.PCD_Init();
  
  Serial.println("📡 RC522 Reader Initialized. Place RFID Card close to scan...");
}

void loop() {
  // Check Wi-Fi state. Re-establish if dropped.
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️ Wi-Fi Disconnected. Reconnecting...");
    WiFi.disconnect();
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) {
      delay(1000);
      Serial.print(".");
    }
    Serial.println("\n✨ Wi-Fi Re-established!");
  }

  // 3. Send Heartbeat Pings to Server
  if (millis() - lastHeartbeatTime >= heartbeatInterval) {
    sendHeartbeat();
    lastHeartbeatTime = millis();
  }

  // 4. Detect and Read RFID Tag
  // Check if new card is present
  if (!mfrc522.PICC_IsNewCardPresent()) {
    return;
  }

  // Select one of the cards
  if (!mfrc522.PICC_ReadCardSerial()) {
    return;
  }

  // Retrieve card UID and format it to a hex string
  String rfidUid = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    rfidUid += String(mfrc522.uid.uidByte[i] < 0x10 ? "0" : "");
    rfidUid += String(mfrc522.uid.uidByte[i], HEX);
  }
  rfidUid.toUpperCase(); // Normalize UID to uppercase

  Serial.println("\n=================================");
  Serial.print("💳 RFID Tag Detected: ");
  Serial.println(rfidUid);
  Serial.println("=================================");

  // Transmit tag scan to Backend API
  transmitScan(rfidUid);

  // Instruct reader to stop reading current tag to prevent double scans
  mfrc522.PICC_HaltA();
}

/**
 * Sends a Wi-Fi status heartbeat to the Express server
 */
void sendHeartbeat() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String url = String(serverAddress) + "/api/esp32/heartbeat";
    
    http.begin(url);
    http.addHeader("Content-Type", "application/json");

    // Retrieve WiFi Signal Strength (RSSI)
    long rssi = WiFi.RSSI();
    
    // Build JSON Payload
    String payload = "{\"wifiStatus\":\"Connected\",\"rssi\":" + String(rssi) + "}";
    
    int httpResponseCode = http.POST(payload);
    
    if (httpResponseCode > 0) {
      // Success. Debug output can be muted to reduce log clutter.
      // Serial.println("✓ Heartbeat sent.");
    } else {
      Serial.print("❌ Error sending heartbeat: ");
      Serial.println(http.errorToString(httpResponseCode).c_str());
    }
    
    http.end();
  }
}

/**
 * Transmits scanned RFID tag UID to backend API endpoint
 */
void transmitScan(String uid) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String url = String(serverAddress) + "/api/rfid/scan";
    
    http.begin(url);
    http.addHeader("Content-Type", "application/json");

    // Build JSON scan payload
    String payload = "{\"uid\":\"" + uid + "\"}";
    
    Serial.print("Sending POST request to: ");
    Serial.println(url);
    
    int httpResponseCode = http.POST(payload);
    
    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.print("HTTP Response Code: ");
      Serial.println(httpResponseCode);
      Serial.print("Server Response: ");
      Serial.println(response);
    } else {
      Serial.print("❌ Error sending scan POST request: ");
      Serial.println(http.errorToString(httpResponseCode).c_str());
    }
    
    http.end();
  } else {
    Serial.println("⚠️ Scan skipped - Wi-Fi is disconnected.");
  }
}
