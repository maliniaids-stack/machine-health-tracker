const fs = require('fs');
const path = require('path');

const NUM_ROWS = 40;
const OUTPUT_FILE = path.join(__dirname, 'sample_data_v2.csv');

let csvContent = "reading_id,machine_id,vibration,temperature,alert_flag,recorded_at\n";

let currentTime = new Date();
let stuckVibration = null;
let consecutiveCritical = 0;
let consecutiveWarning = 0;
let currentStatus = "Normal";

for (let i = 1; i <= NUM_ROWS; i++) {
    let reading_id = i;
    let machine_id = "node_001";
    let temp = 40 + (Math.random() * 10); // 40 to 50
    let vibration = 0.5 + (Math.random() * 0.5); // 0.5 to 1.0
    
    // Inject anomalies
    if (i === 15) {
        // Missing value (temperature is empty)
        temp = "";
    } else if (i === 25) {
        // Out of range value
        temp = 999.9;
    } else if (i >= 32 && i <= 36) {
        // Stuck reading (vibration is exactly the same)
        if (stuckVibration === null) stuckVibration = vibration;
        vibration = stuckVibration;
    }

    let isCritical = temp !== "" && (temp > 75 || vibration > 1.5); //changed to 75 threshold previous was 65
    let isWarning = temp !== "" && (temp > 50 || vibration > 1.2); // warning threshold is 50

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

    if (consecutiveCritical >= 3) {
        currentStatus = "Critical";
    } else if (consecutiveWarning >= 3) {
        currentStatus = "Warning";
    } else if (consecutiveCritical == 0 && consecutiveWarning == 0) {
        currentStatus = "Normal";
    }
    
    let alert_flag = temp === "" ? "Unknown" : currentStatus;

    let recorded_at = new Date(currentTime.getTime() + (i * 5000)).toISOString().replace('T', ' ').substring(0, 19);
    
    let tempStr = temp !== "" ? temp.toFixed(2) : "";
    let vibStr = vibration.toFixed(3);
    
    // For out of range value, override tofixed if necessary, but 999.9.toFixed(2) is fine.
    if (temp === 999.9) tempStr = "999.90";

    csvContent += `${reading_id},${machine_id},${vibStr},${tempStr},${alert_flag},${recorded_at}\n`;
}

fs.writeFileSync(OUTPUT_FILE, csvContent);
console.log(`Successfully generated ${NUM_ROWS} rows of synthetic data with anomalies in ${OUTPUT_FILE}`);
