const fs = require('fs');
const path = require('path');

const NUM_ROWS = 1000;
const OUTPUT_FILE = path.join(__dirname, 'synthetic_dataset.csv');

let csvContent = "timestamp,sensor_id,temperature,vibration_x,vibration_y,vibration_z,status\n";

let currentTime = new Date();

for (let i = 0; i < NUM_ROWS; i++) {
    // Generate data
    let temp = 40 + (Math.random() * 10); // 40 to 50
    let vibX = (Math.random() * 0.4) - 0.2;
    let vibY = (Math.random() * 0.4) - 0.2;
    let vibZ = 1.0 + ((Math.random() * 0.4) - 0.2);
    
    // Inject anomalies 5% of the time
    if (Math.random() < 0.05) {
        temp += 20; // spike temp
        vibX += 1.0; // spike vibration
        vibZ += 1.0;
    }

    let rms = Math.sqrt(vibX*vibX + vibY*vibY + vibZ*vibZ);
    let status = "Normal";
    
    if (temp > 60 || rms > 1.5) {
        status = "Critical";
    } else if (temp > 50 || rms > 1.2) {
        status = "Warning";
    }

    let timestamp = new Date(currentTime.getTime() + (i * 5000)).toISOString().replace('T', ' ').substring(0, 19);
    
    csvContent += `${timestamp},node_001,${temp.toFixed(2)},${vibX.toFixed(3)},${vibY.toFixed(3)},${vibZ.toFixed(3)},${status}\n`;
}

fs.writeFileSync(OUTPUT_FILE, csvContent);
console.log(`Successfully generated ${NUM_ROWS} rows of synthetic data in ${OUTPUT_FILE}`);
