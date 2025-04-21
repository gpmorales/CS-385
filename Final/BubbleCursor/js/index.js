// Global Variables and Constants
const TRIAL_COUNT = 15;

let ITEM_SET = new Map();               // Map<id, obj>
let TARGET_SET = new Map();             // Map<id, obj>
let SELECTION_SET = new Map();          // Map<id, obj>
let DESELECTION_SET = new Map();        // Map<id, obj>
let HIGHLIGHTED_TARGET = null;    // Store the current closest item object

// Data collection for each trial
let trialData = [];

// Cursor
let lastCursorPos = null;                        // { x, y }
let isCursorInsideDemo = false;

class TrialData {
    constructor(trialNumber, targetCount, totalItemCount) {
        this.trialNumber = trialNumber;                  // Trial number
        this.totalItemCount = totalItemCount;            // Total items on screen
        this.targetCount = targetCount;                  // Number of required targets
        this.startTime = performance.now();              // Trial start time
        this.endTime = null;                             // Trial end time
        this.timeTaken = null;                           // Duration in seconds
        this.totalSelections = 0;                        // Total selections made
        this.correctSelections = 0;                      // Correct selections made
        this.incorrectSelections = 0;                    // Incorrect selections made
        this.deselectedTargets = 0;                      // Number of targets deselected
        this.deselectedNonTargets = 0;                   // Number of non-targets deselected
        this.totalCursorDistance = 0;                    // Sum of movement in pixels
    }

    endTrial() {
        this.endTime = performance.now();
        this.timeTaken = (this.endTime - this.startTime) / 1000;
    }
}


// **************************** Bubble Mouse Training Page Event Listener ****************************
document.addEventListener("DOMContentLoaded", () => {
    // Create custom brush, trail logic, and more
    if (document.title === "BubbleTraining") {

        // Load targets in demo area
        generateRandomTargets("demo-area", { width: 800, height: 500 });

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
                    HIGHLIGHTED_TARGET.element.classList.remove("highlighted");
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
                if (!HIGHLIGHTED_TARGET.element.classList.contains("selected")) {
                    HIGHLIGHTED_TARGET.element.classList.add("selected");
                } else {
                    HIGHLIGHTED_TARGET.element.classList.remove("selected");
                }
            }
        });
    }
});


// **************************** Bubble Mouse Testing Page Event Listener ****************************
document.addEventListener("DOMContentLoaded", () => {
    // Create custom brush, trail logic, and more
    if (document.title === "BubbleTesting") {
        // Generate first trial setup and record correct counts
        const { targetCount, totalItemCount } = generateRandomTargets("demo-area", { width: 1200, height: 600 });
        let currentTrial = new TrialData(trialData.length + 1, targetCount, totalItemCount);

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

            // Analyze the metrics and data for this trial
            let correctSelections = 0;
            let incorrectSelections = 0;
            let deselectedTargets = 0;
            let deselectedNonTargets = 0;

            // Count correct/incorrect selections
            SELECTION_SET.forEach((item, id) => {
                if (TARGET_SET.has(id)) correctSelections++;
                else incorrectSelections++;
            });

            // Count de-selections (previously selected, now not in final set)
            DESELECTION_SET.forEach((item, id) => {
                if (TARGET_SET.has(id)) deselectedTargets++;
                else deselectedNonTargets++;
            });

            // Store data in trial object
            currentTrial.totalSelections = SELECTION_SET.size;
            currentTrial.correctSelections = correctSelections;
            currentTrial.incorrectSelections = incorrectSelections;
            currentTrial.deselectedTargets = deselectedTargets;
            currentTrial.deselectedNonTargets = deselectedNonTargets;

            // Prepare new trial by resetting targets and params
            currentTrial.endTrial()
            trialData.push(currentTrial);
            const { targetCount, totalItemCount } = generateRandomTargets("demo-area", { width: 1200, height: 600 });
            currentTrial = new TrialData(trialData.length + 1, targetCount, totalItemCount);
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
                    HIGHLIGHTED_TARGET.element.classList.remove("highlighted");
                    const path = document.getElementById("pull-curve");
                    path.style.display = "none";
                }
            }
        });

        // Select the highlighted element and add it to selection list
        document.addEventListener("mousedown", (e) => {
            if (e.button === 0 && isCustomCursorActive) {
                const id = HIGHLIGHTED_TARGET.id
                if (!HIGHLIGHTED_TARGET.element.classList.contains("selected")) {
                    HIGHLIGHTED_TARGET.element.classList.add("selected");
                    SELECTION_SET.set(id, HIGHLIGHTED_TARGET);
                } else {
                    SELECTION_SET.delete(id);
                    DESELECTION_SET.set(id, HIGHLIGHTED_TARGET);
                    HIGHLIGHTED_TARGET.element.classList.remove("selected");
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

            // Update cursor distance
            if (isCursorInsideDemo) {
                const x = e.clientX;
                const y = e.clientY;
                if (lastCursorPos) {
                    const dx = x - lastCursorPos.x;
                    const dy = y - lastCursorPos.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    currentTrial.totalCursorDistance += dist;
                }
                lastCursorPos = { x, y };
            }
        });

        // Update the cursor flags when it has travelled inside/outside the demo area
        const demoArea = document.getElementById("demo-area");
        demoArea.addEventListener("mouseenter", () => {
            isCursorInsideDemo = true;
            lastCursorPos = null; // Reset when entering
        });

        demoArea.addEventListener("mouseleave", () => {
            isCursorInsideDemo = false;
            lastCursorPos = null; // Stop tracking
        });
    }
});


// **************************** Traditional Mouse Training Page Event Listener ****************************
document.addEventListener("DOMContentLoaded", () => {
    // Create custom brush, trail logic, and more
    if (document.title === "TraditionalTraining") {
        // Load targets in demo area
        generateRandomTargets("demo-area", { width: 800, height: 500 });

        // Add the highlighted element to list
        document.addEventListener("mousedown", (e) => {
            if (e.button === 0 && e.target.classList.contains("random-target")) {
                e.target.classList.toggle("selected");
            }
        });
    }
});


// **************************** Traditional Mouse Testing Page Event Listener ****************************
document.addEventListener("DOMContentLoaded", () => {
    // Create custom brush, trail logic, and more
    if (document.title === "TraditionalTesting") {

        // Generate first trial setup and record correct counts
        const { targetCount, totalItemCount } = generateRandomTargets("demo-area", { width: 1200, height: 600 });
        let currentTrial = new TrialData(trialData.length + 1, targetCount, totalItemCount);

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

            // Analyze the metrics and data for this trial
            let correctSelections = 0;
            let incorrectSelections = 0;
            let deselectedTargets = 0;
            let deselectedNonTargets = 0;

            // Count correct/incorrect selections
            SELECTION_SET.forEach((item, id) => {
                if (TARGET_SET.has(id)) correctSelections++;
                else incorrectSelections++;
            });

            // Count de-selections (previously selected, now not in final set)
            DESELECTION_SET.forEach((item, id) => {
                if (TARGET_SET.has(id)) deselectedTargets++;
                else deselectedNonTargets++;
            });

            // Store data in trial object
            currentTrial.totalSelections = SELECTION_SET.size;
            currentTrial.correctSelections = correctSelections;
            currentTrial.incorrectSelections = incorrectSelections;
            currentTrial.deselectedTargets = deselectedTargets;
            currentTrial.deselectedNonTargets = deselectedNonTargets;

            // Prepare new trial by resetting targets and params
            currentTrial.endTrial()
            console.log(currentTrial)
            trialData.push(currentTrial);
            const { targetCount, totalItemCount } = generateRandomTargets("demo-area", { width: 1200, height: 600 });
            currentTrial = new TrialData(trialData.length + 1, targetCount, totalItemCount);
        });

        document.getElementById("finish-btn").addEventListener("click", () => {
            // Record final trial
            currentTrial.endTrial()
            trialData.push(currentTrial);
            localStorage.setItem('trialData', JSON.stringify(trialData));
            window.location.href = "/html/summary.html";
        });

        // Update the cursor distance
        document.addEventListener("mousemove", (e) => {
            // Update cursor distance
            if (isCursorInsideDemo) {
                const x = e.clientX;
                const y = e.clientY;
                if (lastCursorPos) {
                    const dx = x - lastCursorPos.x;
                    const dy = y - lastCursorPos.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    currentTrial.totalCursorDistance += dist;
                }
                lastCursorPos = { x, y };
            }
        });

        // Add the selected element to the list
        document.addEventListener("mousedown", (e) => {
            if (e.button === 0 && e.target.classList.contains("random-target")) {
                // Find the ID of the clicked target
                let selectedId = null;
                ITEM_SET.forEach((value, key) => {
                    if (value.element === e.target) {
                        selectedId = key;
                    }
                });

                // Toggle the selection and save deselection
                e.target.classList.toggle("selected");
                if (e.target.classList.contains("selected")) {
                    SELECTION_SET.set(selectedId, ITEM_SET.get(selectedId));
                } else {
                    SELECTION_SET.delete(selectedId);
                    DESELECTION_SET.set(selectedId, ITEM_SET.get(selectedId));
                }
            }
        });

        // Update the cursor flags when it has travelled inside/outside the demo area
        const demoArea = document.getElementById("demo-area");
        demoArea.addEventListener("mouseenter", () => {
            isCursorInsideDemo = true;
            lastCursorPos = null; // Reset when entering
        });

        demoArea.addEventListener("mouseleave", () => {
            isCursorInsideDemo = false;
            lastCursorPos = null; // Stop tracking
        });
    }
});


/**      Utility functions     **/
function getDistanceToNearestTarget(cursorX, cursorY) {
    const demoArea = document.getElementById("demo-area");
    const demoRect = demoArea.getBoundingClientRect();

    // Convert mouse position to be relative to #demo-area
    const localX = cursorX - demoRect.left;
    const localY = cursorY - demoRect.top;

    if (ITEM_SET.length === 0) return 0;

    let closest = null;
    let closestId = null;
    let closestCenterDist = Infinity;

    // Find the closest item by center distance
    ITEM_SET.forEach((item, id) => {
        const dx = item.x - localX;
        const dy = item.y - localY;
        const centerDist = Math.sqrt(dx * dx + dy * dy);

        if (centerDist < closestCenterDist) {
            closest = item;
            closestId = id;
            closestCenterDist = centerDist;
        }
    });

    if (!closest) return 0;

    // Remove highlight if different from current
    if (HIGHLIGHTED_TARGET && HIGHLIGHTED_TARGET.id !== closestId) {
        HIGHLIGHTED_TARGET.element.classList.remove("highlighted");
    }

    // Highlight the new target
    closest.element.classList.add("highlighted");

    // Save the whole object + ID for later use
    HIGHLIGHTED_TARGET = { id: closestId, ...closest };

    // Optional accessibility guide curve
    const path = document.getElementById("pull-curve");

    if (HIGHLIGHTED_TARGET) {
        const targetRect = HIGHLIGHTED_TARGET.element.getBoundingClientRect();
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

    // Reset all data for each trial
    ITEM_SET.clear() ;
    TARGET_SET.clear();
    SELECTION_SET.clear();
    DESELECTION_SET.clear();

    const targetCount = Math.floor(Math.random() * 4) + 3; // Random between 3-6
    const totalItemCount = Math.floor(Math.random() * 6) + 10; // Random between 10-15

    let attempts = 0;
    const minRadius = 20;
    const maxRadius = 35;

    let id = 0;
    while (ITEM_SET.size < totalItemCount && attempts < 10000) {
        const radius = Math.random() * (maxRadius - minRadius) + minRadius;
        const x = Math.random() * ((bounds.width - 20) - radius * 2);
        const y = Math.random() * ((bounds.height - 20) - radius * 2);
        const centerX = x + radius;
        const centerY = y + radius;

        // Check for overlap with existing targets
        const overlaps = Array.from(ITEM_SET.values()).some(t => {
            const dx = t.x - centerX;
            const dy = t.y - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance < radius * 2 + 5;
        });

        // Add non overlapping item
        if (!overlaps) {
            const target = document.createElement("div");
            target.className = "random-target";
            target.style.left = `${x}px`;
            target.style.top = `${y}px`;
            target.style.width = `${radius * 2}px`;
            target.style.height = `${radius * 2}px`;

            // Add this item to target set
            if (TARGET_SET.size < targetCount) {
                target.style.backgroundColor = "limegreen";
                TARGET_SET.set(id, { element: target, x: centerX, y: centerY, radius });
            }

            // Add item to main set
            ITEM_SET.set(id, { element: target, x: centerX, y: centerY, radius });
            container.appendChild(target);
        }

        // Update attempts and id values
        id++;
        attempts++;
    }

    if (attempts >= 10000) {
        console.error("Could not place all targets WITHOUT overlap!");
    } else if (TARGET_SET.size !== targetCount || ITEM_SET.size !== totalItemCount) {
        console.error("Could not append required number of targets or items!");
    } else {
        return { targetCount, totalItemCount }
    }
}


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
            const deselectRatio = trial.totalSelections > 0
                ? ((trial.deselectedTargets + trial.deselectedNonTargets) / trial.totalSelections * 100).toFixed(1) + "%"
                : "—";
            const targetDeselectRatio = trial.correctSelections > 0
                ? (trial.deselectedTargets / trial.correctSelections * 100).toFixed(1) + "%"
                : "—";
            const accuracy = trial.targetCount > 0
                ? ((trial.correctSelections / trial.targetCount) * 100).toFixed(1) + "%"
                : "—";

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
                <td>${Math.round(trial.totalCursorDistance)}</td>
                <td>${deselectRatio}</td>
                <td>${targetDeselectRatio}</td>
                <td>${accuracy}</td>
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