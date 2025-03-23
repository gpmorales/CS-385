// Global vars and constants
let TARGET_COUNT = Math.floor(Math.random() * 4) + 3; // Random between 3-6
let TOTAL_ITEM_COUNT = Math.floor(Math.random() * 6) + 10; // Random between 10-15
const SELECTION_DELAY = 100; // time in ms user must hover over target in order to select it
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


// **************************** Training Page Event Listener ****************************
document.addEventListener("DOMContentLoaded", () => {
    // Create custom brush, trail logic, and more
    if (document.title === "Training") {
        // Use an SVG element to create trail
        const svg = document.getElementById("cursor-trail-svg");

        // Points keep track of where the mouse has hovered over
        let path = null;
        let points = [];

        // Keep track of targets we have hovered over
        let hoveredRects = new Set(); // Track currently hovered rectangles
        let confirmedRects = new Set(); // Track finalized selections

        // Create custom cursor
        const cursor = document.createElement("div");
        cursor.id = "custom-cursor";
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
            cursor.style.left = `${e.clientX}px`;
            cursor.style.top = `${e.clientY}px`;

            if (isMouseDown) {
                points.push(`${e.clientX},${e.clientY}`);
                path.setAttribute("d", `M ${points.join(" L ")}`); // Draw smooth line
            }

            document.querySelectorAll(".random-rectangle").forEach(rect => {
                const rectBounds = rect.getBoundingClientRect();

                // If the cursor is in the rectangle bounds
                if (e.clientX >= rectBounds.left && e.clientX <= rectBounds.right &&
                    e.clientY >= rectBounds.top && e.clientY <= rectBounds.bottom
                ) {
                    // Ensure we haven't already hovered over this rectangle
                    if (!hoveredRects.has(rect)) {
                        hoveredRects.add(rect);

                        // Ensure cursor is inside rectangle for some delay time
                        setTimeout(() => {
                            const currentMouseX = parseInt(cursor.style.left);
                            const currentMouseY = parseInt(cursor.style.top);
                            const stillInside = (currentMouseX >= rectBounds.left && currentMouseX <= rectBounds.right &&
                                currentMouseY >= rectBounds.top && currentMouseY <= rectBounds.bottom
                            );

                            // Only if we have now hovered over the rectangle for some time, the custom cursor is active and our mouse is pressed down
                            if (hoveredRects.has(rect) && stillInside && isCustomCursorActive && isMouseDown) {
                                confirmedRects.add(rect);
                                rect.classList.add("highlighted");
                                // Also selected nearby rectangles
                                const nearbyRects = getNearbyRects(rect);
                                nearbyRects.forEach(nearbyRect => {
                                    // Only add nearby rects that are not in the set
                                    if (!confirmedRects.has(nearbyRect)) {
                                        confirmedRects.add(nearbyRect);
                                        nearbyRect.classList.add("highlighted");
                                    }
                                });
                            } else {
                                hoveredRects.delete(rect);
                            }
                        }, SELECTION_DELAY);
                    }
                } else {
                    hoveredRects.delete(rect);
                }
            });
        });

        // Draw trail path
        document.addEventListener("mousedown", (e) => {
            if (e.button === 0 && isCustomCursorActive) {
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

        // Right-click to deselect a highlighted item if custom cursor is active
        document.addEventListener("contextmenu", (e) => {
            if (isCustomCursorActive) {
                e.preventDefault(); // Prevent default right-click menu
                const rect = document.elementFromPoint(e.clientX, e.clientY);
                if (rect && rect.classList.contains("random-rectangle")) {
                    if (confirmedRects.has(rect)) {
                        rect.classList.remove("highlighted"); // Remove highlight
                        confirmedRects.delete(rect); // Properly remove from confirmed selections
                    }
                }
            }
        });

        // Fade trail after we move mouse up and there was a non-empty path
        document.addEventListener("mouseup", () => {
            if (path) {
                path.style.transition = "opacity 0.5s ease-out";
                path.style.opacity = "0";
                setTimeout(() => path.remove(), 500);
            }
            isMouseDown = false;
            hoveredRects.clear();
        });

        // Prevent unwanted deselection when the brush is inactive
        document.addEventListener("mouseleave", () => {
            hoveredRects.clear();
        });
    }
});


// **************************** Testing Page Event Listener ****************************
document.addEventListener("DOMContentLoaded", () => {
    // Create custom brush, trail logic, and more
    if (document.title === "Testing") {
        // Begin trial
        let currentTrial = new TrialData(trialData.length + 1, TARGET_COUNT, TOTAL_ITEM_COUNT);

        // Use an SVG element to create trail
        const svg = document.getElementById("cursor-trail-svg");

        // Points keep track of where the mouse has hovered over
        let path = null;
        let points = [];

        // Keep track of targets we have hovered over
        let hoveredRects = new Set(); // Track currently hovered rectangles
        let confirmedRects = new Set(); // Track finalized selections

        // Create custom cursor
        const cursor = document.createElement("div");
        cursor.id = "custom-cursor";
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
            cursor.style.left = `${e.clientX}px`;
            cursor.style.top = `${e.clientY}px`;

            if (isMouseDown) {
                points.push(`${e.clientX},${e.clientY}`);
                path.setAttribute("d", `M ${points.join(" L ")}`); // Draw smooth line
            }

            document.querySelectorAll(".random-rectangle").forEach(rect => {
                const rectBounds = rect.getBoundingClientRect();

                // If the cursor is in the rectangle bounds
                if (e.clientX >= rectBounds.left && e.clientX <= rectBounds.right &&
                    e.clientY >= rectBounds.top && e.clientY <= rectBounds.bottom
                ) {
                    // Ensure we haven't already hovered over this rectangle
                    if (!hoveredRects.has(rect)) {
                        hoveredRects.add(rect);

                        // Ensure cursor is inside rectangle for some delay time
                        setTimeout(() => {
                            const currentMouseX = parseInt(cursor.style.left);
                            const currentMouseY = parseInt(cursor.style.top);
                            const stillInside = (currentMouseX >= rectBounds.left && currentMouseX <= rectBounds.right &&
                                currentMouseY >= rectBounds.top && currentMouseY <= rectBounds.bottom
                            );

                            // Only if we have now hovered over the rectangle for some time, the custom cursor is active and our mouse is pressed down
                            if (hoveredRects.has(rect) && stillInside && isCustomCursorActive && isMouseDown) {
                                confirmedRects.add(rect);
                                rect.classList.add("highlighted");
                                currentTrial.totalSelections++;

                                // Check if rectangle was a target
                                if (rect.style.backgroundColor === "yellow") {
                                    currentTrial.correctSelections++; // Correct required target selection
                                } else {
                                    currentTrial.incorrectSelections++; // Incorrect/unnecessary selection
                                }

                                // Also selected nearby rectangles
                                const nearbyRects = getNearbyRects(rect);
                                nearbyRects.forEach(nearbyRect => {
                                    // Only add nearby rects that are not in the set
                                    if (!confirmedRects.has(nearbyRect)) {
                                        confirmedRects.add(nearbyRect);
                                        nearbyRect.classList.add("highlighted");
                                        if (nearbyRect.style.backgroundColor === "yellow") {
                                            currentTrial.correctSelections++; // Correct selection
                                        } else {
                                            currentTrial.incorrectSelections++; // Incorrect selection
                                        }
                                    }
                                });
                            } else {
                                hoveredRects.delete(rect);
                            }
                        }, SELECTION_DELAY);
                    }
                } else {
                    hoveredRects.delete(rect);
                }
            });
        });

        // Draw trail path
        document.addEventListener("mousedown", (e) => {
            if (e.button === 0 && isCustomCursorActive) {
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

        // Fade trail after we move mouse up and there was a non-empty path
        document.addEventListener("mouseup", () => {
            if (path) {
                path.style.transition = "opacity 0.5s ease-out";
                path.style.opacity = "0";
                setTimeout(() => path.remove(), 500);
            }
            isMouseDown = false;
            hoveredRects.clear();
        });

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
            generateRandomRectangles("demo-area", { width: 1200, height: 600 });

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

        // Right-click to deselect a highlighted item if custom cursor is active
        document.addEventListener("contextmenu", (e) => {
            if (isCustomCursorActive) {
                e.preventDefault(); // Prevent default right-click menu
                const rect = document.elementFromPoint(e.clientX, e.clientY);
                if (rect && rect.classList.contains("random-rectangle")) {
                    currentTrial.totalSelections--; // Remove selection
                    if (confirmedRects.has(rect)) {
                        rect.classList.remove("highlighted"); // Remove highlight
                        confirmedRects.delete(rect); // Properly remove from confirmed selections
                        currentTrial.deselectedTargets++; // update right click (deselection)
                    } else {
                        currentTrial.deselectedNonTargets++; // update right click (deselection)
                    }
                }
            }
        });

        // Prevent unwanted deselection when the brush is inactive
        document.addEventListener("mouseleave", () => {
            hoveredRects.clear();
        });
    }
});


// Generate Random targets
function generateRandomRectangles(containerId, bounds) {
    const container = document.getElementById(containerId);

    // Clear existing random targets first
    const rectangles = container.querySelectorAll('.random-rectangle');
    rectangles.forEach(rectangle => rectangle.remove());

    for (let i = 0; i < TOTAL_ITEM_COUNT; i++) {
        // Generate random position within bounds
        const rect = document.createElement("div");
        rect.className = "random-rectangle";
        const x = Math.random() * (bounds.width - 50); // 50 is the rectangle width
        const y = Math.random() * (bounds.height - 50); // 50 is the rectangle height
        rect.style.left = `${x}px`;
        rect.style.top = `${y}px`;
        if (i < TARGET_COUNT) rect.style.backgroundColor = "yellow"; // 3-5 required
        container.appendChild(rect);
    }
}

// Call function with 5 rectangles inside a container with id "demo-area"
document.addEventListener("DOMContentLoaded", () => {
    if (document.title === "Testing") {
        generateRandomRectangles("demo-area", { width: 1200, height: 600 });
    }
    if (document.title === "Training") {
        generateRandomRectangles("demo-area", { width: 800, height: 500 });
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
function getNearbyRects(rect, threshold = 50) {
    const rectBounds = rect.getBoundingClientRect();
    return Array.from(document.querySelectorAll(".random-rectangle")).filter(otherRect => {
        if (rect === otherRect) return false; // Skip itself
        const otherBounds = otherRect.getBoundingClientRect();
        return (
            Math.abs(rectBounds.left - otherBounds.left) < threshold &&
            Math.abs(rectBounds.top - otherBounds.top) < threshold
        );
    });
}
