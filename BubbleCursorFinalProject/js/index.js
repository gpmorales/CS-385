// Global Variables and Constants
let TARGET_COUNT = Math.floor(Math.random() * 4) + 3;
let TOTAL_ITEM_COUNT = Math.floor(Math.random() * 7) + 10;
const TRIAL_COUNT = 15;

let CURRENT_TARGETS = new Set();       // { element, x-coord, y-coord, radius }
let FINAL_SELECTIONS = new Set();      // { element, x-coord, y-coord, radius }

let HIGHLIGHTED_TARGET = null;

// Data collection for each trial
let trialData = [];

class TrialData {
    constructor(trialNumber, targetCount, totalItemCount) {
        this.trialNumber = trialNumber;                  // Trial number
        this.totalItemCount = totalItemCount;            // Total items on screen
        this.targetCount = targetCount;                  // Number of required targets
        this.startTime = performance.now();              // Trial start time
        this.endTime = null;                             // Trial end time
        this.timeTaken = null;                           // Duration in seconds

        // Selection stats
        this.totalSelections = 0;
        this.correctSelections = 0;
        this.incorrectSelections = 0;

        // Deselection tracking
        this.deselectedTargets = 0;
        this.deselectedNonTargets = 0;

        // Cursor movement tracking
        this.totalCursorDistance = 0; // Sum of movement in pixels
    }

    endTrial() {
        this.endTime = performance.now();
        this.timeTaken = (this.endTime - this.startTime) / 1000;
    }
}



// **************************** Training Page Event Listener ****************************
document.addEventListener("DOMContentLoaded", () => {
    // Create custom brush, trail logic, and more
    if (document.title === "Training") {
        let confirmedSelections = new Set(); // Track finalized selections

        // Create custom cursor
        const cursor = document.createElement("div");
        cursor.id = "custom-cursor";

        // Create bubble ring and append inside cursor
        const bubbleRing = document.createElement("div");
        bubbleRing.id = "bubble-ring";
        cursor.appendChild(bubbleRing);
        document.body.appendChild(cursor);

        // Toggle logic for custom cursor
        let isCustomCursorActive = false; // Tracks if cursor is active

        // Toggle custom cursor when Ctrl is pressed (latch on/off)
        document.addEventListener("keydown", (e) => {
            if (e.key === "Control") {
                isCustomCursorActive = !isCustomCursorActive; // Toggle state
                if (isCustomCursorActive) {
                    document.documentElement.style.cursor = "none"; // Hide default cursor
                    cursor.style.display = "block"; // Show custom cursor
                } else {
                    document.documentElement.style.cursor = ""; // Restore default cursor
                    cursor.style.display = "none"; // Hide custom cursor
                    // Clear any highlighted targets or paths
                    HIGHLIGHTED_TARGET.classList.remove("highlighted");
                    const path = document.getElementById("pull-curve");
                    path.style.display = "none";
                }
            }
        });

        // Update the bubble size and target selection
        document.addEventListener("mousemove", (e) => {
            if (!isCustomCursorActive) return;
            const x = e.clientX;
            const y = e.clientY;
            cursor.style.left = `${e.clientX}px`;
            cursor.style.top = `${e.clientY}px`;

            const radius = Math.max(20, getDistanceToNearestTarget(x, y));
            bubbleRing.style.width = `${radius * 2}px`;
            bubbleRing.style.height = `${radius * 2}px`;
        });

        // Add the closest element to list
        document.addEventListener("mousedown", (e) => {
            if (e.button === 0 && isCustomCursorActive) {
            }
        });
    }
});


// **************************** Testing Page Event Listener ****************************
document.addEventListener("DOMContentLoaded", () => {
    // Create custom brush, trail logic, and more
    if (document.title === "Testing") {
        // Begin trial
        let currentTrial = new TrialData(trialData.length + 1, TARGET_COUNT, TOTAL_ITEM_COUNT);
        let confirmedSelections = new Set(); // Track finalized selections

        // IMPORTANT: Handle Next Trial and Finish
        document.getElementById("next-trial-btn").addEventListener("click", () => {
            // Save Trial Data
            if (currentTrial.trialNumber === TRIAL_COUNT - 1) {
                // Hide next button
                document.getElementById("next-trial-btn").style.display = "none";
                // Show finish button
                const finishButton = document.getElementById('finish-btn');
                finishButton.removeAttribute('hidden');
            }

            // Reset targets and params
            TARGET_COUNT = Math.floor(Math.random() * 4) + 3; // Random between 3-6
            TOTAL_ITEM_COUNT = Math.floor(Math.random() * 6) + 10; // Random between 10-15
            generateRandomTargets("demo-area", { width: 1200, height: 600 });

            // Record this trial
            currentTrial.endTrial()
            trialData.push(currentTrial);

            // Prepare new trial
            currentTrial = new TrialData(trialData.length + 1, TARGET_COUNT, TOTAL_ITEM_COUNT);
        });

        document.getElementById("finish-btn").addEventListener("click", () => {
            // Record final trial
            currentTrial.endTrial()
            trialData.push(currentTrial);
            localStorage.setItem('trialData', JSON.stringify(trialData));
            window.location.href = "/html/summary.html";
        });

        // Create custom cursor
        const cursor = document.createElement("div");
        cursor.id = "custom-cursor";

        // Create bubble ring and append inside cursor
        const bubbleRing = document.createElement("div");
        bubbleRing.id = "bubble-ring";
        cursor.appendChild(bubbleRing);
        document.body.appendChild(cursor);

        // Toggle logic for custom cursor
        let isCustomCursorActive = false; // Tracks if cursor is active

        // Toggle custom cursor when Ctrl is pressed (latch on/off)
        document.addEventListener("keydown", (e) => {
            if (e.key === "Control") {
                isCustomCursorActive = !isCustomCursorActive; // Toggle state
                if (isCustomCursorActive) {
                    document.documentElement.style.cursor = "none"; // Hide default cursor
                    cursor.style.display = "block"; // Show custom cursor
                } else {
                    document.documentElement.style.cursor = ""; // Restore default cursor
                    cursor.style.display = "none"; // Hide custom cursor
                    // Clear any highlighted targets or paths
                    HIGHLIGHTED_TARGET.classList.remove("highlighted");
                    const path = document.getElementById("pull-curve");
                    path.style.display = "none";
                }
            }
        });

        // Update the bubble size and target selection
        document.addEventListener("mousemove", (e) => {
            if (!isCustomCursorActive) return;
            const x = e.clientX;
            const y = e.clientY;
            cursor.style.left = `${e.clientX}px`;
            cursor.style.top = `${e.clientY}px`;

            const radius = Math.max(20, getDistanceToNearestTarget(x, y));
            bubbleRing.style.width = `${radius * 2}px`;
            bubbleRing.style.height = `${radius * 2}px`;
        });

        // Add the closest element to list
        document.addEventListener("mousedown", (e) => {
            if (e.button === 0 && isCustomCursorActive) {
            }
        });
    }
});


// Utility functions:
function getDistanceToNearestTarget(cursorX, cursorY) {
    const demoArea = document.getElementById("demo-area");
    const demoRect = demoArea.getBoundingClientRect();

    // Convert mouse position to be relative to #demo-area
    const localX = cursorX - demoRect.left;
    const localY = cursorY - demoRect.top;

    if (CURRENT_TARGETS.length === 0) return 0;

    let closest = null;
    let closestCenterDist = Infinity;

    CURRENT_TARGETS.forEach(target => {
        const dx = target.x - localX;
        const dy = target.y - localY;
        const centerDist = Math.sqrt(dx * dx + dy * dy);

        if (centerDist < closestCenterDist) {
            closest = target;
            closestCenterDist = centerDist;
        }
    });

    if (!closest) return 0;

    // Highlight it (ONLY this one)
    if (HIGHLIGHTED_TARGET && HIGHLIGHTED_TARGET !== closest.element) {
        HIGHLIGHTED_TARGET.classList.remove("highlighted");
    }

    closest.element.classList.add("highlighted");
    HIGHLIGHTED_TARGET = closest.element;

    // Optional accessibility guide curve
    const path = document.getElementById("pull-curve");

    if (HIGHLIGHTED_TARGET) {
        const targetRect = HIGHLIGHTED_TARGET.getBoundingClientRect();
        const targetCenterX = targetRect.left + targetRect.width / 2;
        const targetCenterY = targetRect.top + targetRect.height / 2;
        const bubbleCenterX = cursorX;
        const bubbleCenterY = cursorY;
        const dx = targetCenterX - bubbleCenterX;
        const dy = targetCenterY - bubbleCenterY;

        // Adjust the curve
        const controlX = bubbleCenterX + dx * 0.5 + dy * 0.4;
        const controlY = bubbleCenterY - 10;

        const curvePath = `M ${bubbleCenterX},${bubbleCenterY} Q ${controlX},${controlY} ${targetCenterX},${targetCenterY}`;
        path.setAttribute("d", curvePath);
        path.style.display = "block";
    } else {
        path.setAttribute("d", "");
        path.style.display = "none";
    }

    // Return the distance the Bubble needs to grow to touch nearest target edge
    return Math.max(0, closestCenterDist - closest.radius);
}


// Generate Random Circle Targets
function generateRandomTargets(containerId, bounds) {
    const container = document.getElementById(containerId);

    // Clear existing targets
    container.querySelectorAll('.random-target').forEach(t => t.remove());

    // Reset for each trial
    CURRENT_TARGETS = [];
    let attempts = 0;
    const minRadius = 20;
    const maxRadius = 35;

    while (CURRENT_TARGETS.length < TOTAL_ITEM_COUNT && attempts < 10000) {
        const radius = Math.random() * (maxRadius - minRadius) + minRadius;
        const x = Math.random() * ((bounds.width - 20) - radius * 2);
        const y = Math.random() * ((bounds.height - 20) - radius * 2);
        const centerX = x + radius;
        const centerY = y + radius;

        // Check for overlap with existing targets
        const overlaps = CURRENT_TARGETS.some(t => {
            const dx = t.x - centerX;
            const dy = t.y - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance < radius * 2 + 5; // add 5 padding in between circles
        });

        // Add non overlapping target
        if (!overlaps) {
            const target = document.createElement("div");
            target.className = "random-target";
            target.style.left = `${x}px`;
            target.style.top = `${y}px`;
            target.style.width = `${radius * 2}px`;
            target.style.height = `${radius * 2}px`;

            if (CURRENT_TARGETS.length <= TARGET_COUNT) {
                target.style.backgroundColor = "limegreen";
            }
            container.appendChild(target);

            // Add this to current targets
            CURRENT_TARGETS.push({ element: target, x: centerX, y: centerY, radius });
        }
        attempts++;
    }

    if (attempts >= 10000) {
        console.error("Could not place all targets WITHOUT overlap!");
    }
}


// Load demo area
document.addEventListener("DOMContentLoaded", () => {
    if (document.title === "Testing") {
        generateRandomTargets("demo-area", { width: 1200, height: 600 });
    }
    if (document.title === "Training") {
        generateRandomTargets("demo-area", { width: 800, height: 500 });
    }
});


// **************************** Summary Page Event Listener ****************************
document.addEventListener('DOMContentLoaded', () => {
    if (document.title === "Summary") {
        const tableBody = document.getElementById('resultsTable');
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
                <td>${trial.totalItemCount}</td>
                <td>${trial.targetCount}</td>
                <td>${trial.correctSelections}</td>
                <td>${trial.incorrectSelections}</td>
                <td>${trial.deselectedTargets}</td>
                <td>${trial.deselectedNonTargets}</td>
                <td>${trial.timeTaken.toFixed(2)}</td>
                <td>${((trial.deselectedTargets + trial.deselectedNonTargets) / trial.totalSelections * 100).toFixed(1)}%</td>
                <td>${(trial.deselectedTargets / trial.correctSelections * 100).toFixed(1)}%</td>
                <td>${((trial.correctSelections / trial.targetCount) * 100).toFixed(1)}%</td>
                <td>${trial.incorrectSelections === 0 ? '✓' : '✗'}</td>
            `;
            tableBody.appendChild(row);
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