async function fetchTrainData(trainNumber) {
    try {
        const response = await fetch(`https://node-rahul-timbaliya.vercel.app/api/train/getTrainRouteInfo/${trainNumber}`);
        if (!response.ok) {
            throw new Error('Train not found or API error');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching train data:', error);
        throw error;
    }
}

function formatTime(timeStr) {
    return timeStr.replace(' - Day 1', '');
}

function getCurrentStationIndex(routeData) {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    for (let i = 0; i < routeData.length; i++) {
        const station = routeData[i];
        if (station.arrival === 'First') continue;
        
        const [hours, minutes] = station.arrival.split(':').map(Number);
        const stationTime = hours * 60 + minutes;
        
        if (stationTime > currentTime) {
            return i > 0 ? i - 1 : 0;
        }
    }
    
    return routeData.length - 1;
}

async function trackTrain() {
    const trainNumber = document.getElementById('trainNumber').value.trim();
    const resultDiv = document.getElementById('result');
    const trainInfoDiv = document.getElementById('trainInfo');
    const stationListDiv = document.getElementById('stationList');

    if (!trainNumber) {
        alert('Please enter a train number');
        return;
    }

    try {
        // Show loading state
        trainInfoDiv.innerHTML = '<p>Loading train information...</p>';
        stationListDiv.innerHTML = '';
        resultDiv.style.display = 'block';

        // Fetch train data from API
        const trainData = await fetchTrainData(trainNumber);
        
        // Calculate current station index
        const currentStationIndex = getCurrentStationIndex(trainData.routeData);
        
        // Display train information
        trainInfoDiv.innerHTML = `
            <div class="train-header">
                <h2>${trainData.trainName} (${trainData.trainNumber})</h2>
                <div class="train-route">
                    <div class="route-segment">
                        <span class="station-code">${trainData.routeData[0].stationCode}</span>
                        <span class="station-name">${trainData.routeData[0].stationName}</span>
                        <span class="station-time">${formatTime(trainData.departureTime)}</span>
                    </div>
                    <div class="route-arrow">→</div>
                    <div class="route-segment">
                        <span class="station-code">${trainData.routeData[trainData.routeData.length - 1].stationCode}</span>
                        <span class="station-name">${trainData.routeData[trainData.routeData.length - 1].stationName}</span>
                        <span class="station-time">${formatTime(trainData.arrivalTime)}</span>
                    </div>
                </div>
                <div class="train-details">
                    <div class="detail-item">
                        <span class="detail-label">Duration:</span>
                        <span>${trainData.duration}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Distance:</span>
                        <span>${trainData.routeData[trainData.routeData.length - 1].distance} km</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Runs On:</span>
                        <span>${trainData.runOn.join(', ')}</span>
                    </div>
                </div>
            </div>
        `;

      
        
        let stationsHTML = '<div class="station-list-container">';
        trainData.routeData.forEach((station, index) => {
            const isCurrent = index === currentStationIndex;
            const isPassed = index < currentStationIndex;
            const isFirst = station.arrival === 'First';
            const isLast = station.departure === 'Last';
            
            // Format scheduled and estimated times if available
            const stdTime = station.std ? formatTime(station.std) : '-';
            const etdTime = station.etd ? formatTime(station.etd) : '-';
            
            stationsHTML += `
                <div class="station-card">
                    <div class="station-timeline">
                        <div class="timeline-dot"></div>
                        ${index < trainData.routeData.length - 1 ? '<div class="timeline-line"></div>' : ''}
                    </div>
                    <div class="station-details">
                        <div class="station-header">
                            <h3 class="station-name">${station.stationName} <span class="station-code">(${station.stationCode})</span></h3>
                          
                            <div class="station-distance">${station.distance} km</div>
                        </div>
                        <div class="station-times">
                            <div class="time-block">
                                <span class="time-label">Arrival</span>
                                <span class="time">${isFirst ? 'Source' : station.arrival}</span>
                            </div>
                            <div class="time-block">
                                <span class="time-label">Departure</span>
                                <span class="time">${isLast ? 'Destination' : station.departure}</span>
                            </div>
                            <div class="time-block">
                                <span class="time-label">Day</span>
                                <span class="time">${station.day}</span>
                            </div>
                        </div>

                    </div>
                </div>
            `;
        });
        stationsHTML += '</div>';
        stationListDiv.innerHTML = stationsHTML;

    } catch (error) {
        trainInfoDiv.innerHTML = '<p class="error">Error: Could not fetch train information. Please check the train number and try again.</p>';
        console.error('Error:', error);
    }
}

// Format time string to 12-hour format with AM/PM
function formatTime(timeStr) {
    if (!timeStr) return '-';
    const [time, date] = timeStr.split(' ');
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm} (${date})`;
}

// Show or hide loading state
function showLoading(show) {
    const loading = document.getElementById('loading');
    const content = document.getElementById('content');
    
    if (loading && content) {
        loading.style.display = show ? 'flex' : 'none';
        content.style.display = show ? 'none' : 'block';
    }
}

// Get delay status with appropriate color
function getDelayStatus(delay) {
    if (!delay || delay === 'On Time') return { text: 'On Time', class: 'on-time' };
    return { text: delay, class: 'delayed' };
}

// Track if this is a manual refresh
let isManualRefresh = false;

// Update live train information
async function updateLiveTrainData(trainNo, isManual = false) {
    const liveTrackingContent = document.getElementById('liveTrackingContent');
    const refreshButton = document.getElementById('refreshButton');
    
    // If this is a manual refresh, show loading on refresh button
    if (isManual && refreshButton) {
        refreshButton.classList.add('refreshing');
        isManualRefresh = true;
    }
    
    try {
        // Only show full loading for initial load
        if (!isManual) {
            showLoading(true);
        }
        
        // Hide content initially for initial load
        if (liveTrackingContent && !isManual) {
            liveTrackingContent.style.display = 'none';
        }
        // Format today's date as DD-MMM-YY (e.g., 03-Sep-25)
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = monthNames[today.getMonth()];
        const year = String(today.getFullYear()).slice(-2); // Get last 2 digits of year
        const formattedDate = `${day}-${month}-${year}`;
        
        const response = await fetch('https://node-rahul-timbaliya.vercel.app/api/train/getTrainCurrentLocation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                trainNumber: parseInt(trainNo),
                date: formattedDate
            })
        });
        const data = await response.json();
        
        if (!data.trainStatus) {
            throw new Error('No live data available for this train');
        }
        // Show content only after data is loaded
        if (liveTrackingContent) {
            liveTrackingContent.style.display = 'block';
        }
        
        // Update train info header
        document.getElementById('trainNumberfirst').textContent = `${data.trainNumber} - ${data.trainName}`;
        document.getElementById('fromStation').textContent = data.fromStation;
        document.getElementById('toStation').textContent = data.toStation;
        document.getElementById('departureTime').textContent = formatTime(data.departureTime);
        document.getElementById('arrivalTime').textContent = formatTime(data.arrivalTime);
        document.getElementById('duration').textContent = data.duration;
        document.getElementById('distance').textContent = `${data.travelingKMS} km`;
        
        // Update current status
        const currentStation = data.trainStatus.currentTrainStation;
        document.getElementById('currentStation').textContent = currentStation || '-';
        
        // Find next station
        const stations = data.trainStatus.station || [];
        let currentStationIndex = stations.findIndex(s => 
            s.station && currentStation && 
            s.station.toLowerCase().includes(currentStation.toLowerCase().split(' (')[0])
        );
        const lastArrivedStation = [...stations].reverse().find(s => s.arrived === "Yes");
        let currentActual  = stations.findIndex(s => 
            s.station && currentStation && 
            s.station.toLowerCase().includes(lastArrivedStation.station.toLowerCase().split('-')[0].trim())
        );
        
        if (currentStationIndex === -1) currentStationIndex = 0;
        
        const nextStation = currentStationIndex < stations.length - 1 
            ? stations[currentStationIndex + 1].station 
            : 'Destination';
            
        document.getElementById('nextStation').textContent = nextStation;
        
        // Update delay status
        const delayStatus = getDelayStatus(data.trainStatus.currentTrainStationDelay || 'On Time');
        const delayElement = document.getElementById('delay');
        delayElement.textContent = delayStatus.text;
        delayElement.className = `info-value ${delayStatus.class}`;
        
        // Update last updated time
        document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();

        // Update station list
        const stationListContainer = document.getElementById('stationListContainer');
        if (stationListContainer) {
            const stationItems = stations.map((station, index) => {
                const isCurrent = index === currentStationIndex;
                const isPassed = station.arrived === 'Yes' || station.arrived === '-' || !station.platformNumber.includes('*')  || index < currentStationIndex;
                const status = isPassed ? 'Departed' : isCurrent ? 'Current' : 'Upcoming';
                
                // Format station name (remove station code if present)
                const stationName = station.station.split(' - ')[0].trim();
                const stationCode = station.station.split(' - ')[1].trim();
                return `
                    <div class="station-item ${isCurrent ? 'current' : ''} ${isPassed ? 'passed' : ''}">
                        <div class="station-details">
                            <div class="station-header">
                                <span class="station-name">${stationName} <span class="station-code">${stationCode}</span></span>
                                <span class="station-status">${status}</span>
                            </div>
                            <div class="station-time">
                                <div class="time-block">
                                    <span class="time-label">STA:</span>
                                    <span>${station.sta.split(' ')[0] || '--:--'}</span>
                                    <span class="time-label">STD:</span>
                                    <span>${station.std.split(' ')[0] || '--:--'}</span>
                                </div>
                                <div class="time-block">
                                    <span class="time-label">ETA:</span>
                                    <span>${station.eta.split(' ')[0] || '--:--'}</span>
                                    <span class="time-label">ETd:</span>
                                    <span>${station.etd.split(' ')[0] || '--:--'}</span>
                                </div>
                            </div>
                            <div class="station-meta">
                                <span class="station-platform">
                                    <span class="time-label">Platform</span>
                                    <span>${station.platformNumber?.replace('*', '') || '--'}</span>
                                </span>
                                <span class="station-distance">
                                    <span class="time-label">Distance</span>
                                    <span>${station.distance || '0'} km</span>
                                </span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
            
            stationListContainer.className = 'station-list';
            stationListContainer.innerHTML = stationItems;
        }

        // Update progress
        const progress = stations.length > 1 
            ? Math.round((currentStationIndex / (stations.length - 1)) * 100) 
            : 0;
            
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        if (progressBar && progressText) {
            progressBar.style.width = `${progress}%`;
            progressText.textContent = `${progress}% Complete`;
        }
        
        // Update train status card
        const trainStatusCard = document.createElement('div');
        trainStatusCard.className = 'train-status-card';
        trainStatusCard.innerHTML = `
            <div class="status-header">
                <h3>${data.trainName || 'Train Status'}</h3>
                <span class="status-badge ${delayStatus.class}">${delayStatus.text}</span>
            </div>
            <div class="status-content">
                <p>${data.trainStatus.trainStatus || 'Status information not available'}</p>
                <div class="status-details">
                    <div class="detail">
                        <span class="label">Current Station:</span>
                        <span class="value">${data.trainStatus.currentTrainStation || '--'}</span>
                    </div>
                    <div class="detail">
                        <span class="label">Scheduled Arrival:</span>
                        <span class="value">${data.trainStatus.currentTrainStationSTA || '--'}</span>
                    </div>
                    <div class="detail">
                        <span class="label">Actual Arrival:</span>
                        <span class="value">${data.trainStatus.currentTrainStationATA || '--'}</span>
                    </div>
                </div>
            </div>
        `;
        
        // Clear previous status and add new one
        const statusContainer = document.getElementById('liveTrainInfo');
        if (statusContainer) {
            const existingCard = statusContainer.querySelector('.train-status-card');
            if (existingCard) {
                statusContainer.replaceChild(trainStatusCard, existingCard);
            } else {
                statusContainer.insertBefore(trainStatusCard, statusContainer.firstChild);
            }
        }

    } catch (error) {
        console.error('Error updating live train data:', error);
        const statusElement = document.getElementById('currentStatus');
        if (statusElement) {
            statusElement.innerHTML = `<div class="error">Error: ${error.message || 'Failed to fetch live data'}</div>`;
        }
    } finally {
        // Reset loading states
        const refreshButton = document.getElementById('refreshButton');
        if (refreshButton) {
            refreshButton.classList.remove('refreshing');
        }
        
        // Only hide loading if it's not a manual refresh
        if (!isManualRefresh) {
            showLoading(false);
        }
        
        // Reset manual refresh flag
        isManualRefresh = false;
    }
}

// Initialize tabs
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and tabs
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
            
            // Add active class to clicked button and corresponding tab
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// Initialize map (placeholder for actual map integration)
function initMap() {
    // This is a placeholder for map initialization
    // In a real app, you would initialize your map library here (e.g., Google Maps, Leaflet, etc.)
    console.log('Map would be initialized here');
    window.mapInitialized = true;
    
    // Example of how you might update the map with a train's location
    // updateTrainLocation(lat, lng);
}

// Update train location on the map (placeholder function)
function updateTrainLocation(lat, lng) {
    // This would update the map with the train's current location
    console.log(`Updating train location to: ${lat}, ${lng}`);
    
    // In a real app, you would update the map marker here
    // map.setView([lat, lng]);
    // marker.setLatLng([lat, lng]);
}

// Simulate live train data (for demo purposes)
function simulateLiveTrainData() {
    if (window.liveDataInterval) {
        clearInterval(window.liveDataInterval);
    }
    
    let currentStationIndex = 0;
    
    window.liveDataInterval = setInterval(() => {
        // Update current station
        document.getElementById('currentStation').textContent = 
            `${stations[currentStationIndex].name} (${stations[currentStationIndex].code})`;
            
        // Update next station (if not at the last station)
        if (currentStationIndex < stations.length - 1) {
            document.getElementById('nextStation').textContent = 
                `${stations[currentStationIndex + 1].name} (${stations[currentStationIndex + 1].code})`;
        } else {
            document.getElementById('nextStation').textContent = 'Terminus';
        }
        
        // Update last update time
        const now = new Date();
        document.getElementById('lastUpdate').textContent = now.toLocaleTimeString();
        
        // Simulate speed (random between 60-120 km/h)
        const speed = Math.floor(Math.random() * 60) + 60;
        document.getElementById('speedValue').textContent = speed;
        
        // Change speed color based on value
        const speedElement = document.getElementById('speedValue');
        speedElement.style.color = speed > 100 ? '#e74c3c' : '#2ecc71';
        
        // Move to next station after some time
        currentStationIndex = (currentStationIndex + 1) % stations.length;
        
    }, 5000); // Update every 5 seconds
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize tabs
    initTabs();
    
    // Add refresh button event listener
    const refreshButton = document.getElementById('refreshButton');
    if (refreshButton) {
        refreshButton.addEventListener('click', () => {
            const trainNo = document.getElementById('trainNumber').value.trim();
            if (trainNo) {
                updateLiveTrainData(trainNo, true);
            }
        });
    }
    
    // Search functionality
    const searchButton = document.getElementById('searchButton');
    const trainNumberInput = document.getElementById('trainNumber');
    
    const handleSearch = async () => {
        const trainNo = trainNumberInput.value.trim();
        if (!trainNo) {
            alert('Please enter a train number');
            return;
        }
        
        const activeTab = document.querySelector('.tab-button.active').getAttribute('data-tab');
        
        try {
            if (activeTab === 'route-tab') {
                await trackTrain();
            } else if (activeTab === 'live-tab') {
                // Clear any existing interval
                if (window.liveDataInterval) {
                    clearInterval(window.liveDataInterval);
                }
                // Initial data load
                await updateLiveTrainData(trainNo);
                // Set up auto-refresh every 30 seconds
                window.liveDataInterval = setInterval(() => document.getElementById('refreshButton').click(), 80000);
            }
        } catch (error) {
            console.error('Search error:', error);
        }
    };
    
    searchButton.addEventListener('click', handleSearch);
    trainNumberInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
    

});