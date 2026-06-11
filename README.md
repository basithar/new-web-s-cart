# IoT Smart Shopping Cart Kiosk Platform

A fully functional **IoT Smart Shopping Cart and Mobile Checkout Kiosk** designed as an engineering final-year project demonstration. The system tracks shopping budgets in real-time, processes RFIDs using an ESP32-S3 microcontroller with an RC522 RFID reader over Wi-Fi, and handles digital checkouts with instant receipt printing.

---

## 🔌 Hardware Architecture & Pin Mappings (ESP32-S3 to MFRC522)

The system connects a physical ESP32-S3 board with an RC522 RFID card reader via the SPI bus.

| RC522 RFID Pin | ESP32-S3 GPIO Pin | Connection Description |
|:---|:---|:---|
| **SDA (SS)** | **GPIO 10** | Chip Select Pin (SS) |
| **SCK** | **GPIO 12** | SPI Serial Clock |
| **MOSI** | **GPIO 11** | SPI Master Out Slave In |
| **MISO** | **GPIO 13** | SPI Master In Slave Out |
| **IRQ** | *Not Connected* | Interrupt request (Not used) |
| **GND** | **GND** | Ground (Common Reference) |
| **RST** | **GPIO 9** | Reset Pin |
| **3.3V** | **3.3V** | Power (⚠️ **Do NOT connect to 5V!**) |

### Arduino C++ Firmware
The firmware script `esp32_rfid_scanner.ino` is located in the root directory. To run it:
1. Open `esp32_rfid_scanner.ino` in the Arduino IDE.
2. Install the **MFRC522** library by Miguel Balboa.
3. Configure your Wi-Fi SSID, Password, and your computer's local IP address (e.g., `http://192.168.1.100:5000`) inside the script.
4. Select the **ESP32S3 Dev Module** board and compile/upload.

---

## 📡 API Endpoint Interfaces

The ESP32-S3 communicates with the Express backend using these JSON endpoints:

1. **ESP32 Heartbeat** (`POST /api/esp32/heartbeat`)
   - **Payload:** `{"wifiStatus": "Connected", "rssi": -65}`
   - **Purpose:** Transmits WiFi signal strength (RSSI) every 5 seconds to keep the telemetry signal badge active on the navbar.
2. **RFID Tag Scan** (`POST /api/rfid/scan`)
   - **Payload:** `{"uid": "A1B2C3D4"}` (or barcode format)
   - **Purpose:** Looks up the UID in the product catalog, logs the scan event, inserts the product into the active shopping cart, and triggers a Socket.IO client update.

---

## 🛒 Kiosk Shopping Flow (Required Views)

The frontend features a responsive, glassmorphic layout styled using **Tailwind CSS**:

1. **Home Portal (`/`)**: Introduces the system's core capabilities (Budgets, Hardware Link, Theft Scale) with a single "Start Shopping" button.
2. **Budget Setup (`/budget-setup`)**: A calculator-style numerical keypad for setting the target shopping budget.
3. **Shopping Room (`/shopping`)**: 
   - Tracks **Total spent**, **Remaining budget**, and **Mismatches**.
   - Displays a dynamic cart item grid.
   - Includes a manual item inventory catalogue for non-hardware simulations.
   - Embeds an **IoT Scale Weight Slider** to simulate weight discrepancy alerts (pulses layout red on scale mismatch).
4. **ESP32 Dashboard (`/esp32`)**: Displays live hardware connection state, ping speeds, and a continuous rolling log of successful/unrecognized RFID scan signals.
5. **Customer Checkout (`/checkout`)**: Form page capturing buyer name, email, and phone for the invoice logs.
6. **Order Receipt (`/success`)**: Animates order completion and generates a printable invoice receipt.
7. **Store Manager Console (`/admin`)**: Fully functional product database CRUD allowing the addition/modification of RFID tag-to-product name associations.

---

## 📊 CSV Bulk Inventory Seeding Format

To load products in bulk, navigate to the **Product Admin (`/admin`)** page and copy-paste CSV rows into the bulk importer text area.

### CSV Layout Format:
```csv
rfidUid,productName,price,weight,expiryDate,category,image
RFID_100,Organic Milk,450,1000,2026-07-15,Dairy,https://images.unsplash.com/photo-1550583724-b2692b85b150
RFID_200,Whole Bread,250,450,2026-06-20,Bakery,https://images.unsplash.com/photo-1509440159596-0249088772ff
RFID_300,Basmati Rice,500,1000,2027-01-01,Groceries,https://images.unsplash.com/photo-1586201375761-83865001e31c
```

---

## 🛠️ Installation & Execution (Out-of-the-Box)

The project includes an **automatic In-Memory fallback database** and **Mock Auth bypass**. If MongoDB or Firebase aren't configured, the system seeds itself with milk, bread, and rice in-memory and runs seamlessly out-of-the-box!

### Backend Setup
```bash
cd backend
npm install
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.
