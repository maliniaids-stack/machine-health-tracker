#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>

// --- Configuration ---
const char* ssid = "Wokwi-GUEST";       // Default Wokwi WiFi
const char* password = "";
const char* serverName = "http://mynewmcm2026.loca.lt/api/data"; // Use http:// to avoid SSL handshake timeout in Wokwi
const String sensorId = "node_001";

// --- Timing (Non-blocking) ---
unsigned long previousMillis = 0;
const long interval = 2000; // Send data every 2 seconds

// --- Signal Smoothing (Moving Average) ---
const int numReadings = 5;
float tempReadings[numReadings];
float vibXReadings[numReadings];
float vibYReadings[numReadings];
float vibZReadings[numReadings];
int readIndex = 0;

void setup() {
  Serial.begin(115200);
  
  // Initialize smoothing arrays to 0
  for (int i = 0; i < numReadings; i++) {
    tempReadings[i] = 0;
    vibXReadings[i] = 0;
    vibYReadings[i] = 0;
    vibZReadings[i] = 0;
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
    // 5% chance to start a critical event that lasts for 15 seconds
    if (anomalyCounter == 0 && random(0, 100) < 5) { 
        anomalyCounter = 8; 
    }

    // 1. Read Simulated Sensors
    float rawTemp = 40.0 + random(-50, 50) / 10.0; 
    float rawVibX = random(-50, 50) / 100.0;
    float rawVibY = random(-50, 50) / 100.0;
    float rawVibZ = 1.0 + random(-20, 20) / 100.0; 

    // If an anomaly is happening, artificially spike the values
    if (anomalyCounter > 0) {
        rawTemp += 30.0; // Pushes temp to ~70C (Critical > 60)
        rawVibX += 1.5;  // Pushes RMS well above 1.5 (Critical)
        rawVibZ += 0.5;
        anomalyCounter--;
    }

    // 2. Plausibility Checks (Ignore physically impossible spikes)
    if (rawTemp < -10 || rawTemp > 150) {
      Serial.println("Warning: Implausible temperature detected. Discarding.");
      return; 
    }

    // 3. Signal Smoothing (Update moving average arrays)
    tempReadings[readIndex] = rawTemp;
    vibXReadings[readIndex] = rawVibX;
    vibYReadings[readIndex] = rawVibY;
    vibZReadings[readIndex] = rawVibZ;
    
    readIndex = (readIndex + 1) % numReadings;

    // Calculate smoothed values
    float smoothTemp = calculateAverage(tempReadings, numReadings);
    float smoothVibX = calculateAverage(vibXReadings, numReadings);
    float smoothVibY = calculateAverage(vibYReadings, numReadings);
    float smoothVibZ = calculateAverage(vibZReadings, numReadings);

    // 4. Status Evaluation (Simple RMS calculation for vibration severity)
    float rms = sqrt(pow(smoothVibX, 2) + pow(smoothVibY, 2) + pow(smoothVibZ, 2));
    String status = "Normal";
    if (smoothTemp > 60 || rms > 1.5) {
      status = "Critical";
    } else if (smoothTemp > 50 || rms > 1.2) {
      status = "Warning";
    }

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
      jsonPayload += "\"sensor_id\":\"" + sensorId + "\",";
      jsonPayload += "\"temperature\":" + String(smoothTemp) + ",";
      jsonPayload += "\"vibration_x\":" + String(smoothVibX) + ",";
      jsonPayload += "\"vibration_y\":" + String(smoothVibY) + ",";
      jsonPayload += "\"vibration_z\":" + String(smoothVibZ) + ",";
      jsonPayload += "\"status\":\"" + status + "\"";
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
