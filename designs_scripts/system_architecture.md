# System Architecture Flowchart

![System Flowchart](C:\Users\Malini S\.gemini\antigravity-ide\brain\d40d9bd3-527d-4b5f-a551-e0d8b38bef77\system_architecture_flowchart_1785074455162.png)
### Architecture Breakdown
1. **IoT Edge Node**: The ESP32 gathers raw analog/digital data from the sensors. Before transmitting, it applies a digital Moving Average filter and checks if the values are physically plausible.
2. **Backend**: A REST API built with Express.js acts as the middleman, taking the cleaned JSON payload and executing SQL `INSERT` commands to save the data historically.
3. **Frontend**: The browser runs an independent script that polls the backend `GET` endpoint, calculating the final Vibration RMS and driving the UI rendering.
