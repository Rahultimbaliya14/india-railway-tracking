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
        trainInfoDiv.innerHTML = '<p>Loading train information...</p>';
        stationListDiv.innerHTML = '';
        resultDiv.style.display = 'block';
        const trainData = await fetchTrainData(trainNumber);
        
        const currentStationIndex = getCurrentStationIndex(trainData.routeData);
        
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

function formatTime(timeStr) {
    if (!timeStr) return '-';
    const [time, date] = timeStr.split(' ');
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm} (${date})`;
}

function showLoading(show) {
    const loading = document.getElementById('loading');
    const content = document.getElementById('content');
    
    if (loading && content) {
        loading.style.display = show ? 'flex' : 'none';
        content.style.display = show ? 'none' : 'block';
    }
}

function getDelayStatus(delay) {
    if (!delay || delay === 'On Time') return { text: 'On Time', class: 'on-time' };
    return { text: delay, class: 'delayed' };
}
let isManualRefresh = false;

function formatDateForAPI(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[d.getMonth()];
    const year = String(d.getFullYear()).slice(-2);
    return `${day}-${month}-${year}`;
}

function initializeDatePicker() {
    const dateInput = document.getElementById('journeyDate');
    if (dateInput) {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        dateInput.max = todayStr;
        
        const defaultDate = new Date();
        defaultDate.setDate(today.getDate() - 30);
        const defaultDateStr = defaultDate.toISOString().split('T')[0];
        
        const minDate = new Date();
        minDate.setFullYear(today.getFullYear() - 1);
        dateInput.min = minDate.toISOString().split('T')[0];
        
        if (!dateInput.value) {
            dateInput.value = todayStr;
        }
        
        dateInput.style.visibility = 'visible';
        dateInput.style.opacity = '1';
    }
}

async function updateLiveTrainData(trainNo, isManual = false) {
    const liveTrackingContent = document.getElementById('liveTrackingContent');
    const refreshButton = document.getElementById('refreshButton');
    const journeyDate = document.getElementById('journeyDate').value || new Date().toISOString().split('T')[0];
    
    if (isManual && refreshButton) {
        refreshButton.classList.add('refreshing');
        isManualRefresh = true;
    }
    let statusElement = document.getElementById('trainInfoLive');
    statusElement.innerHTML = '';
    try {
        if (!isManual) {
            showLoading(true);
        }
        
        if (liveTrackingContent && !isManual) {
            liveTrackingContent.style.display = 'none';
        }
        const formattedDate = formatDateForAPI(journeyDate);
        
        const response = await fetch('https://node-rahul-timbaliya.vercel.app/api/train/getTrainCurrentLocation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                trainNumber: trainNo,
                date: formattedDate
            })
        });
        const data = await response.json();
        
        if (!data.trainStatus) {
            let statusElement = document.getElementById("trainInfoLive")
            statusElement.innerHTML = `<div class="error">Error: No live data available for this train</div>`;
            throw new Error('No live data available for this train');
            
        }
        if (liveTrackingContent) {
            liveTrackingContent.style.display = 'block';
        }
        
        document.getElementById('trainNumberfirst').textContent = `${data.trainNumber} - ${data.trainName}`;
        document.getElementById('fromStation').textContent = data.fromStation;
        document.getElementById('toStation').textContent = data.toStation;
        document.getElementById('departureTime').textContent = formatTime(data.departureTime);
        document.getElementById('arrivalTime').textContent = formatTime(data.arrivalTime);
        document.getElementById('duration').textContent = data.duration;
        document.getElementById('distance').textContent = `${data.travelingKMS} km`;
        
        const currentStation = data.trainStatus.currentTrainStation;
        document.getElementById('currentStation').textContent = currentStation || '-';
        
        const stations = data.trainStatus.station || [];
        let currentStationIndex = stations.findIndex(s => 
            s.station && currentStation && 
            s.station.toLowerCase().includes(currentStation.toLowerCase().split(' (')[0])
        );
        const lastArrivedStation = [...stations].reverse().find(s => s.arrived === "Yes" || !s.platformNumber.includes('*'));
        let currentActual  = stations.findIndex(s => 
            s.station && currentStation && 
            s.station.toLowerCase().includes(lastArrivedStation.station.toLowerCase().split('-')[0].trim())
        );
        if (currentStationIndex === -1) currentStationIndex = 0;
        
        const nextStation = currentActual < stations.length - 1 
            ? stations[currentActual + 1].station 
            : 'Destination';
        
        document.getElementById('nextStation').textContent = nextStation;
        
        const preStation = currentActual < stations.length - 1 
            ? stations[currentActual].station 
            : 'Destination';
        document.getElementById('currentStation').textContent = preStation || '-';

        const delayStatus = getDelayStatus(data.trainStatus.currentTrainStationDelay || 'On Time');
        const delayElement = document.getElementById('delay');
        delayElement.textContent = delayStatus.text;
        delayElement.className = `info-value ${delayStatus.class}`;
        
        document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();

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

        const progress = stations.length > 1 
            ? Math.round((currentActual / (stations.length - 1)) * 100) 
            : 0;
            
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        if (progressBar && progressText) {
            progressBar.style.width = `${progress}%`;
            progressText.textContent = `${progress}% Complete`;
        }
        
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
        let statusElement = document.getElementById('trainInfoLive');
        if (statusElement) {
            statusElement.innerHTML = `<div class="error">Error: 'Failed to fetch live data'</div>`;
        }
    } finally {
        const refreshButton = document.getElementById('refreshButton');
        if (refreshButton) {
            refreshButton.classList.remove('refreshing');
        }
        
        if (!isManualRefresh) {
            showLoading(false);
        }
        
        isManualRefresh = false;
    }
}

function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const searchBox = document.querySelector('.search-box');
    const trainNumberInput = document.getElementById('trainNumber');
    const searchButton = document.getElementById('searchButton');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
            
            // Show/hide search box based on active tab
            if (tabId === 'route-tab' || tabId === 'live-tab') {
                searchBox.style.display = 'flex';
                trainNumberInput.style.display = 'block';
                searchButton.style.display = 'block';
            } else if (tabId === 'pnr-tab') {
                searchBox.style.display = 'flex';
                trainNumberInput.style.display = 'none';
                searchButton.style.display = 'none';
            } else {
                searchBox.style.display = 'none';
            }
        });
    });
}

function initMap() {
    window.mapInitialized = true;
}

function updateTrainLocation(lat, lng) {
    
}

function simulateLiveTrainData() {
    if (window.liveDataInterval) {
        clearInterval(window.liveDataInterval);
    }
    
    let currentStationIndex = 0;
    
    window.liveDataInterval = setInterval(() => {
        document.getElementById('currentStation').textContent = 
            `${stations[currentStationIndex].name} (${stations[currentStationIndex].code})`;
            
        if (currentStationIndex < stations.length - 1) {
            document.getElementById('nextStation').textContent = 
                `${stations[currentStationIndex + 1].name} (${stations[currentStationIndex + 1].code})`;
        } else {
            document.getElementById('nextStation').textContent = 'Terminus';
        }
        
        const now = new Date();
        document.getElementById('lastUpdate').textContent = now.toLocaleTimeString();
        
        const speedElement = document.getElementById('speedValue');
        speedElement.style.color = speed > 100 ? '#e74c3c' : '#2ecc71';
        
        currentStationIndex = (currentStationIndex + 1) % stations.length;
        
    }, 5000); 
}

document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initializeDatePicker();
    
    const refreshButton = document.getElementById('refreshButton');
    if (refreshButton) {
        refreshButton.addEventListener('click', () => {
            const trainNo = document.getElementById('trainNumber').value.trim();
            if (trainNo) {
                updateLiveTrainData(trainNo, true);
            }
        });
    }
    
    const dateInput = document.getElementById('journeyDate');
    if (dateInput) {
        dateInput.addEventListener('change', () => {
            if (document.getElementById('live-tab').classList.contains('active')) {
                const trainNo = document.getElementById('trainNumber').value.trim();
                if (trainNo) {
                    updateLiveTrainData(trainNo, true);
                }
            }
        });
    }
    
    const searchButton = document.getElementById('searchButton');
    const trainNumberInput = document.getElementById('trainNumber');
    
    function setLoading(isLoading) {
        const searchButton = document.getElementById('searchButton');
        if (searchButton) {
            searchButton.disabled = isLoading;
            searchButton.setAttribute('aria-busy', isLoading);
            if (isLoading) {
                searchButton.classList.add('loading');
            } else {
                searchButton.classList.remove('loading');
            }
        }
    }

    const handleSearch = async () => {
        const trainNo = trainNumberInput.value.trim();
        if (!trainNo) {
            // Add shake animation class
            trainNumberInput.classList.add('input-error');
            // Remove the class after animation completes
            setTimeout(() => {
                trainNumberInput.classList.remove('input-error');
            }, 500);
            // Focus the input field
            trainNumberInput.focus();
            return;
        }

        if (searchButton.classList.contains('loading')) {
            return;
        }
        setLoading(true);

        const activeTab = document.querySelector('.tab-button.active').getAttribute('data-tab');
        
        try {
            if (activeTab === 'route-tab') {
                await trackTrain();
            } else if (activeTab === 'live-tab') {
                if (window.liveDataInterval) {
                    clearInterval(window.liveDataInterval);
                }
                await updateLiveTrainData(trainNo);
                window.liveDataInterval = setInterval(() => document.getElementById('refreshButton').click(), 80000);
            }
        } catch (error) {
            const resultDiv = document.querySelector(activeTab === 'route-tab' ? '#result' : '#liveTrackingContent');
            if (resultDiv) {
                resultDiv.innerHTML = `
                    <div class="error-message">
                        <p>Error: Could not fetch train data. Please try again.</p>
                    </div>
                `;
            }
        } finally {
            setLoading(false);
        }
    };
    
    searchButton.addEventListener('click', handleSearch);
    trainNumberInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
    

});
function initializeTrainAutocomplete() {
    const trainInput = document.getElementById('trainNumber');
    const searchButton = document.getElementById('searchButton');
    let suggestionsContainer;

    if (!document.getElementById('suggestionsContainer')) {
        suggestionsContainer = document.createElement('div');
        suggestionsContainer.id = 'suggestionsContainer';
        suggestionsContainer.className = 'suggestions-container';
        
        const searchBox = trainInput.closest('.search-box');
        if (searchBox) {
            searchBox.style.position = 'relative';
            searchBox.appendChild(suggestionsContainer);
        } else {
            trainInput.parentNode.insertBefore(suggestionsContainer, trainInput.nextSibling);
        }
    } else {
        suggestionsContainer = document.getElementById('suggestionsContainer');
    }

    function parseTrainInfo(trainStr) {
        const match = trainStr.match(/^(\d{5})-\s*(.+)$/);
        if (match) {
            return {
                number: match[1].trim(),
                name: match[2].trim()
            };
        }
        return null;
    }

    function filterTrains(input) {
        const inputValue = input.trim().toLowerCase();
        if (!inputValue) return [];
        const trainData = window.arrTrainList || [];
        const results = [];
        
        for (const trainStr of trainData) {
            const trainInfo = parseTrainInfo(trainStr);
            if (trainInfo) {
                const trainNumber = trainInfo.number.toLowerCase();
                const trainName = trainInfo.name.toLowerCase();
                
                if (trainNumber.includes(inputValue) || trainName.includes(inputValue)) {
                    results.push({
                        number: trainInfo.number,
                        name: trainInfo.name,
                        display: trainInfo.number + ' - ' + trainInfo.name
                    });
                    
                    if (results.length >= 10) break; 
                }
            }
        }
        
        return results;
    }

    function showSuggestions() {
        const input = trainInput.value.trim();
        const filteredTrains = filterTrains(input);        
        suggestionsContainer.innerHTML = '';
        
        if (filteredTrains.length === 0 || !input) {
            suggestionsContainer.style.display = 'none';
            return;
        }
        
        filteredTrains.forEach((train, index) => {
            const suggestion = document.createElement('div');
            suggestion.className = 'suggestion-item';
            suggestion.setAttribute('data-index', index);
            suggestion.innerHTML = `
                <span class="train-number">${train.number}</span>
                <span class="train-name">${train.name}</span>
            `;
            suggestion.addEventListener('click', () => {
                trainInput.value = train.number;
                suggestionsContainer.style.display = 'none';
                if (searchButton) searchButton.click();
            });
            
            suggestion.addEventListener('mouseenter', () => {
                const items = suggestionsContainer.querySelectorAll('.suggestion-item');
                items.forEach(item => item.classList.remove('selected'));
                suggestion.classList.add('selected');
                selectedIndex = index;
            });
            suggestionsContainer.appendChild(suggestion);
        });
        suggestionsContainer.style.display = 'block';
        selectedIndex = -1;
    }

    let selectedIndex = -1;
    function updateSelectedSuggestion(suggestions, index) {
        suggestions.forEach((suggestion, i) => {
            if (i === index) {
                suggestion.classList.add('selected');
                const trainNumber = suggestion.querySelector('.train-number').textContent;
                trainInput.value = trainNumber;
                suggestion.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            } else {
                suggestion.classList.remove('selected');
            }
        });
        
        if (index === -1 && trainInput.value.trim() === '') {
            trainInput.value = '';
        }
        
        selectedIndex = index;
    }
    
    trainInput.addEventListener('input', showSuggestions);
    
    trainInput.addEventListener('keydown', (e) => {
        const suggestions = suggestionsContainer.querySelectorAll('.suggestion-item');
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedIndex = Math.min(selectedIndex + 1, suggestions.length - 1);
            updateSelectedSuggestion(suggestions, selectedIndex);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedIndex = Math.max(selectedIndex - 1, -1);
            updateSelectedSuggestion(suggestions, selectedIndex);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedIndex > -1 && suggestions[selectedIndex]) {
                suggestions[selectedIndex].click();
            } else if (searchButton) {
                searchButton.click();
            }
        } else if (e.key === 'Escape') {
            suggestionsContainer.style.display = 'none';
        } else if (e.key === 'Tab') {
            setTimeout(() => {
                if (!suggestionsContainer.contains(document.activeElement) && document.activeElement !== trainInput) {
                    suggestionsContainer.style.display = 'none';
                }
            }, 10);
        }
    });
    
    document.addEventListener('click', (e) => {
        if (!trainInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
            suggestionsContainer.style.display = 'none';
        }
    });
}

// Function to fetch PNR status
async function fetchPnrStatus(pnrNumber) {
    try {
        const response = await fetch(`https://node-rahul-timbaliya.vercel.app/api/train/getPNRInfo`,{
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
               pnrNumber : pnrNumber
            })
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching PNR status:', error);
        throw error;
    }
}

// Function to display PNR status
function displayPnrStatus(pnrData) {
    const pnrResult = document.getElementById('pnrResult');
    
    if (!pnrData || !pnrData.pnr) {
        pnrResult.innerHTML = '<div class="error">No PNR data found</div>';
        return;
    }

    const { pnr, trainNumber, trainName, dateOfJourney, from, to, departureTime, arrivalTime, duration, 
            boardingPoint, boardingPointPlatformNumber, coachPosition, passengerStatus, bookingDetails } = pnrData;
    
    // Determine status badge class based on passenger status
    const statusClass = passengerStatus && passengerStatus[0] ? 
        passengerStatus[0].currentStatusCurrent.toLowerCase() : 'unknown';
    const statusText = passengerStatus && passengerStatus[0] ? 
        passengerStatus[0].currentStatus : 'Status not available';

    let html = `
        <div class="pnr-status-card">
            <div class="pnr-header">
                <h3>PNR: ${pnr}</h3>
                <span class="status-badge ${statusClass}">${statusText}</span>
            </div>
            
            <div class="train-info">
                <h4>${trainName} (${trainNumber})</h4>
                <div class="journey-details">
                    <span>Date: ${dateOfJourney}</span>
                    <span>Class: ${bookingDetails?.bookingClass || 'N/A'}</span>
                    <span>Quota: ${bookingDetails?.bookingQuota || 'N/A'}</span>
                </div>
                <div class="route">
                    <div class="station">
                        <span class="station-name">${from}</span>
                        <span class="station-time">${departureTime}</span>
                    </div>
                    <span class="coach">${duration} Hours</span>
                    <div class="station">
                        <span class="station-name">${to}</span>
                        <span class="station-time">${arrivalTime}</span>
                    </div>
                </div>
                <div class="boarding-info">
                    <div>Boarding: ${boardingPoint}</div>
                    <div>Platform: ${boardingPointPlatformNumber || 'Not specified'}</div>
                </div>
                
                <div class="coach-position">
                    <h4>Coach Position</h4>
                    <div class="coach-sequence">
                        ${(coachPosition || '').split(' ').map(coach => {
                            const isAllocated = passengerStatus && passengerStatus.some(p => p.currentCoachId === coach || p.bookingCoachId === coach);
                            return `<span class="coach ${isAllocated ? 'allocated' : ''}" title="${isAllocated ? 'Your coach' : ''}">${coach}</span>`;
                        }).join(' → ')}
                    </div>
                </div>
            </div>
            
            <div class="passenger-list">
                <h4>Passenger Details</h4>
                <table>
                    <thead>
                        <tr>
                            <th>No.</th>
                            <th>Booking Status</th>
                            <th>Current Status</th>
                            <th>Coach</th>
                            <th>Berth</th>
                            <th>Class</th>
                        </tr>
                    </thead>
                    <tbody>`;

    (passengerStatus || []).forEach((passenger, index) => {
        html += `
                        <tr>
                            <td>${passenger.number || index + 1}</td>
                            <td>${passenger.bookingStatus || '-'}</td>
                            <td>${passenger.currentStatus || '-'}</td>
                            <td>${passenger.currentCoachId || passenger.bookingCoachId || '-'}</td>
                            <td>${passenger.currentBerthNo || passenger.bookingBerthNo || '-'}</td>
                            <td>${bookingDetails?.bookingClass || '-'}</td>
                        </tr>`;
    });

    html += `
                    </tbody>
                </table>
                
                <div class="booking-details">
                    <h4>Booking Details</h4>
                    <div class="details-grid">
                        <div class="detail-item">
                            <span class="detail-label">Booking Date:</span>
                            <span class="detail-value">${bookingDetails?.bookingDate || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Fare:</span>
                            <span class="detail-value">₹${bookingDetails?.ticketFare || '0'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Class:</span>
                            <span class="detail-value">${bookingDetails?.bookingClass || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Quota:</span>
                            <span class="detail-value">${bookingDetails?.bookingQuota || 'N/A'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;

    pnrResult.innerHTML = html;
}

// Function to handle PNR check
async function checkPnrStatus() {
    const pnrInput = document.getElementById('pnrNumber');
    const pnrNumber = pnrInput.value.trim();
    const pnrResult = document.getElementById('pnrResult');
    const checkPnrButton = document.getElementById('checkPnrButton');
    const spinner = checkPnrButton.querySelector('.spinner');
    const buttonText = checkPnrButton.querySelector('.button-text');

    if (!pnrNumber || pnrNumber.length !== 10) {
        // Add shake effect
        pnrInput.classList.add('shake');
        pnrInput.focus();
        
        // Remove the shake class after animation completes
        setTimeout(() => {
            pnrInput.classList.remove('shake');
        }, 500);
        
       
        return;
    }

    try {
        // Show loading state
        checkPnrButton.disabled = true;
        spinner.style.display = 'inline-block';
        buttonText.textContent = 'Checking...';
        pnrResult.innerHTML = '<div class="loading">Fetching PNR status...</div>';

        const pnrData = await fetchPnrStatus(pnrNumber);
        displayPnrStatus(pnrData);
    } catch (error) {
        console.error('Error checking PNR status:', error);
        pnrResult.innerHTML = `<div class="error">Error: ${error.message || 'Failed to fetch PNR status'}</div>`;
    } finally {
        // Reset button state
        checkPnrButton.disabled = false;
        spinner.style.display = 'none';
        buttonText.textContent = 'Check Status';
    }
}

// Initialize PNR tab functionality
function initPnrTab() {
    const checkPnrButton = document.getElementById('checkPnrButton');
    if (checkPnrButton) {
        checkPnrButton.addEventListener('click', checkPnrStatus);
    }

    const pnrInput = document.getElementById('pnrNumber');
    if (pnrInput) {
        pnrInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                checkPnrStatus();
            }
        });
    }
}

// Update the DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initializeDatePicker();
    initPnrTab();
    initializeTrainAutocomplete();
});