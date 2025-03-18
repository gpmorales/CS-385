// Load static constants and TrialData array with the number of tasks to track trial #

const TRAIN_PHASE_CLICK_COUNT = 5;  // number of attempts in the training phase
const TRIAL_PHASE_CLICK_COUNT = 15;  // number of attempts in the trial phase
const SIZES = [15, 20, 30, 35];   // circle diameters in px
const DISTANCES = [180, 200, 240, 280, 300];  // distances in px

// Data collection for each trial
let trialData = [];

class TrialData {
    constructor(clickCount, circleSize, radius) {
        this.trialNumber = clickCount + 1;
        this.targetSize = circleSize;
        this.targetDistance = radius;
        this.lastTargetX = null;
        this.lastTargetY = null;
        this.currentTargetX = null;
        this.currentTargetY = null;
        this.attemptedX = null;
        this.attemptedY = null;
        this.timeTaken = null;
        this.accuracy = null;
        this.missCount = 0;
    }
}

// **************************** Training Phase Event Listener ****************************
document.addEventListener('DOMContentLoaded', () => {
    // Circles and config initialization
    if (document.title === "Training") {
        let radius = DISTANCES[Math.floor(Math.random() * DISTANCES.length)];
        let circleSize = SIZES[Math.floor(Math.random() * SIZES.length)];
        const numCircles = 12;

        // Positioning of ring on training page
        const centerX = 900;
        const centerY = 400;

        let currentTargetIndex = 0;
        let clickCount = 0;
        let circles = [];

        function createCircle(x, y, fill) {
            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute('cx', x);
            circle.setAttribute('cy', y);
            circle.setAttribute('r', circleSize);
            circle.setAttribute('fill', fill);
            return circle;
        }

        // Create circles in the ring
        function initializeCircleRingPattern() {
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute('width', '1500');
            svg.setAttribute('height', '1500');
            document.getElementById('targets').appendChild(svg);

            for(let i = 0; i < numCircles; i++) {
                const angle = (i * 2 * Math.PI) / numCircles;
                const x = centerX + radius * Math.cos(angle);
                const y = centerY + radius * Math.sin(angle);
                const circle = createCircle(x, y, 'gray');
                circles.push(circle);
                svg.appendChild(circle);
                circle.addEventListener('click', () => handleClick(i));
            }
            // Set initial target
            setTarget(0);
        }

        // Reset all circles to gray and one circle as the new target
        function setTarget(index) {
            circles.forEach(circle => circle.setAttribute('fill', 'gray'));
            circles[index].setAttribute('fill', 'green');
            currentTargetIndex = index;
        }

        // Angles are relative to horizontal axis?
        function getRandomTarget() {
            const moves = [4, 3, 2];
            const chosenMove = moves[Math.floor(Math.random() * moves.length)];
            return (currentTargetIndex + chosenMove) % 8;
        }

        // Update all circles with new size and positions
        function updateCircles() {
            // Get new random values
            radius = DISTANCES[Math.floor(Math.random() * DISTANCES.length)];
            circleSize = SIZES[Math.floor(Math.random() * SIZES.length)];
            circles.forEach((circle, i) => {
                const angle = (i * 2 * Math.PI) / numCircles;
                const x = centerX + radius * Math.cos(angle);
                const y = centerY + radius * Math.sin(angle);
                circle.setAttribute('r', circleSize);
                circle.setAttribute('cx', x);
                circle.setAttribute('cy', y);
            });
        }

        function handleClick(clickedIndex) {
            const clickedCircle = circles[clickedIndex];
            const rect = clickedCircle.getBoundingClientRect();

            if (clickedIndex === currentTargetIndex) {
                clickCount++;
                showIndicator('HIT', 'green', rect.left, rect.top);
                updateCircles();
                setTarget(getRandomTarget());
                // Show continue button after use has done training run
                if (clickCount >= TRAIN_PHASE_CLICK_COUNT) {
                    document.querySelector('button').hidden = false;
                }
            } else {
                showIndicator('MISS', 'red', rect.left, rect.top);
            }
        }

        // HIT or MISS indicator for user on training page
        function showIndicator(text, color, x, y) {
            const indicator = document.createElement('div');
            indicator.style.position = 'absolute';
            indicator.style.left = (x - 30) + 'px';
            indicator.style.top = (y - 30) + 'px';
            indicator.style.color = color;
            indicator.style.fontSize = '24px';
            indicator.style.fontWeight = 'bold';
            indicator.textContent = text;
            document.body.appendChild(indicator);
            // Show and remove
            setTimeout(() => indicator.remove(), 300);
        }

        // Create the inital ring pattern
        initializeCircleRingPattern();
    }
});


// **************************** Trial Phase Event Listener ****************************
document.addEventListener('DOMContentLoaded', () => {
    if (document.title === "Trials") {
        // Circles and config initialization
        let radius = DISTANCES[Math.floor(Math.random() * DISTANCES.length)];
        let circleSize = SIZES[Math.floor(Math.random() * SIZES.length)];
        const numCircles = 12;

        // Positioning of ring on training page
        const centerX = 900;
        const centerY = 400;

        let circles = [];
        let currentTargetIndex = 0;
        let clickCount = 0;
        let startTime = null;
        let lastTargetPosition = null;

        let currentTrial = new TrialData(clickCount, circleSize, radius);

        function createCircle(x, y, fill) {
            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute('cx', x);
            circle.setAttribute('cy', y);
            circle.setAttribute('r', circleSize);
            circle.setAttribute('fill', fill);
            return circle;
        }

        function updateTaskContainer() {
            document.getElementById('trialCounter').textContent = clickCount + 1;
            document.getElementById('circleArea').textContent = circleSize * 2;
            document.getElementById('distance').textContent = radius;
        }

        function initializeRingPattern() {
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute('width', '1500');
            svg.setAttribute('height', '1500');
            document.getElementById('targets').appendChild(svg);

            for(let i = 0; i < numCircles; i++) {
                const angle = (i * 2 * Math.PI) / numCircles;
                const x = centerX + radius * Math.cos(angle);
                const y = centerY + radius * Math.sin(angle);

                const circle = createCircle(x, y, 'gray');
                circles.push(circle);
                svg.appendChild(circle);
                circle.addEventListener('click', (event) => handleClick(i, event));
            }

            setTarget(0);
            startTime = Date.now();
        }

        function getCirclePosition(circle) {
            return {
                x: parseFloat(circle.getAttribute('cx')),
                y: parseFloat(circle.getAttribute('cy'))
            };
        }

        function setTarget(index) {
            circles.forEach(circle => circle.setAttribute('fill', 'gray'));
            circles[index].setAttribute('fill', 'green');
            currentTargetIndex = index;
        }

        function getRandomTarget() {
            const moves = [4, 3, 2];
            const chosenMove = moves[Math.floor(Math.random() * moves.length)];
            return (currentTargetIndex + chosenMove) % numCircles;
        }

        function updateCircles() {
            radius = DISTANCES[Math.floor(Math.random() * DISTANCES.length)];
            circleSize = SIZES[Math.floor(Math.random() * SIZES.length)];
            circles.forEach((circle, i) => {
                const angle = (i * 2 * Math.PI) / numCircles;
                const x = centerX + radius * Math.cos(angle);
                const y = centerY + radius * Math.sin(angle);
                circle.setAttribute('r', circleSize);
                circle.setAttribute('cx', x);
                circle.setAttribute('cy', y);
            });
        }

        function handleClick(clickedIndex, event) {
            const currentTargetCircle = circles[currentTargetIndex];
            const currentTargetPosition = getCirclePosition(currentTargetCircle);

            // Get mouse click coordinates from the event
            const rect = document.querySelector('svg').getBoundingClientRect();
            const attemptedX = event.clientX - rect.left;
            const attemptedY = event.clientY - rect.top;

            // Record necessary data for all clicks
            currentTrial.lastTargetX = lastTargetPosition === null ? -1 : lastTargetPosition.x;
            currentTrial.lastTargetY = lastTargetPosition === null ? -1 : lastTargetPosition.y;
            currentTrial.currentTargetX = currentTargetPosition.x;
            currentTrial.currentTargetY = currentTargetPosition.y;
            currentTrial.attemptedX = attemptedX;  // mouse click X coord
            currentTrial.attemptedY = attemptedY;  // mouse click Y coord

            currentTrial.accuracy = calculateAccuracy(
                currentTrial.attemptedX,
                currentTrial.attemptedY,
                currentTrial.currentTargetX,
                currentTrial.currentTargetY,
                circleSize / 2
            );

            if (currentTargetIndex === clickedIndex) {
                const endTime = Date.now();
                currentTrial.timeTaken = endTime - startTime;
                currentTrial.isHit = true;
                // Store current target/green position for next trial
                lastTargetPosition = currentTargetPosition;
                trialData.push(currentTrial);
                clickCount++;

                if (clickCount >= TRIAL_PHASE_CLICK_COUNT) {
                    document.querySelector('button').hidden = false;
                    localStorage.setItem('trialData', JSON.stringify(trialData));
                } else {
                    updateCircles();
                    setTarget(getRandomTarget());
                    updateTaskContainer();
                    startTime = Date.now();
                    currentTrial = new TrialData(clickCount, circleSize, radius);
                }
            } else {
                currentTrial.missCount++;
            }
        }

        function calculateAccuracy(clickX, clickY, targetX, targetY, circleRadius) {
            const distance = Math.sqrt(Math.pow(targetX - clickX, 2) + Math.pow(targetY - clickY, 2));
            if (distance === 0) return 100;
            if (distance >= circleRadius) return 0;
            return Math.max(0, ((circleRadius - distance) / circleRadius) * 100);
        }

        // Create the inital ring pattern
        initializeRingPattern();
        updateTaskContainer();
    }
});


// **************************** Summary Page Event Listener ****************************
document.addEventListener('DOMContentLoaded', () => {
    if (document.title === "Summary") {
        const tbody = document.getElementById('resultsTable');

        let trialData;

        try {
            trialData = JSON.parse(localStorage.getItem('trialData') || '[]');
        } catch (error) {
            console.error('Failed to load trial data:', error);
            return;
        }

        trialData.forEach(trial => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${trial.trialNumber}</td>
                <td>${trial.targetSize}</td>
                <td>${trial.targetDistance}</td>
                <td>${trial.timeTaken}</td>
                <td>${trial.isHit ? '✓' : '✗'}</td>
                <td>${trial.missCount}</td>
                <td>(${Math.round(trial.currentTargetX)}, ${Math.round(trial.currentTargetY)})</td>
                <td>(${Math.round(trial.attemptedX)}, ${Math.round(trial.attemptedY)})</td>
                <td>${trial.accuracy.toFixed(3)}%<td>
            `;
            tbody.appendChild(row);
        });

        // Convert trialData array to CSV string/blob
        document.getElementById('downloadCSV').addEventListener('click', () => {
            // Convert array to CSV string
            const headers = Object.keys(trialData[0]).join(',');
            const rows = trialData.map(trial => Object.values(trial).join(','));
            const csv = [headers, ...rows].join('\n');

            // Create and download CSV file
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'trial_data.csv';
            a.click();
        });
    }
});


// Grab form data from the introduction.html?
document.addEventListener('DOMContentLoaded', () => {
    if (document.title === "Introduction") {
        const form = document.getElementById('userDataForm');
        if (form) {
            form.addEventListener('submit', function(e) {
                console.log("Form submitted");
                e.preventDefault();
                const device = document.getElementById('device').value;
                const deviceDetails = document.getElementById('deviceDetails').value;
                const screenSize = document.getElementById('screenSize').value;
                const regularity = document.getElementById('regularity').value;
                const queryString = `?device=${encodeURIComponent(device)}&deviceDetails=${encodeURIComponent(deviceDetails)}&screenSize=${encodeURIComponent(screenSize)}&regularity=${encodeURIComponent(regularity)}`;
                window.location.href = '/html/introduction.html' + queryString;
            });
        } else {
            console.log("Form not found");
        }
    }
});