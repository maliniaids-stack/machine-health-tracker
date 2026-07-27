#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>

// --- Configuration ---
const char* ssid = "Wokwi-GUEST";       // Default Wokwi WiFi
const char* password = "";
const char* serverName = "http://ef6722de91c688.lhr.life/api/data"; // Use http:// to avoid SSL handshake timeout in Wokwi
const String machineId = "node_001";

// --- Timing (Non-blocking) ---
unsigned long previousMillis = 0;
const long interval = 2000; // Send data every 2 seconds

// --- Signal Smoothing (Moving Average) ---
const int numReadings = 5;
float tempReadings[numReadings];
float vibReadings[numReadings];
int readIndex = 0;

void setup() {
  Serial.begin(115200);
  
  // Initialize smoothing arrays to 0
  for (int i = 0; i < numReadings; i++) {
    tempReadings[i] = 0;
    vibReadings[i] = 0;
  }

  WiFi.begin(ssid, password);
  Serial.println("Connecting to WiFi...");
  while(WiFi.status() != WL_CONNECTED) { 
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.print("Connected to WiFi network with IP Address: ");
  Serial.println(WiFi.localIP());
}

// Helper: Calculate moving average
float calculateAverage(float readings[], int size) {
  float sum = 0;
  for(int i = 0; i < size; i++){
    sum += readings[i];
  }
  return sum / size;
}

void loop() {
  unsigned long currentMillis = millis();

  // Non-blocking timer
  if (currentMillis - previousMillis >= interval) {
    previousMillis = currentMillis;

    // --- Anomaly Injection (For Video Demo) ---
    static int anomalyCounter = 0;
    static int spikeCounter = 0;
    
    // 5% chance to start a critical event that lasts for 15 seconds (8 readings)
    if (anomalyCounter == 0 && spikeCounter == 0 && random(0, 100) < 5) { 
        anomalyCounter = 8; 
    }
    // 5% chance to inject a single one-off spike
    else if (anomalyCounter == 0 && spikeCounter == 0 && random(0, 100) < 5) {
        spikeCounter = 1;
    }

    // 1. Read Simulated Sensors
    float rawTemp = 40.0 + random(-50, 50) / 10.0; 
    float rawVib = 0.5 + random(-20, 20) / 100.0; // Base vibration 0.5g

    // If a lasting anomaly is happening, artificially spike the values
    if (anomalyCounter > 0) {
        rawTemp += 45.0; // Pushes temp to ~85C (Critical > 75)
        rawVib += 1.5;  // Pushes vibration well above 1.5 (Critical)
        anomalyCounter--;
    } 
    // If a one-off spike is happening, spike just for this reading
    else if (spikeCounter > 0) {
        rawTemp += 45.0; // Pushes temp to ~85C
        rawVib += 1.5;
        spikeCounter--;
    }

    // 2. Plausibility Checks (Ignore physically impossible spikes)
    if (rawTemp < -10 || rawTemp > 150) {
      Serial.println("Warning: Implausible temperature detected. Discarding.");
      return; 
    }

    // 3. Signal Smoothing (Update moving average arrays)
    tempReadings[readIndex] = rawTemp;
    vibReadings[readIndex] = rawVib;
    
    readIndex = (readIndex + 1) % numReadings;

    // Calculate smoothed values
    float smoothTemp = calculateAverage(tempReadings, numReadings);
    float smoothVib = calculateAverage(vibReadings, numReadings);

    // 4. Status Evaluation (with Persistence Check)
    static int consecutiveCritical = 0;
    static int consecutiveWarning = 0;
    static String currentStatus = "Normal";
    
    // Threshold changed: Critical Temp from 60 to 75
    bool isCritical = (rawTemp > 75 || rawVib > 1.5);
    bool isWarning = (rawTemp > 50 || rawVib > 1.2);

    if (isCritical) {
      consecutiveCritical++;
      consecutiveWarning = 0;
    } else if (isWarning) {
      consecutiveWarning++;
      consecutiveCritical = 0;
    } else {
      consecutiveCritical = 0;
      consecutiveWarning = 0;
    }

    // Must stay true for 3 consecutive readings (ignoring single spikes)
    if (consecutiveCritical >= 3) {
      currentStatus = "Critical";
    } else if (consecutiveWarning >= 3) {
      currentStatus = "Warning";
    } else if (consecutiveCritical == 0 && consecutiveWarning == 0) {
      currentStatus = "Normal";
    }
    
    String alert_flag = currentStatus;

    // 5. Send HTTP POST Request
    if(WiFi.status() == WL_CONNECTED){
      HTTPClient http;
      
      if (String(serverName).startsWith("https")) {
        WiFiClientSecure secureClient;
        secureClient.setInsecure();
        http.begin(secureClient, serverName);
      } else {
        WiFiClient plainClient;
        http.begin(plainClient, serverName);
      }
      
      http.addHeader("Content-Type", "application/json");
      http.addHeader("Bypass-Tunnel-Reminder", "true");
      http.addHeader("ngrok-skip-browser-warning", "true");

      // Construct JSON payload
      String jsonPayload = "{";
      jsonPayload += "\"machine_id\":\"" + machineId + "\",";
      jsonPayload += "\"temperature\":" + String(smoothTemp) + ",";
      jsonPayload += "\"vibration\":" + String(smoothVib) + ",";
      jsonPayload += "\"alert_flag\":\"" + alert_flag + "\"";
      jsonPayload += "}";

      int httpResponseCode = http.POST(jsonPayload);
      
      Serial.print("HTTP Response code: ");
      Serial.println(httpResponseCode);
      if(httpResponseCode > 0){
        String response = http.getString();
        Serial.println(response);
      }
      
      http.end();
    } else {
      Serial.println("WiFi Disconnected");
    }
  }
}
