# Machine Condition Monitoring System - Project Overview

## 1. Executive Summary
The Machine Condition Monitoring (MCM) system is an end-to-end IoT solution designed to predict mechanical failures in small production units before they happen. By continuously tracking machine temperature and 3-axis vibration data, the system provides real-time alerts for maintenance teams, ensuring maximum uptime and preventing catastrophic breakdowns.

## 2. Problem Statement
In small manufacturing environments, critical rotating machinery (such as CNC machines, conveyor motors, or pumps) often run until failure. Unplanned downtime leads to massive financial losses and production delays. Manual inspections are infrequent and unreliable.

## 3. The Solution
We implemented a continuous, automated IoT monitoring system that retrofits onto existing machines:
1. **IoT Sensor Node:** An ESP32 microcontroller simulating an MPU6050 (Vibration/Accelerometer) and DHT22 (Temperature) sensor module.
2. **Edge Processing:** The ESP32 performs signal smoothing (moving average filter) and calculates the Root Mean Square (RMS) of the vibration to determine severity, rejecting false anomalies.
3. **Backend Infrastructure:** A lightweight Node.js/Express server paired with an SQLite database stores the high-frequency telemetry securely.
4. **Monitoring Dashboard:** A modern, visually stunning web interface provides operators with a real-time view of machine health, including color-coded KPI cards and responsive trend graphs.

## 4. Key Metrics & Calculations
- **Vibration RMS:** Calculated as `√(x² + y² + z²)`. RMS is an industry-standard metric for assessing the overall energy of a vibration signal. High RMS indicates unbalance, misalignment, or bearing wear.
- **Signal Smoothing:** A 5-point moving average filter smooths high-frequency noise inherent in mechanical vibrations.
- **Plausibility Filters:** Hard-coded thresholds discard physically impossible sensor readings (e.g., temperatures > 150°C instantly jumping back to 40°C), preventing false alarms.

## 5. System Architecture
Please refer to the `designs_scripts/system_architecture.md` document for a visual flowchart of the data pipeline.
