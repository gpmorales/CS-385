// Global vars and constants
const SELECTION_DELAY = 175;    // time in ms user must hover over target in order to select it
const RESELECT_COOLDOWN = 150;  // milliseconds
const TRAIL_THROTTLE = 15;      // milliseconds
const TRIAL_COUNT = 15;         // number of total trials

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
    this.characterErrorRate = 0; // % of incorrect characters using edit distance
    this.accuracy = 0;  // adjusted accuracy calculated using edit distance
    this.wordsPerMinute = 0; // Text entry speed (WPM)
    this.backspaceCount = 0; // Number of backspace actions
  }

  endTrial() {
    this.endTime = performance.now();
    this.timeTaken = (this.endTime - this.startTime) / 1000; // Convert to seconds
  }
}


// **************************** Swipe Keyboard Event Listener ****************************
document.addEventListener("DOMContentLoaded", () => {
  // Create custom brush, trail logic, and more
  if (document.title === "SwipeTraining" || document.title === "SwipeTesting") {
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
        const isHovered = e.clientX >= bounds.left && e.clientX <= bounds.right && e.clientY >= bounds.top && e.clientY <= bounds.bottom;

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
            if (stillInside && isMouseDown && (now - lastSelect) > RESELECT_COOLDOWN) {
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
      if (e.button === 2 && (document.title === "SwipeTesting" || document.title === "SwipeTraining")) {
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
          if (!isMouseDown) return;

          document.querySelectorAll(".hg-button").forEach((button) => {
            const bounds = button.getBoundingClientRect();
            const isInside =
                cursorX >= bounds.left &&
                cursorX <= bounds.right &&
                cursorY >= bounds.top &&
                cursorY <= bounds.bottom;

            if (isInside) {
              const now = performance.now();
              const lastSelect = keySelectTimestamps.get(button) || 0;

              if (now - lastSelect > RESELECT_COOLDOWN) {
                keySelectTimestamps.set(button, now); // Update timestamp

                const key = button.innerText.trim();
                const outputBox = document.getElementById("text-output");

                if (key === "" || key === "␣" || key.toLowerCase() === "space") {
                  outputBox.value += " ";
                } else if (key.length === 1) {
                  outputBox.value += key;
                  currentSwipeWord += key;
                  currentTrial.totalKeystrokes++;
                }

                button.classList.add("selected-confirmed");
                setTimeout(() => {
                  button.classList.remove("selected-confirmed");
                  button.classList.remove("selected");
                }, 250);
              }
            }
          });
        }, 100);

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
        <td>${trial.characterErrorRate.toFixed(1)}%</td>
        <td>${trial.accuracy.toFixed(2)}%</td>
        <td>${trial.wordsPerMinute.toFixed(1)}</td>
        <td>${trial.backspaceCount}</td>
        <td>${trial.timeTaken.toFixed(2)}s</td>
      `;
      tableBody.appendChild(row);
    });

    // Convert trialData array to CSV string/blob
    document.getElementById("downloadCSV").addEventListener("click", () => {
      // Convert array to CSV string
      const headers =
          "Trial #,Prompt,User Input,Start Time, End Time,Time Taken (s),Total Keystrokes,Character Error Rate [Edit Distance] (%),Accuracy [Edit Distance] (%),WPM,Backspaces";
      const rows = trialData.map((trial) => Object.values(trial).join(","));
      const csv = [headers, ...rows].join("\n");

      // Create and download CSV file
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "/trial.csv";
      a.click();
    });
  }
});


// **************************** Utility Functions ****************************
function getNextPhrase() {
  const phraseDisplay = document.getElementById("phrase-display");
  const inputBox = document.getElementById("text-output");

  // Save the current trial
  if (currentTrial && trialNumber > 0) {
    currentTrial.endTrial();
    currentTrial.userInput = inputBox.value.slice(0, -1); // Remove auto-added space at the end

    const expected = currentTrial.promptPhrase;
    const actual = currentTrial.userInput;

    // Edit distance is the number of chars that need to be deleted, added, or substituted to make 2 strings match
    const distance = getEditDistance(actual, expected);

    // Calculate Metrics:
    currentTrial.characterErrorRate = (distance / Math.max(expected.length, 1)) * 100;
    currentTrial.wordsPerMinute = actual.length === 0 ? 0 : (actual.length / 5 / currentTrial.timeTaken) * 60;
    currentTrial.accuracy = ((expected.length - distance) / expected.length) * 100;

    // Push trial to global list
    trialData.push(currentTrial);
  }

  // Check if testing complete
  if ((document.title === "QwertyTesting" || document.title === "SwipeTesting") && trialNumber === TRIAL_COUNT) {
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

function getEditDistance(a, b) {
  //a = a.replace(/\s+/g, '');
  //b = b.replace(/\s+/g, '');

  const dp = Array.from({ length: a.length + 1 }, () =>
      Array(b.length + 1).fill(0)
  );

  // For the base case of an empty str and a String, the edit distance will always be the len(String)
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i - 1][j - 1], dp[i][j - 1]);
      }
    }
  }

  return dp[a.length][b.length];
}


// **************************** Misc Listeners ****************************
document.addEventListener("DOMContentLoaded", () => {
  if (document.title === "QwertyTesting" || document.title === "SwipeTesting" || document.title === "QwertyTraining" || document.title === "SwipeTraining") {
    if (document.title === "QwertyTesting" || document.title === "SwipeTesting") {
      trialNumber = 0;
      trialData.length = 0; // Clear training data
    }
    getNextPhrase();
  }
});

document.addEventListener("contextmenu", (e) => {
  if (document.title === "SwipeTraining" || document.title === "SwipeTesting") {
    e.preventDefault();
  }
});

document.addEventListener("keydown", (e) => {
  if (document.title === "QwertyTesting") {
    if (e.key === "Backspace") {
      currentTrial.backspaceCount++;
    }
    currentTrial.totalKeystrokes++;
  }
});

window.addEventListener("load", () => {
  if (document.title === "SwipeTraining" || document.title === "SwipeTesting") {
    return new SimpleKeyboard.default();
  }
});
