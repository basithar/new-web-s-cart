/**
 * =========================================================================
 *                   ESP32-S3 RFID SMART SHOPPING CART FIRMWARE
 * =========================================================================
 * 
 * This sketch runs on an ESP32-S3 microcontroller. It integrates:
 *  - MFRC522 RFID Reader (via SPI)
 *  - HX711 Load Cell Scale (telemetry weight sensor)
 *  - SSD1306 128x64 I2C OLED Display
 *  - REMOVE Mode Button (GPIO 4)
 *  - STOP Shopping Button (GPIO 3)
 * 
 * Dependencies (Install via Arduino Library Manager):
 *  - MFRC522 by githubyves
 *  - HX711 Arduino Library by bogde
 *  - Adafruit SSD1306 & Adafruit GFX Library
 *  - ArduinoJson by Benoit Blanchon
 * 
 * -------------------------------------------------------------------------
 * 🔴 ESP32-S3 Hardware Pin Mappings:
 * -------------------------------------------------------------------------
 *   RC522 Pin  |  ESP32-S3 Pin  |  Description
 *   -----------|----------------|-----------------------------------------
 *   SDA (SS)   |  GPIO 10       |  SPI Chip Select
 *   SCK        |  GPIO 12       |  SPI Clock
 *   MOSI       |  GPIO 11       |  SPI MOSI
 *   MISO       |  GPIO 13       |  SPI MISO
 *   RST        |  GPIO 9        |  RC522 Reset
 * 
 *   OLED Pin   |  ESP32-S3 Pin  |  Description
 *   -----------|----------------|-----------------------------------------
 *   SDA        |  GPIO 5        |  I2C Data
 *   SCL        |  GPIO 6        |  I2C Clock
 * 
 *   HX711 Pin  |  ESP32-S3 Pin  |  Description
 *   -----------|----------------|-----------------------------------------
 *   DOUT       |  GPIO 7        |  Scale Data Output
 *   PD_SCK     |  GPIO 8        |  Scale Clock Input
 * 
 *   Buttons    |  ESP32-S3 Pin  |  Description
 *   -----------|----------------|-----------------------------------------
 *   REMOVE Button|  GPIO 4      |  Switches to Remove Item scan mode
 *   STOP Button  |  GPIO 3      |  Initiates verification checks / locks cart
 * =========================================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <Wire.h>
#include <MFRC522.h>
#include <HX711.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <ArduinoJson.h>

// --- Wi-Fi Settings ---
const char* ssid = "YOUR_WIFI_SSID";           // Replace with your WiFi SSID
const char* password = "YOUR_WIFI_PASSWORD";   // Replace with your WiFi Password

// --- API Endpoint Settings ---
// Replace with your backend server IP address or Render domain
const char* serverAddress = "https://new-web-s-cart.onrender.com"; 
const String cartId = "CART_001";

// --- Pin Allocations ---
#define RST_PIN            9    // Reset Pin for RC522
#define SS_PIN             10   // Chip Select Pin for RC522
#define OLED_SDA           5    // I2C SDA Pin
#define OLED_SCL           6    // I2C SCL Pin
#define HX711_DOUT         7    // HX711 DOUT Pin
#define HX711_SCK          8    // HX711 SCK Pin
#define REMOVE_BUTTON_PIN  4    // REMOVE mode button (Active LOW)
#define STOP_BUTTON_PIN    3    // STOP shopping button (Active LOW)

// --- OLED Specs ---
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// --- MFRC522 & Scale Instances ---
MFRC522 mfrc522(SS_PIN, RST_PIN);
HX711 scale;

// --- Global State Variables ---
float liveCartWeight = 0.0;
float cartTotalAmount = 0.0;
float cartExpectedWeight = 0.0;
bool weightMismatch = false;
String lastRfidUid = "None";
String currentStatus = "Online";

// --- Timing Intervals ---
unsigned long lastHeartbeatTime = 0;
const unsigned long heartbeatInterval = 10000; // Heartbeat every 10 seconds

unsigned long lastWeightSyncTime = 0;
const unsigned long weightSyncInterval = 2000; // Weight sync every 2 seconds

void setup() {
  Serial.begin(115200);
  while (!Serial); // Wait for Serial monitor to load
  
  Serial.println("\n-------------------------------------------");
  Serial.println("🚀 Initializing Smart Shopping Cart Kiosk...");
  Serial.println("-------------------------------------------");

  // 1. Initialize Buttons
  pinMode(REMOVE_BUTTON_PIN, INPUT_PULLUP);
  pinMode(STOP_BUTTON_PIN, INPUT_PULLUP);

  // 2. Initialize OLED screen
  Wire.begin(OLED_SDA, OLED_SCL);
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println(F("❌ SSD1306 OLED allocation failed. Checking pins..."));
  }
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(WHITE);
  display.setCursor(0, 0);
  display.println("Connecting WiFi...");
  display.display();

  // 3. Establish Wi-Fi Connection
  WiFi.begin(ssid, password);
  Serial.print("Connecting to Wi-Fi: ");
  Serial.println(ssid);
  
  int wifiTimeout = 0;
  while (WiFi.status() != WL_CONNECTED && wifiTimeout < 30) {
    delay(500);
    Serial.print(".");
    wifiTimeout++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✨ Wi-Fi Connected!");
    Serial.print("IP Address Assigned: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n⚠️ WiFi Connection timeout. Operating offline.");
  }

  // 4. Initialize SPI Bus and RC522 Reader
  SPI.begin(12, 13, 11, 10); // SCK, MISO, MOSI, SS pins for custom SPI on ESP32-S3
  mfrc522.PCD_Init();
  
  // 5. Initialize HX711 Scale
  scale.begin(HX711_DOUT, HX711_SCK);
  scale.set_scale(420.0f); // Replace with your load cell calibration factor
  scale.tare();

  Serial.println("📡 Scale calibrated and tared.");
  Serial.println("📡 RC522 Reader Initialized. Place RFID Card close to scan...");

  // Initial Cart Data Fetch
  fetchCartDetails();
  updateOledDisplay();
}

void loop() {
  // Check Wi-Fi state. Re-establish using automatic reconnect logic if dropped.
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️ Wi-Fi Disconnected. Reconnecting...");
    WiFi.reconnect();
    // Allow a brief delay for connection recovery
    delay(1000);
  }

  // 1. Read Load Cell weight sensor
  if (scale.is_ready()) {
    // Read and enforce a non-negative weight reading
    long rawVal = scale.get_units(5);
    liveCartWeight = rawVal > 0 ? (float)rawVal : 0.0f;
  }

  // 2. Check Button States
  checkButtons();

  // 3. Send Heartbeat Pings to Server (Every 10 seconds)
  if (millis() - lastHeartbeatTime >= heartbeatInterval) {
    sendHeartbeat();
    lastHeartbeatTime = millis();
  }

  // 4. Send Weight Synchronization Telemetry (Every 2 seconds)
  if (millis() - lastWeightSyncTime >= weightSyncInterval) {
    updateWeightSync();
    lastWeightSyncTime = millis();
  }

  // 5. Detect and Read RFID Tag
  if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
    // Retrieve card UID and format to a hex string
    String rfidUid = "";
    for (byte i = 0; i < mfrc522.uid.size; i++) {
      rfidUid += String(mfrc522.uid.uidByte[i] < 0x10 ? "0" : "");
      rfidUid += String(mfrc522.uid.uidByte[i], HEX);
    }
    rfidUid.toUpperCase();
    
    lastRfidUid = rfidUid;

    Serial.println("\n=================================");
    Serial.print("💳 RFID Tag Detected: ");
    Serial.println(rfidUid);
    Serial.println("=================================");

    // Determine scan behavior depending on the REMOVE Button toggle state
    // GPIO 4 pin is LOW when REMOVE button is physically pressed
    if (digitalRead(REMOVE_BUTTON_PIN) == LOW) {
      Serial.println("🔄 REMOVE Button is active. Sending cart/remove request...");
      transmitRemove(rfidUid);
    } else {
      Serial.println("📥 ADD Scan mode. Sending rfid/scan request...");
      transmitScan(rfidUid);
    }

    // Instruct reader to stop reading current tag to prevent double scans
    mfrc522.PICC_HaltA();
  }

  // Brief loop cooldown
  delay(100);
}

/**
 * Checks digital inputs for REMOVE and STOP buttons
 */
void checkButtons() {
  // Check if STOP button (GPIO 3) is pressed (LOW state)
  if (digitalRead(STOP_BUTTON_PIN) == LOW) {
    Serial.println("🛑 STOP button pressed! Triggering cart/stop verification...");
    triggerStopShopping();
    // Debounce delay to prevent double triggers
    delay(1500);
  }
}

/**
 * Sends a Wi-Fi and load cell status heartbeat to the backend API (Every 10s)
 */
void sendHeartbeat() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String url = String(serverAddress) + "/api/esp32/heartbeat";
    
    http.begin(url);
    http.addHeader("Content-Type", "application/json");

    long rssi = WiFi.RSSI();
    
    // Build JSON Payload
    StaticJsonDocument<200> doc;
    doc["cartId"] = cartId;
    doc["wifiStatus"] = "Connected";
    doc["rssi"] = rssi;
    doc["weight"] = liveCartWeight;

    String payload;
    serializeJson(doc, payload);
    
    int httpResponseCode = http.POST(payload);
    http.end();
    
    if (httpResponseCode > 0) {
      currentStatus = "Online";
    } else {
      currentStatus = "Offline";
    }
    updateOledDisplay();
  } else {
    currentStatus = "Offline";
    updateOledDisplay();
  }
}

/**
 * Sends weight scale updates to backend API (Every 2s)
 */
void updateWeightSync() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String url = String(serverAddress) + "/api/weight/update";
    
    http.begin(url);
    http.addHeader("Content-Type", "application/json");

    StaticJsonDocument<200> doc;
    doc["cartId"] = cartId;
    doc["physicalWeight"] = liveCartWeight;

    String payload;
    serializeJson(doc, payload);
    
    int httpResponseCode = http.POST(payload);
    if (httpResponseCode > 0) {
      String response = http.getString();
      parseCartResponse(response);
    }
    http.end();
  }
}

/**
 * Transmits scanned RFID tag to add it to the shopping cart
 */
void transmitScan(String uid) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String url = String(serverAddress) + "/api/rfid/scan";
    
    http.begin(url);
    http.addHeader("Content-Type", "application/json");

    StaticJsonDocument<200> doc;
    doc["uid"] = uid;
    doc["cartId"] = cartId;

    String payload;
    serializeJson(doc, payload);
    
    int httpResponseCode = http.POST(payload);
    
    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("Scan response: " + response);
      // Fetch fresh cart details to align totals and expected weight metrics
      fetchCartDetails();
    } else {
      Serial.println("Scan error: " + String(httpResponseCode));
    }
    http.end();
  }
}

/**
 * Transmits scanned RFID tag to remove it from the shopping cart
 */
void transmitRemove(String uid) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String url = String(serverAddress) + "/api/cart/remove";
    
    http.begin(url);
    http.addHeader("Content-Type", "application/json");

    StaticJsonDocument<200> doc;
    doc["uid"] = uid;
    doc["cartId"] = cartId;

    String payload;
    serializeJson(doc, payload);
    
    int httpResponseCode = http.POST(payload);
    
    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("Remove response: " + response);
      // Fetch fresh cart details to align states
      fetchCartDetails();
    } else {
      Serial.println("Remove error: " + String(httpResponseCode));
    }
    http.end();
  }
}

/**
 * Triggers STOP shopping event on backend and reads lock details
 */
void triggerStopShopping() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String url = String(serverAddress) + "/api/cart/stop";
    
    http.begin(url);
    http.addHeader("Content-Type", "application/json");

    StaticJsonDocument<200> doc;
    doc["cartId"] = cartId;
    doc["physicalWeight"] = liveCartWeight;

    String payload;
    serializeJson(doc, payload);
    
    int httpResponseCode = http.POST(payload);
    
    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("Stop response: " + response);
      parseCartResponse(response);
      
      // Render static review details on OLED
      display.clearDisplay();
      display.setTextSize(1);
      display.setCursor(0, 0);
      display.println("--- CART LOCKED ---");
      display.print("Exp Wt: "); display.print(cartExpectedWeight, 0); display.println("g");
      display.print("Act Wt: "); display.print(liveCartWeight, 0); display.println("g");
      display.print("Total:  Rs."); display.println(cartTotalAmount, 0);
      display.println("-------------------");
      display.println(weightMismatch ? "STATUS: MISMATCH!" : "STATUS: VERIFIED");
      display.display();
      return; // Skip standard loop display update
    }
    http.end();
  }
}

/**
 * Queries active cart state parameters
 */
void fetchCartDetails() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String url = String(serverAddress) + "/api/cart/" + cartId;
    
    http.begin(url);
    int httpResponseCode = http.GET();
    
    if (httpResponseCode > 0) {
      String response = http.getString();
      parseCartResponse(response);
    }
    http.end();
  }
}

/**
 * Parsers JSON cart data payload
 */
void parseCartResponse(String jsonResponse) {
  StaticJsonDocument<1536> doc;
  DeserializationError error = deserializeJson(doc, jsonResponse);
  if (!error) {
    JsonObject cartObj;
    if (doc.containsKey("cart")) {
      cartObj = doc["cart"].as<JsonObject>();
    } else {
      cartObj = doc.as<JsonObject>();
    }

    if (!cartObj.isNull()) {
      cartTotalAmount = cartObj["totalAmount"] | 0.0f;
      cartExpectedWeight = cartObj["expectedWeight"] | 0.0f;
      weightMismatch = cartObj["weightMismatch"] | false;
    }
    updateOledDisplay();
  }
}

/**
 * Dynamic I2C OLED display rendering
 */
void updateOledDisplay() {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(WHITE);
  
  // Row 1: WiFi and Online status
  display.setCursor(0, 0);
  display.print("WiFi: ");
  display.print(WiFi.status() == WL_CONNECTED ? "CONN" : "DISC");
  display.print(" | ");
  display.println(currentStatus);
  
  // Row 2: Last Scan UID
  display.print("UID: ");
  display.println(lastRfidUid);
  
  // Row 3: Weight metrics
  display.print("Weight: ");
  display.print(liveCartWeight, 0);
  display.print("g/");
  display.print(cartExpectedWeight, 0);
  display.println("g");
  
  // Row 4: Cart Total
  display.print("Total: Rs. ");
  display.println(cartTotalAmount, 0);
  
  // Row 5: Verification status
  display.print("Verify: ");
  display.println(weightMismatch ? "MISMATCH" : "OK");
  
  display.display();
}
