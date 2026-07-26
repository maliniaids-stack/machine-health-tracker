const API_URL = 'http://localhost:3000/api/data';

// Chart instances
let tempChart = null;
let vibChart = null;

// DOM Elements
const refreshBtn = document.getElementById('refreshBtn');
const sensorSelect = document.getElementById('sensorSelect');
const timeLimit = document.getElementById('timeLimit');
const latestStatus = document.getElementById('latestStatus');
const latestTemp = document.getElementById('latestTemp');
const latestVib = document.getElementById('latestVib');

// Chart Defaults for Light Theme
Chart.defaults.color = '#64748b'; // Soft gray text
Chart.defaults.font.family = 'Inter, sans-serif';

function initCharts() {
    const tempCtx = document.getElementById('temperatureChart').getContext('2d');
    const vibCtx = document.getElementById('vibrationChart').getContext('2d');

    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    usePointStyle: true,
                    boxWidth: 8,
                    font: { weight: '600' }
                }
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                titleColor: '#1e293b',
                bodyColor: '#64748b',
                borderColor: 'rgba(0, 0, 0, 0.05)',
                borderWidth: 1,
                boxPadding: 4,
                padding: 10
            }
        },
        scales: {
            x: {
                grid: {
                    color: 'rgba(0, 0, 0, 0.03)',
                    drawBorder: false
                },
                ticks: {
                    maxTicksLimit: 8
                }
            },
            y: {
                grid: {
                    color: 'rgba(0, 0, 0, 0.03)',
                    drawBorder: false
                }
            }
        },
        interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
        }
    };

    tempChart = new Chart(tempCtx, {
        type: 'line',
        data: { labels: [], datasets: [] },
        options: {
            ...commonOptions,
            scales: {
                ...commonOptions.scales,
                y: { ...commonOptions.scales.y, title: { display: true, text: 'Temperature (°C)', color: '#94a3b8' } }
            }
        }
    });

    vibChart = new Chart(vibCtx, {
        type: 'line',
        data: { labels: [], datasets: [] },
        options: {
            ...commonOptions,
            scales: {
                ...commonOptions.scales,
                y: { ...commonOptions.scales.y, title: { display: true, text: 'Vibration (g)', color: '#94a3b8' } }
            }
        }
    });
}

function calculateRMS(x, y, z) {
    return Math.sqrt(x*x + y*y + z*z).toFixed(3);
}

function updateKPIs(latestData) {
    if (!latestData) {
        latestTemp.textContent = '--';
        latestVib.textContent = '--';
        setKPIStatus('Unknown');
        return;
    }

    latestTemp.textContent = latestData.temperature.toFixed(1);
    const rms = calculateRMS(latestData.vibration_x, latestData.vibration_y, latestData.vibration_z);
    latestVib.textContent = rms;
    
    setKPIStatus(latestData.status);
}

function setKPIStatus(status) {
    latestStatus.className = 'status-indicator';
    const textSpan = latestStatus.querySelector('.status-text');
    
    let statusLower = status ? status.toLowerCase() : 'unknown';
    
    if (statusLower.includes('normal')) {
        latestStatus.classList.add('status-normal');
        textSpan.textContent = 'Normal';
    } else if (statusLower.includes('warning')) {
        latestStatus.classList.add('status-warning');
        textSpan.textContent = 'Warning';
    } else if (statusLower.includes('critical')) {
        latestStatus.classList.add('status-critical');
        textSpan.textContent = 'Critical';
    } else {
        latestStatus.classList.add('status-unknown');
        textSpan.textContent = status || 'Unknown';
    }
}

async function fetchDataAndUpdate() {
    refreshBtn.classList.add('loading');
    refreshBtn.style.opacity = '0.7';
    
    try {
        const limit = timeLimit.value;
        const sensor = sensorSelect.value;
        let url = `${API_URL}?limit=${limit}`;
        if (sensor) {
            url += `&sensor_id=${sensor}`;
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        
        const chartData = [...data].reverse();
        
        updateCharts(chartData);
        updateKPIs(data[0]); 
        
    } catch (error) {
        console.error('Error fetching data:', error);
    } finally {
        refreshBtn.classList.remove('loading');
        refreshBtn.style.opacity = '1';
    }
}

function updateCharts(data) {
    const labels = data.map(d => {
        const date = new Date(d.timestamp);
        return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
    });

    // Light theme chart colors
    tempChart.data = {
        labels: labels,
        datasets: [{
            label: 'Temperature',
            data: data.map(d => d.temperature),
            borderColor: '#0ea5e9', // UI cyan/blue accent
            backgroundColor: 'rgba(14, 165, 233, 0.15)', // Light blue fill
            borderWidth: 3,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointBackgroundColor: '#ffffff',
            pointBorderColor: '#0ea5e9',
            pointBorderWidth: 2,
            tension: 0.4, // smooth curves
            fill: true
        }]
    };
    tempChart.update();

    vibChart.data = {
        labels: labels,
        datasets: [
            {
                label: 'Vibration X',
                data: data.map(d => d.vibration_x),
                borderColor: '#3b82f6', // solid blue
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.4
            },
            {
                label: 'Vibration Y',
                data: data.map(d => d.vibration_y),
                borderColor: '#10b981', // green
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.4
            },
            {
                label: 'Vibration Z',
                data: data.map(d => d.vibration_z),
                borderColor: '#8b5cf6', // purple
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.4
            }
        ]
    };
    vibChart.update();
}

refreshBtn.addEventListener('click', fetchDataAndUpdate);
sensorSelect.addEventListener('change', fetchDataAndUpdate);
timeLimit.addEventListener('change', fetchDataAndUpdate);

initCharts();
fetchDataAndUpdate();
setInterval(fetchDataAndUpdate, 5000);
