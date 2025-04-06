// Global Variables and Constants
let TARGET_COUNT = Math.floor(Math.random() * 4) + 3;           // Random between 3-6
let TOTAL_ITEM_COUNT = Math.floor(Math.random() * 6) + 10;      // Random between 10-15
const TRIAL_COUNT = 15;                                            // Number of total trials

// Data collection for each trial
let trialData = [];

class TrialData {
    constructor(trialNumber, targetCount, totalItemCount) {
        this.trialNumber = trialNumber; // Trial number
        this.totalItemCount = totalItemCount; // Total selectable items (targets + distractors)
        this.targetCount = targetCount; // Number of required targets
        this.startTime = performance.now(); // Trial start time
        this.endTime = null; // Trial end time
        this.timeTaken = null; // Total duration of the trial
        this.totalSelections = 0; // Total number of selected items
        this.correctSelections = 0; // Number of correctly selected required targets
        this.incorrectSelections = 0; // Number of incorrectly selected non-targets
        this.deselectedTargets = 0; // Number of required targets that were deselected
        this.deselectedNonTargets = 0; // Number of non-targets that were deselected
    }

    endTrial() {
        this.endTime = performance.now();
        this.timeTaken = (this.endTime - this.startTime) / 1000; // Convert to seconds
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
                }
            }
        });

        // Update the trail and target selection
        document.addEventListener("mousemove", (e) => {
            const x = e.clientX;
            const y = e.clientY;

            cursor.style.left = `${e.clientX}px`;
            cursor.style.top = `${e.clientY}px`;

            const radius = getDistanceToNearestTarget(x, y);
            bubbleRing.style.width = `${radius * 2}px`;
            bubbleRing.style.height = `${radius * 2}px`;

            document.querySelectorAll(".random-target").forEach(rect => {
            });
        });

        // Draw trail path
        document.addEventListener("mousedown", (e) => {
            if (e.button === 0 && isCustomCursorActive) {
            }
        });

        // Right-click to deselect a selected item if the custom cursor is still active
        document.addEventListener("contextmenu", (e) => {
            if (isCustomCursorActive) {
                e.preventDefault(); // Prevent default right-click menu
                const target = document.elementFromPoint(e.clientX, e.clientY);
                if (target && target.classList.contains("random-target")) {
                    if (confirmedSelections.has(target)) {
                        target.classList.remove("highlighted"); // Remove highlight
                        confirmedSelections.delete(target); // Properly remove from confirmed selections
                    }
                }
            }
        });


        // Prevent unwanted deselection when the brush is inactive
        document.addEventListener("mouseleave", () => {
        });

    }
});


// **************************** Testing Page Event Listener ****************************
document.addEventListener("DOMContentLoaded", () => {
    // Create custom brush, trail logic, and more
    if (document.title === "Testing") {
        // Begin trial
        let currentTrial = new TrialData(trialData.length + 1, TARGET_COUNT, TOTAL_ITEM_COUNT);

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


        // Prevent unwanted deselection when the brush is inactive
        document.addEventListener("mouseleave", () => {
        });
    }
});


// Generate Random targets
function generateRandomTargets(containerId, bounds) {
    const container = document.getElementById(containerId);

    // Clear existing random targets first
    const targets = container.querySelectorAll('.random-target');
    targets.forEach(target => target.remove());

    for (let i = 0; i < TOTAL_ITEM_COUNT; i++) {
        // Generate random position within bounds
        const target = document.createElement("div");
        target.className = "random-target";
        const x = Math.random() * (bounds.width - 50); // 50 is the rectangle width
        const y = Math.random() * (bounds.height - 50); // 50 is the rectangle height
        target.style.left = `${x}px`;
        target.style.top = `${y}px`;
        if (i < TARGET_COUNT) target.style.backgroundColor = "yellow"; // 3-5 required
        container.appendChild(target);
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


// Utility functions:
function getDistanceToNearestTarget(cursorX, cursorY) {
    // TODO: Replace with real distance to nearest target
    return Math.random() * 100 + 30; // temp: 30–130 px
}