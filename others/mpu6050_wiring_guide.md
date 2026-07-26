# MPU-6050 Sensor Wiring Guide

If you ever decide to build the physical version of this project instead of using the Wokwi Simulator, here is how you connect the vibration sensor to the ESP32.

| MPU-6050 Pin | ESP32 Pin | Wire Color (Suggested) | Description |
| :--- | :--- | :--- | :--- |
| **VCC** | 3.3V | Red | Power Supply |
| **GND** | GND | Black | Ground |
| **SCL** | GPIO 22 | Yellow | I2C Clock Line |
| **SDA** | GPIO 21 | Blue | I2C Data Line |
| **XDA** | - | - | Not Used |
| **XCL** | - | - | Not Used |
| **ADO** | - | - | Not Used |
| **INT** | - | - | Not Used |

*Note: The MPU-6050 uses the I2C protocol, which only requires 2 data wires (SCL and SDA) making it extremely easy to hook up!*
