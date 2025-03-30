// Global vars and constants
const SELECTION_DELAY = 175;    // time in ms user must hover over target in order to select it
const RESELECT_COOLDOWN = 150;  // milliseconds
const TRAIL_THROTTLE = 15;      // milliseconds
const TRIAL_COUNT = 5;         // number of total trials

// Data collection for each trial
let currentTrial = null;
let currentRandomPhrase = "";
let trialNumber = 1;
const trialData = [];

class TrialData {
  constructor(trialNumber, promptPhrase) {
    this.trialNumber = trialNumber; // Trial index
    this.promptPhrase = promptPhrase; // The phrase the user is asked to enter
    this.userInput = ""; // The phrase entered by the user
    this.startTime = performance.now(); // When the trial began
    this.endTime = null; // When the trial ended
    this.timeTaken = null; // Duration of the trial (ms)
    this.totalKeystrokes = 0; // Total keys selected
    this.correctCharacters = 0; // Correctly matched characters
    this.incorrectCharacters = 0; // Incorrect characters
    this.characterErrorRate = 0; // % of incorrect characters
    this.wordsPerMinute = 0; // Text entry speed (WPM)
    this.backspaceCount = 0; // Number of backspace actions
  }

  endTrial() {
    this.endTime = performance.now();
    this.timeTaken = (this.endTime - this.startTime) / 1000; // Convert to seconds
  }
}

window.addEventListener("load", () => {
  if (document.title === "Training" || document.title === "Testing") {
    const keyboard = new SimpleKeyboard.default();
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
    let isMouseDown = false;

    // Set up key storage
    const hoveredKeys = new Set();
    const keySelectTimestamps = new Map(); // Map<HTMLElement, timestamp>

    let trailFadeTimeout = null; // Timeout for fading out the trail
    let lastTrailDraw = 0; // Last time the trail was drawn
    let currentSwipeWord = ""; // Auto space word

    document.addEventListener("mousemove", (e) => {
      hasMovedSinceMouseDown = true;
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;

      const now = performance.now();
      if (now - lastTrailDraw > TRAIL_THROTTLE) {
        lastTrailDraw = now;
        if (isMouseDown && path) {
          points.push(`${e.clientX},${e.clientY}`);
          path.setAttribute("d", `M ${points.join(" L ")}`);
        }
      }

      // Add event listener for each button
      document.querySelectorAll(".hg-button").forEach((button) => {
        const bounds = button.getBoundingClientRect();
        const isHovered =
          e.clientX >= bounds.left &&
          e.clientX <= bounds.right &&
          e.clientY >= bounds.top &&
          e.clientY <= bounds.bottom;

        // On hover
        if (isHovered && !hoveredKeys.has(button)) {
          hoveredKeys.add(button);
          button.classList.add("hovered");

          // Allow for reselection
          setTimeout(() => {
            const stillInside =
              parseInt(cursor.style.left) >= bounds.left &&
              parseInt(cursor.style.left) <= bounds.right &&
              parseInt(cursor.style.top) >= bounds.top &&
              parseInt(cursor.style.top) <= bounds.bottom;

            const lastSelect = keySelectTimestamps.get(button) || 0;
            const now = performance.now();

            // If we are still inside after hovering, and the cool down hsa passed down then and only then select this key
            if (
              stillInside &&
              isMouseDown &&
              now - lastSelect > RESELECT_COOLDOWN
            ) {
              keySelectTimestamps.set(button, now);
              button.classList.add("selected-confirmed");

              setTimeout(() => {
                button.classList.remove("selected-confirmed");
              }, 250); // Duration matches your CSS transition

              const key = button.innerText;
              const outputBox = document.getElementById("text-output");

              // Handle space
              const normalizedKey = key.trim();
              if (
                normalizedKey === "" ||
                key === "␣" ||
                key.toLowerCase() === "space"
              ) {
                outputBox.value += " ";
              } else if (normalizedKey.length === 1) {
                outputBox.value += normalizedKey;
                currentSwipeWord += normalizedKey;
                currentTrial.totalKeystrokes++;
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
      });
    });

    // Draw trail path
    document.addEventListener("mousedown", (e) => {
      if (e.button === 2) {
        const outputBox = document.getElementById("text-output");
        outputBox.value = outputBox.value.slice(0, -1);
        currentTrial.backspaceCount++;
      } else if (e.button === 0) {
        points = []; // Reset points
        isMouseDown = true;

        path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("fill", "none");
        path.setAttribute("stroke", "rgba(29, 102, 197, 0.8)"); // Smooth neon effect
        path.setAttribute("stroke-width", "6");
        path.setAttribute("stroke-linecap", "round");
        path.setAttribute("stroke-linejoin", "round");
        path.setAttribute("filter", "url(#blur-filter)"); // Add glow effect
        svg.appendChild(path);

        // Initial key detection (after delay)
        const cursorX = e.clientX;
        const cursorY = e.clientY;
        setTimeout(() => {
          if (!isMouseDown) return; // Ignore if mouse released

          document.querySelectorAll(".hg-button").forEach((button) => {
            const bounds = button.getBoundingClientRect();
            const isInside =
              cursorX >= bounds.left &&
              cursorX <= bounds.right &&
              cursorY >= bounds.top &&
              cursorY <= bounds.bottom;

            if (isInside) {
              const key = button.innerText.trim();
              const outputBox = document.getElementById("text-output");

              // Handle input
              if (key === "" || key === "␣" || key.toLowerCase() === "space") {
                outputBox.value += " ";
              } else if (key.length === 1) {
                outputBox.value += key;
                currentSwipeWord += key;
              }

              // Quick flash instead of .hovered
              button.classList.add("selected-confirmed");
              setTimeout(() => {
                button.classList.remove("selected-confirmed");
                button.classList.remove("selected");
              }, 250);
            }
          });
        }, 100); // 100ms dela
      }
    });

    document.addEventListener("mouseup", () => {
      hoveredKeys.clear();
      keySelectTimestamps.clear();
      isMouseDown = false;

      if (currentSwipeWord) {
        const outputBox = document.getElementById("text-output");
        outputBox.value += " ";
        currentSwipeWord = "";
      }

      if (trailFadeTimeout) clearTimeout(trailFadeTimeout);

      if (path) {
        trailFadeTimeout = setTimeout(() => {
          path.style.transition = "opacity 0.5s ease-out";
          path.style.opacity = "0";
          setTimeout(() => path.remove(), 500);
        }, 150); // Delay a bit after release
      }
    });
  }
});


// **************************** Summary Page Event Listener ****************************
document.addEventListener("DOMContentLoaded", () => {
  if (document.title === "Summary") {
    const tableBody = document.getElementById("resultsTable");
    let trialData;
    try {
      trialData = JSON.parse(localStorage.getItem("trialData") || "[]");
    } catch (error) {
      console.error("Failed to load trial data:", error);
      return;
    }

    trialData.forEach((trial) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${trial.trialNumber}</td>
        <td>${trial.promptPhrase}</td>
        <td>${trial.userInput}</td>
        <td>${trial.totalKeystrokes}</td>
        <td>${trial.correctCharacters}</td>
        <td>${trial.incorrectCharacters}</td>
        <td>${trial.characterErrorRate.toFixed(1)}%</td>
        <td>${trial.wordsPerMinute.toFixed(1)}</td>
        <td>${trial.backspaceCount}</td>
        <td>${trial.timeTaken.toFixed(2)}s</td>
      `;
      tableBody.appendChild(row);
    });

    // Convert trialData array to CSV string/blob
    document.getElementById("downloadCSV").addEventListener("click", () => {
      // Convert array to CSV string
      const headers = Object.keys(trialData[0]).join(",");
      const rows = trialData.map((trial) => Object.values(trial).join(","));
      const csv = [headers, ...rows].join("\n");

      // Create and download CSV file
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "trial_data.csv";
      a.click();
    });
  }
});


// Utility functions
function getNextPhrase() {
  const phraseDisplay = document.getElementById("phrase-display");
  const inputBox = document.getElementById("text-output");

  // Save the current trial
  if (currentTrial && trialNumber > 0) {
    currentTrial.endTrial();
    currentTrial.userInput = inputBox.value;

    const expected = currentTrial.promptPhrase;
    const actual = currentTrial.userInput;

    let correct = 0,
      incorrect = 0;
    for (let i = 0; i < actual.length; i++) {
      if (actual[i] === expected[i]) correct++;
      else incorrect++;
    }

    currentTrial.correctCharacters = correct;
    currentTrial.incorrectCharacters = incorrect;
    currentTrial.characterErrorRate = (incorrect / Math.max(actual.length, 1)) * 100;
    currentTrial.wordsPerMinute = actual.length === 0 ? 0 : (actual.length / 5 / currentTrial.timeTaken) * 60;

    trialData.push(currentTrial);
  }

  // Check if testing complete
  if (document.title === "Testing" && trialNumber === TRIAL_COUNT) {
    console.log(trialData)
    localStorage.setItem("trialData", JSON.stringify(trialData));
    location.href = "summary.html";
    return;
  }

  // Prepare for next trial
  currentRandomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
  phraseDisplay.textContent = currentRandomPhrase;
  inputBox.value = "";

  currentTrial = new TrialData(++trialNumber, currentRandomPhrase);
}

// Misc Listeners
document.addEventListener("DOMContentLoaded", () => {
  if (document.title === "Training" || document.title === "Testing") {
    if (document.title === "Testing") {
      trialNumber = 0;
      trialData.length = 0; // Clear training data
    }
    getNextPhrase();
  }
});

document.addEventListener("contextmenu", (e) => {
  e.preventDefault();
});
