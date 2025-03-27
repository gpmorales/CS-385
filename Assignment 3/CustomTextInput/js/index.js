// Global vars and constants
const SELECTION_DELAY = 200; // time in ms user must hover over target in order to select it
const RESELECT_COOLDOWN = 400; // milliseconds

const TRIAL_COUNT = 12; // number of total trials
let isMouseDown = false;

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

window.addEventListener("load", () => {
    if (document.title === "Training") {
        const keyboard = new SimpleKeyboard.default({
            onChange: input => console.log("Input changed", input),
            onKeyPress: button => console.log("Key pressed", button),
        });
    }
});



// **************************** Keyboard Event Listener ****************************
document.addEventListener("DOMContentLoaded", () => {
    // Create custom brush, trail logic, and more
    if (document.title === "Training" || document.title === "Testing") {
        // Use an SVG element to create trail
        const svg = document.getElementById("cursor-trail-svg");

        // Points keep track of where the mouse has hovered over
        let path = null;
        let points = [];

        // Get cursor
        const cursor = document.createElement("div");

        let trailFadeTimeout;
        const hoveredKeys = new Set();
        const keySelectTimestamps = new Map(); // Map<HTMLElement, timestamp>
        const RESELECT_COOLDOWN = 400; // ms

        document.addEventListener("mousemove", (e) => {
            cursor.style.left = `${e.clientX}px`;
            cursor.style.top = `${e.clientY}px`;

            if (isMouseDown) {
                points.push(`${e.clientX},${e.clientY}`);
                path.setAttribute("d", `M ${points.join(" L ")}`);
            }

            // Add event listener for each button
            document.querySelectorAll(".hg-button").forEach(button => {
                const bounds = button.getBoundingClientRect();
                const isHovered = (
                    e.clientX >= bounds.left &&
                    e.clientX <= bounds.right &&
                    e.clientY >= bounds.top &&
                    e.clientY <= bounds.bottom
                );

                // On hover
                if (isHovered && !hoveredKeys.has(button)) {
                    hoveredKeys.add(button);
                    button.classList.add("hovered");

                    // Allow for reselection
                    setTimeout(() => {
                        const stillInside = (
                            parseInt(cursor.style.left) >= bounds.left &&
                            parseInt(cursor.style.left) <= bounds.right &&
                            parseInt(cursor.style.top) >= bounds.top &&
                            parseInt(cursor.style.top) <= bounds.bottom
                        );

                        const lastSelect = keySelectTimestamps.get(button) || 0;
                        const now = performance.now();

                        // If we are still inside after hovering, and the cool down hsa passed down then and only then select this key
                        if (stillInside && isMouseDown && now - lastSelect > RESELECT_COOLDOWN) {
                            keySelectTimestamps.set(button, now);
                            button.classList.add("selected-confirmed");

                            setTimeout(() => {
                                button.classList.remove("selected-confirmed");
                            }, 250); // Duration matches your CSS transition

                            const key = button.innerText;
                            const outputBox = document.getElementById("text-output");

                            // Handle space
                            const normalizedKey = key.trim();
                            if (normalizedKey === "" || key === "␣" || key.toLowerCase() === "space") {
                                outputBox.value += " ";
                            } else if (normalizedKey.length === 1) {
                                outputBox.value += normalizedKey;
                            }
                        }

                        if (!stillInside) {
                            hoveredKeys.delete(button);
                            button.classList.remove("hovered");
                        }
                    }, SELECTION_DELAY);
                }

                // Otherwise remove button form hovered keys
                if (!isHovered && hoveredKeys.has(button)) {
                    hoveredKeys.delete(button);
                    button.classList.remove("hovered");
                }

                // Reset the fade timeout on each move
                if (trailFadeTimeout) clearTimeout(trailFadeTimeout);

                trailFadeTimeout = setTimeout(() => {
                    if (path && isMouseDown) {
                        path.style.transition = "opacity 0.5s ease-out";
                        path.style.opacity = "0";
                        setTimeout(() => path.remove(), 500);
                    }
                }, 350);
            });
        });

        document.addEventListener("mouseup", () => {
            hoveredKeys.clear();
            keySelectTimestamps.clear(); // allow keys to be selected again in the next drag
        });

        // Draw trail path
        document.addEventListener("mousedown", (e) => {
            if (e.button === 0) {
                points = []; // Reset points
                isMouseDown = true;
                path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                path.setAttribute("fill", "none");
                path.setAttribute("stroke", "rgba(29, 102, 197, 0.8)"); // Smooth neon effect
                path.setAttribute("stroke-width", "8");
                path.setAttribute("stroke-linecap", "round");
                path.setAttribute("stroke-linejoin", "round");
                path.setAttribute("filter", "url(#blur-filter)"); // Add glow effect
                svg.appendChild(path);
            }
        });
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
            const blob = new Blob([csv], {type: 'text/csv'});
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'trial_data.csv';
            a.click();
        });
    }
});
