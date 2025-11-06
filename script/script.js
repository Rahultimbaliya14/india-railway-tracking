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



        let stationsHTML = '<div class="stations-container">';
        let currentDay = null;
        trainData.routeData.forEach((station, index) => {
            const isFirst = index === 0;
            const isLast = index === trainData.routeData.length - 1;

            // Add day separator if day changes
            if (station.day !== currentDay) {
                currentDay = station.day;
                if (!isFirst) {  // Don't add separator before the first station
                    stationsHTML += `
                        <div class="day-separator">
                            <span class="day-text">Day ${currentDay}</span>
                            <span class="day-line"></span>
                        </div>`;
                }
            }
            const isCurrent = index === currentStationIndex;
            const isPassed = index < currentStationIndex;
            const isFirstStation = station.arrival === 'First';
            const isLastStation = station.departure === 'Last';

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
                                <span class="time">${isFirstStation ? 'Source' : station.arrival}</span>
                            </div>
                            <div class="time-block">
                                <span class="time-label">Departure</span>
                                <span class="time">${isLastStation ? 'Destination' : station.departure}</span>
                            </div>
                            <div class="time-block">
                                <span class="time-label">Day</span>
                                <span class="time">${isFirstStation ? '1' : station.day}</span>
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
    const statusElement = document.getElementById('trainInfoLive');
    const journeyDate = document.getElementById('journeyDate').value || new Date().toISOString().split('T')[0];
    document.getElementById('statusContainer').style.display = 'block';
    document.getElementById('mapContainer').style.display = 'block';
    document.getElementById('routeMap').style.display = 'block';

    // Clear previous content if this is not a manual refresh
    if (!isManual) {
        if (statusElement) statusElement.innerHTML = '';
        if (liveTrackingContent) {
            liveTrackingContent.style.display = 'none';
            // Clear any existing station cards or progress bars
            const existingContent = liveTrackingContent.querySelectorAll('.station-card');
            existingContent.forEach(el => el.remove());
        }
    }

    if (isManual && refreshButton) {
        refreshButton.classList.add('refreshing');
        isManualRefresh = true;
    }
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

        if (data.trainStatus.trainStatus != "Yet to start from its source" && data.trainStatus.station[0].station != "undefined - undefined") {
            const currentStation = data.trainStatus.currentTrainStation;
            const currentStationName = currentStation?.split(' (')[0] || '';

            // Update current station display with indicator
            document.getElementById('currentStation').innerHTML = currentStation ?
                `<span class="current-indicator"></span>${currentStation}` : '-';

            // Create map of stopping stations
            const stoppingStations = new Map(data.trainStatus.station.map(station => {
                const [name] = station.station.split(' - ');
                return [name.trim(), station];
            }));

            if (data.fullRouteData != null && data.fullRouteData.length > 0) {
                const data = {
                    trainNumber: trainNo,
                    date: formattedDate,
                    fullMap: "false"
                };

                const secretKey = sessionStorage.getItem("encryptionKey");
                // Encrypt data
                const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), secretKey).toString();

                const encoded = encodeURIComponent(encrypted);

                document.getElementById('routeMap').src = 'map.html?' + 'data=' + encoded;
            }
            // Find current station in full route data
            const routeStations = data.fullRouteData != null ? data.fullRouteData.filter(s => s != null && s != undefined) : [];

            let currentStationIndex = routeStations.findIndex(s =>
                s.station.toLowerCase() === currentStationName.toLowerCase()?.trim()
            );

            // Find the last arrived station for progress calculation
            const lastArrivedStation = [...data.trainStatus.station].reverse().find(s => s.arrived === "Yes" || !s.platformNumber.includes('*'));
            let currentActual = data.fullRouteData != null ? routeStations.findIndex(s =>
                s.station.toLowerCase() === currentStationName.toLowerCase()?.trim()
            ) : data.trainStatus.station.findIndex(s =>
                s.station && currentStation &&
                s.station.toLowerCase().includes(lastArrivedStation.station.toLowerCase().split('-')[0].trim())
            );
            if (currentStationIndex === -1) currentStationIndex = 0;

            // Find last stopped station
            const arrivedStations = data.trainStatus.station.filter(s => s.arrived === "Yes");
            const lastStoppedStation = arrivedStations[arrivedStations.length - 1];

            // Find the next stopping station based on last stopped station
            let nextStoppingStation = null;
            if (lastStoppedStation) {
                const lastStoppedIndex = data.trainStatus.station.findIndex(s => s.station === lastStoppedStation.station);
                if (lastStoppedIndex !== -1) {
                    nextStoppingStation = data.trainStatus.station.slice(lastStoppedIndex + 1).find(s =>
                        s.platformNumber && s.arrived !== "Yes"
                    );
                }
            }

            // Update the display with station names and platform info
            document.getElementById('currentStation').innerHTML = lastStoppedStation ?
                `<span class="current-indicator"></span>${lastStoppedStation.station} (Platform ${lastStoppedStation.platformNumber?.replace('*', '') || '-'})` : '-';

            document.getElementById('nextStation').innerHTML = nextStoppingStation ?
                `${nextStoppingStation.station} (Platform ${nextStoppingStation.platformNumber?.replace('*', '') || '-'})` : 'Journey Completed';

            const delayStatus = getDelayStatus(data.trainStatus.currentTrainStationDelay || 'On Time');
            const delayElement = document.getElementById('delay');
            delayElement.textContent = delayStatus.text;
            delayElement.className = `info-value ${delayStatus.class}`;

            document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();
            const stationListContainer = document.getElementById('stationListContainer');

            if (stationListContainer) {
                if (data.fullRouteData == null || data.fullRouteData.length === 0) {
                    const stationItems = data.trainStatus.station.map((station, index) => {
                        const isCurrent = index === currentStationIndex;
                        const isPassed = station.arrived === 'Yes' || station.arrived === '-' || !station.platformNumber.includes('*') || index < currentStationIndex;
                        const status = isPassed ? 'Departed' : isCurrent ? 'Current' : 'Upcoming';

                        // Format station name (remove station code if present)
                        const stationName = station.station.split(' - ')[0].trim();
                        const stationCode = station.station.split(' - ')[1].trim();

                        return `
            <div class="station-item ${isCurrent ? 'current' : ''} ${isPassed ? 'passed' : ''} stopping-station">
                <div class="station-timeline">
                    <div class="timeline-dot major"></div>
                    ${index < data.trainStatus.station.length - 1 ? '<div class="timeline-line"></div>' : ''}
                </div>
                <div class="station-details">
                    <div class="station-header">
                        <div class="station-title">
                            <span class="station-name">${stationName}</span>
                            <span class="station-code">${stationCode}</span>
                        </div>
                        <div class="station-badges">
                            <span class="station-status ${status.toLowerCase()}">${status}</span>
                        </div>
                    </div>
                    <div class="station-times">
                        <div class="time-block">
                            <span class="time-label">Sch. Arrival</span>
                            <span class="time-value">${station.sta.split(' ')[0] || '--:--'}</span>
                        </div>
                        <div class="time-block">
                            <span class="time-label">Sch. Departure</span>
                            <span class="time-value">${station.std.split(' ')[0] || '--:--'}</span>
                        </div>
                        <div class="time-divider"></div>
                        <div class="time-block">
                            <span class="time-label">Exp. Arrival</span>
                            <span class="time-value">${station.eta.split(' ')[0] || '--:--'}</span>
                        </div>
                        <div class="time-block">
                            <span class="time-label">Exp. Departure</span>
                            <span class="time-value">${station.etd.split(' ')[0] || '--:--'}</span>
                        </div>
                        <div class="station-meta">
                            <div class="platform-info">
                                <span class="platform-label">Platform</span>
                                <span class="platform-number">${station.platformNumber?.replace('*', '') || '--'}</span>
                            </div>
                            <div class="distance-info">
                                <span class="distance-label">Distance</span>
                                <span class="distance-value">${station.distance || '0'} km</span>
                            </div>
                            ${station.arrived === 'Yes' ? '<div class="arrived-badge">Train Arrived</div>' : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
                    }).join('');
                    stationListContainer.className = 'station-list';
                    stationListContainer.innerHTML = stationItems;
                }
                else {
                    const stationItems = data.fullRouteData.map((station, index) => {
                        const stoppingInfo = stoppingStations.get(station.station_name);
                        const isStoppingStation = station.wtt_stop === 'Y';
                        const isCurrent = (station.station + " (" + station.station_name + ")").toLowerCase() === data.trainStatus.currentTrainStation.toLowerCase();

                        const isPassed = stoppingInfo?.arrived === 'Yes' ||
                            stoppingInfo?.arrived === '-' ||
                            (stoppingInfo && !stoppingInfo.platformNumber?.includes('*')) ||
                            index < currentStationIndex;
                        const status = isPassed ? 'Departed' : isCurrent ? 'Current' : 'Upcoming';

                        return `
            <div class="station-item ${isCurrent ? 'current' : ''} ${isPassed ? 'passed' : ''} ${isStoppingStation ? 'stopping-station' : 'pass-through-station'}">
                <div class="station-timeline">
                    <div class="timeline-dot ${isStoppingStation ? 'major' : 'minor'}"></div>
                    ${index < data.fullRouteData.length - 1 ? '<div class="timeline-line"></div>' : ''}
                </div>
                <div class="station-details ${!isStoppingStation ? 'pass-through-details' : ''}">
                    <div class="station-header">
                        <div class="station-title">
                            <span class="station-name">${station.station_name}</span>
                            <span class="station-code">${station.station}</span>
                        </div>
                        <div class="station-badges">
                            ${!isStoppingStation ?
                                '<span class="station-status non-stop">Non-Stop Station</span>' :
                                `<span class="station-status ${status.toLowerCase()}">${status}</span>`
                            }
                        </div>
                    </div>
                    ${isStoppingStation && stoppingInfo ? `
                    <div class="station-times">
                        <div class="time-block">
                            <span class="time-label">Sch. Arrival</span>
                            <span class="time-value">${stoppingInfo.sta?.split(' ')[0] || '--:--'}</span>
                        </div>
                        <div class="time-block">
                            <span class="time-label">Sch. Departure</span>
                            <span class="time-value">${stoppingInfo.std?.split(' ')[0] || '--:--'}</span>
                        </div>
                        <div class="time-divider"></div>
                        <div class="time-block">
                            <span class="time-label">Exp. Arrival</span>
                            <span class="time-value">${stoppingInfo.eta?.split(' ')[0] || '--:--'}</span>
                        </div>
                        <div class="time-block">
                            <span class="time-label">Exp. Departure</span>
                            <span class="time-value">${stoppingInfo.etd?.split(' ')[0] || '--:--'}</span>
                        </div>
                        <div class="station-meta">
                            <div class="platform-info">
                                <span class="platform-label">Platform</span>
                                <span class="platform-number">${stoppingInfo.platformNumber?.replace('*', '') || '--'}</span>
                            </div>
                            <div class="distance-info">
                                <span class="distance-label">Distance</span>
                                <span class="distance-value">${station.distance || '0'} km</span>
                            </div>
                            ${stoppingInfo.arrived === 'Yes' ? '<div class="arrived-badge">Train Arrived</div>' : ''}
                        </div>
                    </div>
                    ` : `
                    <div class="non-stop-info">
                        <div class="distance-only">
                            <span class="distance-marker">Distance:</span>
                            <span class="distance-value">${station.distance || '0'} km</span>
                        </div>
                    </div>`}
                </div>
            </div>
        `;
                    }).join('');

                    stationListContainer.className = 'station-list';
                    stationListContainer.innerHTML = stationItems;
                }
            }

            const progress = data.fullRouteData != null && data.fullRouteData != undefined
                ? Math.round((currentActual / (data.fullRouteData.length - 1)) * 100)
                : Math.round((currentActual / (data.trainStatus.station.length - 1)) * 100);
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
            if (data.fullRouteData == null && data.fullRouteData == undefined) {
                document.getElementById('routeMap').style.display = 'none';
                document.getElementById('mapContainer').style.display = 'none';
                document.getElementById('station-controls').style.display = 'none';
            }
            else {
                document.getElementById('station-controls').style.display = 'block';
            }
            const statusContainer = document.getElementById('liveTrainInfo');
            if (statusContainer) {
                const existingCard = statusContainer.querySelector('.train-status-card');
                if (existingCard) {
                    statusContainer.replaceChild(trainStatusCard, existingCard);
                } else {
                    statusContainer.insertBefore(trainStatusCard, statusContainer.firstChild);
                }
            }
        }
        else {
            document.getElementById('statusContainer').style.display = 'none';
            document.getElementById('routeMap').style.display = 'none';
            document.getElementById('mapContainer').style.display = 'none';
            document.getElementById('currentStation').textContent = data.trainStatus.trainStatus || '-';
        }
    } catch (error) {
        console.error('Error updating live train data:', error);
        document.getElementById('routeMap').style.display = 'none';
        document.getElementById('statusContainer').style.display = 'none';
        document.getElementById('mapContainer').style.display = 'none';
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
    let currentTab = 'route-tab';

    function switchTab(button) {
        const tabId = button.getAttribute('data-tab');
        if (tabId === currentTab) return;

        const currentContent = document.getElementById(currentTab);
        const scrollPosition = currentContent.scrollTop;

        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));

        button.classList.add('active');
        const newTab = document.getElementById(tabId);
        newTab.classList.add('active');

        newTab.scrollTop = scrollPosition;
        currentTab = tabId;

        // Show/hide search box based on active tab
        if (tabId === 'route-tab' || tabId === 'live-tab') {
            searchBox.style.display = 'flex';
            trainNumberInput.style.display = 'block';
            searchButton.style.display = 'block';
            if (tabId === 'route-tab' || tabId === 'live-tab') {
                trainNumberInput.focus();
            }
        } else {
            searchBox.style.display = 'none';
        }

        // Focus appropriate input based on tab
        if (tabId === 'pnr-tab') {
            const pnrInput = document.getElementById('pnrNumber');
            if (pnrInput) pnrInput.focus();
        } else if (tabId === 'btw-tab') {
            const fromInput = document.getElementById('fromStationBtw');
            if (fromInput) fromInput.focus();
        }
    }

    tabButtons.forEach(button => {
        button.addEventListener('click', () => switchTab(button));
    });

    if (tabButtons.length > 0) {
        switchTab(tabButtons[0]);
    }
}

function initMap() {
    window.mapInitialized = true;
}

function updateTrainLocation(lat, lng) {

}

function simulateLiveTrainData(stationData) {
    if (window.liveDataInterval) {
        clearInterval(window.liveDataInterval);
    }

    if (!stationData || !Array.isArray(stationData)) {
        console.error('Invalid station data');
        return;
    }

    let currentStationIndex = 0;

    window.liveDataInterval = setInterval(() => {
        const station = stationData[currentStationIndex];
        if (station) {
            document.getElementById('currentStation').textContent = station.station || 'Unknown Station';

            if (currentStationIndex < stationData.length - 1) {
                document.getElementById('nextStation').textContent = stationData[currentStationIndex + 1].station || 'Unknown Station';
            } else {
                document.getElementById('nextStation').textContent = 'Terminus';
            }
        }

        const now = new Date();
        document.getElementById('lastUpdate').textContent = now.toLocaleTimeString();

        currentStationIndex = (currentStationIndex + 1) % stationData.length;
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
                document.getElementById('trainInfoLive').innerHTML = '';
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
                    document.getElementById('trainInfoLive').innerHTML = '';
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

    const clearPreviousContent = () => {
        // Only clear if we're on the live-tab
        const activeTab = document.querySelector('.tab-button.active')?.getAttribute('data-tab');
        if (activeTab !== 'live-tab') return;

        // Clear the main content areas
        const liveTrackingContent = document.getElementById('liveTrackingContent');
        const statusElement = document.getElementById('trainInfoLive');
        const liveTrainInfo = document.getElementById('liveTrainInfo');

        // Reset all text fields to default but only if they're in the active tab
        const elementsToClear = [
            'trainNumberfirst', 'fromStation', 'toStation',
            'departureTime', 'arrivalTime', 'duration',
            'distance', 'currentStation', 'nextStation',
            'lastStation', 'delay', 'trainSpeed',
            'trainLocation', 'platformNumber', 'stationCode'
        ];

        elementsToClear.forEach(id => {
            const el = document.getElementById(id);
            if (el && el.closest('.tab-content.active')) {
                el.textContent = '-';
            }
        });

        // Only clear content in the active tab
        if (liveTrackingContent && liveTrackingContent.closest('.tab-content.active')) {
            liveTrackingContent.style.display = 'none';

            const stationCards = liveTrackingContent.querySelectorAll('.station-card');
            stationCards.forEach(card => card.remove());
        }

        if (statusElement && statusElement.closest('.tab-content.active')) {
            statusElement.innerHTML = '';
        }

        if (liveTrainInfo && liveTrainInfo.closest('.tab-content.active')) {
            liveTrainInfo.innerHTML = '';
        }

        // Clear any error messages in the active tab
        const activeContent = document.querySelector('.tab-content.active');
        if (activeContent) {
            const errorMessages = activeContent.querySelectorAll('.error, .error-message');
            errorMessages.forEach(error => error.remove());
        }
    };

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

        // Clear any previous intervals
        if (window.liveDataInterval) {
            clearInterval(window.liveDataInterval);
            window.liveDataInterval = null;
        }

        // Clear previous content before new search
        clearPreviousContent();

        setLoading(true);

        const activeTab = document.querySelector('.tab-button.active')?.getAttribute('data-tab');
        if (!activeTab) {
            console.error('No active tab found');
            setLoading(false);
            return;
        }

        try {
            if (activeTab === 'route-tab') {
                await trackTrain();
            } else if (activeTab === 'live-tab') {
                if (window.liveDataInterval) {
                    clearInterval(window.liveDataInterval);
                }
                await updateLiveTrainData(trainNo);
                window.liveDataInterval = setInterval(() => document.getElementById('refreshButton').click(), 180000);
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
function initializeBtwAutocomplete() {
    const fromInput = document.getElementById('fromStationBtw');
    const toInput = document.getElementById('toStationBtw');
    const fromSuggestions = document.getElementById('fromSuggestionsContainer');
    const toSuggestions = document.getElementById('toSuggestionsContainer');

    function filterStations(input, currentInput) {
        const value = input.toLowerCase();
        if (!value) return [];

        const stations = window.StationsList || [];
        const fromValue = document.getElementById('fromStationBtw').value.split(' - ')[0];
        const toValue = document.getElementById('toStationBtw').value.split(' - ')[0];

        return stations.filter(station => {
            const [code, name] = [station[0], station[1]];

            // Skip if station code matches either input's selected station code
            if (currentInput !== 'from' && code === fromValue) return false;
            if (currentInput !== 'to' && code === toValue) return false;

            return code.toLowerCase().includes(value) ||
                (name && name.toLowerCase().includes(value));
        }).slice(0, 10); // Limit to 10 suggestions
    }

    function setupStationAutocomplete(input, suggestionsContainer) {
        let selectedIndex = -1;

        // Add Enter key handler for input fields
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();

                if (input.id === 'fromStationBtw') {
                    document.getElementById('toStationBtw').focus();
                } else if (input.id === 'toStationBtw') {
                    document.getElementById('searchBtwButton').click();
                }
            }
        });

        function validateStations() {
            const fromValue = document.getElementById('fromStationBtw').value;
            const toValue = document.getElementById('toStationBtw').value;
            const searchButton = document.getElementById('searchBtwButton');
            const errorDiv = document.getElementById('btwStationError') || (() => {
                const div = document.createElement('div');
                div.id = 'btwStationError';
                div.className = 'error-message';
                const container = document.querySelector('.btw-stations-container');
                if (container) {
                    container.appendChild(div);
                }
                return div;
            })();

            if (fromValue && toValue && fromValue === toValue) {
                searchButton.disabled = true;
                errorDiv.textContent = 'From and To stations cannot be the same';
                errorDiv.style.display = 'block';
            } else {
                searchButton.disabled = false;
                errorDiv.style.display = 'none';
            }
        }

        function showStationSuggestions(value) {
            if (!value) {
                suggestionsContainer.style.display = 'none';
                return;
            }

            const isFromInput = input.id === 'fromStationBtw';
            const matches = filterStations(value, isFromInput ? 'from' : 'to');
            suggestionsContainer.innerHTML = '';

            if (matches.length > 0) {
                suggestionsContainer.style.display = 'block';

                matches.forEach((station, index) => {
                    const [code, name] = [station[0], station[1]];
                    const suggestion = document.createElement('div');
                    suggestion.className = 'suggestion-item';
                    suggestion.innerHTML = `
                        <span class="station-code">${code}</span>
                        <span class="station-name">${name || ''}</span>
                    `;

                    suggestion.addEventListener('click', () => {
                        input.value = `${code} - ${name}`;
                        suggestionsContainer.style.display = 'none';
                        validateStations();
                    });

                    suggestion.addEventListener('mouseenter', () => {
                        const items = suggestionsContainer.querySelectorAll('.suggestion-item');
                        items.forEach(item => item.classList.remove('selected'));
                        suggestion.classList.add('selected');
                        selectedIndex = index;
                    });

                    suggestionsContainer.appendChild(suggestion);
                });
            } else {
                suggestionsContainer.style.display = 'none';
            }
        }

        input.addEventListener('input', () => {
            const value = input.value.trim();
            showStationSuggestions(value);
        });

        input.addEventListener('keydown', (e) => {
            const suggestions = suggestionsContainer.querySelectorAll('.suggestion-item');

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                selectedIndex = Math.min(selectedIndex + 1, suggestions.length - 1);
                updateSelectedSuggestion(suggestions);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                selectedIndex = Math.max(selectedIndex - 1, -1);
                updateSelectedSuggestion(suggestions);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (selectedIndex > -1 && suggestions[selectedIndex]) {
                    const selectedValue = suggestions[selectedIndex].querySelector('.station-name').textContent;
                    const selectedCode = suggestions[selectedIndex].querySelector('.station-code').textContent;
                    input.value = `${selectedCode} - ${selectedValue}`;
                    suggestionsContainer.style.display = 'none';
                }
            } else if (e.key === 'Escape') {
                suggestionsContainer.style.display = 'none';
            }
        });

        function updateSelectedSuggestion(suggestions) {
            suggestions.forEach((suggestion, i) => {
                if (i === selectedIndex) {
                    suggestion.classList.add('selected');
                    suggestion.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                } else {
                    suggestion.classList.remove('selected');
                }
            });
        }

        // Hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!input.contains(e.target) && !suggestionsContainer.contains(e.target)) {
                suggestionsContainer.style.display = 'none';
            }
        });
    }

    if (fromInput && fromSuggestions) {
        setupStationAutocomplete(fromInput, fromSuggestions);
    }

    if (toInput && toSuggestions) {
        setupStationAutocomplete(toInput, toSuggestions);
    }
}
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

async function fetchTrainsBetweenStations(fromStation, toStation) {
    try {
        // Extract station codes from the input values (format: "CODE - Station Name")
        const fromCode = fromStation.split(' - ')[0];
        const toCode = toStation.split(' - ')[0];

        const response = await fetch('https://node-rahul-timbaliya.vercel.app/api/train/getBetweenTrain', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                fromStation: fromCode,
                toStation: toCode
            })
        });

        if (!response.ok) {
            throw new Error('Failed to fetch trains');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching trains between stations:', error);
        throw error;
    }
}

function redirectToMap(trainNumber, actualtime) {

    const [hours, minutes] = actualtime.split(":").map(Number);
    // Get current date and time
    const now = new Date();
    // Subtract the given time
    now.setHours(now.getHours() - hours);
    now.setMinutes(now.getMinutes() - minutes);

    // Format the date as DD-MMM-YY
    const options = { day: '2-digit', month: 'short', year: '2-digit' };
    const formattedDate = now.toLocaleDateString('en-GB', options).replace(/ /g, '-');
   
    const data = {
        trainNumber: trainNumber,
        date: formattedDate,
        fullMap: "true"
    };

    const secretKey = sessionStorage.getItem("encryptionKey");
    // Encrypt data
    const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), secretKey).toString();

    const encoded = encodeURIComponent(encrypted);

    window.open(window.origin+window.location.pathname.replace('index.html', `map.html?data=${encoded}`), '_blank');
}

// Display trains between stations
function displayBtwResults(trainsData) {
    const btwResult = document.getElementById('btwResult');

    if (!trainsData || !trainsData.data || trainsData.data.length === 0) {
        btwResult.innerHTML = '<div class="error">No trains found between these stations</div>';
        return;
    }

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = days[new Date().getDay()];
    const currentTime = new Date();
    const currentHours = currentTime.getHours();
    const currentMinutes = currentTime.getMinutes();
    const currentTimeInMinutes = currentHours * 60 + currentMinutes;

    // Sort trains by departure time
    const sortedTrains = [...trainsData.data].sort((a, b) => {
        const timeA = parseInt(a.arrived.replace(':', ''));
        const timeB = parseInt(b.arrived.replace(':', ''));
        return timeA - timeB;
    });

    let html = `
        <div class="route-header">
            <h3>Trains from ${trainsData.fromStation} to ${trainsData.toStation}</h3>
            <div class="route-summary">
                <span class="total-train-badge">${sortedTrains.length} Trains Found</span>
            </div>
        </div>
        <div class="trains-container">`;

    sortedTrains.forEach(train => {
        const runsToday = train.runOn.includes(today);

        // Convert train times to minutes for comparison
        const [arrHours, arrMinutes] = train.arrived.split(':').map(Number);
        const [reachHours, reachMinutes] = train.reached.split(':').map(Number);
        const arrivalTimeInMinutes = arrHours * 60 + arrMinutes;
        const reachTimeInMinutes = reachHours * 60 + reachMinutes;

        // Handle time crossing midnight
        let adjustedReachTimeInMinutes = reachTimeInMinutes;
        if (reachTimeInMinutes < arrivalTimeInMinutes) {
            adjustedReachTimeInMinutes += 24 * 60; // Add 24 hours
        }

        // Check if train is currently running
        const isTrainTime = currentTimeInMinutes >= arrivalTimeInMinutes &&
            currentTimeInMinutes <= adjustedReachTimeInMinutes;

        // Check if train will depart later today
        const willDepartToday = runsToday && arrivalTimeInMinutes > currentTimeInMinutes;
        const runDaily = train.runOn.length === 7;
        const showTrackButton = runsToday && (isTrainTime || willDepartToday);

        console.log(`Train ${train.trainNumber}:`, {
            runsToday,
            currentTime: `${currentHours}:${currentMinutes}`,
            arrivalTime: `${arrHours}:${arrMinutes}`,
            reachTime: `${reachHours}:${reachMinutes}`,
            isTrainTime,
            willDepartToday,
            showTrackButton
        });

        html += `
            <div class="train-card">
                <div class="train-card-header">
                    <div class="train-primary-info">
                        <h3>${train.trainName}</h3>
                        <span class="train-number-badge">${train.trainNumber}</span>
                    </div>
                    ${showTrackButton ? `
                        <button class="track-button" onclick="redirectToMap('${train.trainNumber}', '${train.trainDuration}')">
                            Track Train</button>
                    ` : ''}
                </div>
                <div class="train-route-info">
                    <div class="route-station">
                       
                        <div class="station-details">
                            <div class="route-station-name">${train.arrivedStation}</div>
                            <div class="station-timing">
                            <span class="time">${train.arrived}</span>
                         
                        </div>
                        </div>
                    </div>
                    <div class="journey-info">
                        <span class="duration train-number-badge">${train.duration} - Hours</span>
                        <div class="journey-line">
                            <div class="line"></div>
                          
                        </div>
                    </div>
                    <div class="route-station">
                       
                        <div class="station-details">
                            <div class="route-station-name">${train.destinationStation}</div>
                             <div class="station-timing">
                            <span class="time">${train.reached}</span>
                        </div>
                        </div>
                    </div>
                </div>
                <div class="train-details-grid">
                    <div class="detail-box">
                        <span class="detail-box-label">Full Route</span>
                        <div class="route-endpoints">
                            <span class="start-point">${train.from}</span>
                            <span class="route-arrow">→</span>
                            <span class="end-point">${train.to}</span>
                        </div>
                    </div>
                    <div class="running-days">
                        <span class="detail-box-label">Runs On: ${train.runOn.length === 7 ? '(Daily)' : ''}</span>
                        <div class="days-list">
                            ${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => `
                                <span class="day-badge ${train.runOn.includes(day) ? 'active' : 'inactive'}" title="${day}">
                                    ${day.slice(0, 3)}
                                </span>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    btwResult.innerHTML = html;
}


// Function to fetch PNR status
async function fetchPnrStatus(pnrNumber) {
    try {
        const response = await fetch(`https://node-rahul-timbaliya.vercel.app/api/train/getPNRInfo`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                pnrNumber: pnrNumber
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
                <span class="status-badge ${statusClass == "can/mod" ? "cancelled" : statusClass}">${statusText}</span>
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
function toggleNonStopStations() {
    const showNonStop = document.getElementById('showNonStopStations').checked;
    const nonStopStations = document.querySelectorAll('.pass-through-station');
    nonStopStations.forEach(station => {
        station.style.display = showNonStop ? 'flex' : 'none';
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initializeDatePicker();
    initPnrTab();
    initializeTrainAutocomplete();
    initializeBtwAutocomplete();

    // Add event listener for between stations search button
    const searchBtwButton = document.getElementById('searchBtwButton');
    if (searchBtwButton) {
        searchBtwButton.addEventListener('click', async () => {
            const fromStation = document.getElementById('fromStationBtw').value.trim();
            const toStation = document.getElementById('toStationBtw').value.trim();

            if (!fromStation || !toStation) {
                if (!fromStation) {
                    document.getElementById('fromStationBtw').classList.add('input-error');
                    setTimeout(() => document.getElementById('fromStationBtw').classList.remove('input-error'), 500);
                }
                if (!toStation) {
                    document.getElementById('toStationBtw').classList.add('input-error');
                    setTimeout(() => document.getElementById('toStationBtw').classList.remove('input-error'), 500);
                }
                return;
            }

            try {
                searchBtwButton.disabled = true;
                searchBtwButton.classList.add('loading');
                document.getElementById('btwResult').innerHTML = '<div class="loading">Searching for trains...</div>';

                const trainsData = await fetchTrainsBetweenStations(fromStation, toStation);
                displayBtwResults(trainsData);
            } catch (error) {
                console.error('Error searching trains:', error);
                document.getElementById('btwResult').innerHTML = '<div class="error">Error: Failed to fetch trains. Please try again.</div>';
            } finally {
                searchBtwButton.disabled = false;
                searchBtwButton.classList.remove('loading');
            }
        });
    }

    // Initialize non-stop stations toggle
    const toggleSwitch = document.getElementById('showNonStopStations');
    if (toggleSwitch) {
        toggleSwitch.addEventListener('change', toggleNonStopStations);
    }

    function swapStations() {
        const fromStation = document.getElementById('fromStationBtw');
        const toStation = document.getElementById('toStationBtw');
        const tempValue = fromStation.value;
        fromStation.value = toStation.value;
        toStation.value = tempValue;
    }

    // Add in the DOMContentLoaded event listener section
    const swapButton = document.getElementById('swapStationsBtn');
    if (swapButton) {
        swapButton.addEventListener('click', swapStations);
    }
});