console.log("Script loaded!");

let loadLocation = "0-0";
let copiesLeft = 5;
let moveScore = 0;
let intialNumbers = [];
let hintsList = [];
let hintsUsed = 0;
const maxHints = 5;
let currentHintIndex = 0;
let currentHint = null; 

// Function (Reusable) for loadLocation logic
function parseAndUpdateLoadLocation() {
    const locations = loadLocation.split("-");
    let row = parseInt(locations[0]);
    let col = parseInt(locations[1]);

    const currentRow = row;
    const currentCol = col;

    if (col === 8) {
        col = 0;
        row++;
    } else {
        col++;
    }

    const newLoadLocation = row + "-" + col;
    return { currentRow, currentCol, newLoadLocation };
}

// Function to generate random numbers
function generateRandomNumbers(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Function to populate the table with random numbers
function populateTableWithRandomNumbers(tableID, min, max) {
    let tableRef = document.getElementById(tableID);
    let cellCount = 0;

    // global loadLocation variable
    loadLocation = "0-0"; // Reset to the starting cell

    for (let row = 0; row < tableRef.rows.length; row++) {
        for (let col = 0; col < tableRef.rows[row].cells.length; col++) {
            if (cellCount >= 26) {
                console.log("Final loadLocation after populating table:", loadLocation);
                return;
            }

            // Parse and update loadLocation
            const { currentRow, currentCol, newLoadLocation } = parseAndUpdateLoadLocation(loadLocation);

            // Get the current cell
            let cell = tableRef.rows[currentRow].cells[currentCol];

            cell.innerHTML = generateRandomNumbers(1, 9);
            cellCount++;

            loadLocation = newLoadLocation;

            console.log(`Populated cell ${currentRow}-${currentCol}. Next loadLocation: ${loadLocation}`);
        }
    }

    console.log("Final loadLocation after populating table:", loadLocation);
}

// Function to initialize the game
function newGameLoading() {
    // Reset variables
    loadLocation = "0-0";
    copiesLeft = 5;
    moveScore = 0;
    hintsList = [];
    currentHintIndex = 0;
    hintsUsed = 0;

    const table = document.getElementById("new-table");
    table.innerHTML = ""; 

    // Recreate the table
    createTable("new-table");

    document.getElementById("copiesLeft").innerHTML = "Copies Left: " + copiesLeft;
    document.getElementById("score").innerHTML = moveScore;
    document.getElementById("hintsLeft").innerText = `Hints Left: ${maxHints}`;

    // Populate the table with initial numbers
    for (let i = 0; i < intialNumbers.length; i++) {
        const { currentRow, currentCol, newLoadLocation } = parseAndUpdateLoadLocation(loadLocation);

        // Update cell content
        document.getElementById(loadLocation).innerHTML = intialNumbers[i];

        // Update loadLocation for next round
        loadLocation = newLoadLocation;
    }

    // Hide result card
    const card = document.getElementById("resultCard");
    card.classList.add("hidden");

    console.log("Game restarted — updated loadLocation:", loadLocation);
}

// Call the function to start the game
newGameLoading();

let cellClicks = 0;
let firstClickCell = "";
let secondClickCell = "";

let firstCell = null;
let secondCell = null;

// Function to handle cell clicks
function cellClicked(cellID) {
    const cell = document.getElementById(cellID);

    // Deselect if already selected
    if (cell.classList.contains("selected")) {
        cell.classList.remove("selected");
        if (firstCell === cellID) firstCell = null;
        else if (secondCell === cellID) secondCell = null;
        return;
    }

    // Reset if two are already selected
    if (firstCell && secondCell) {
        document.getElementById(firstCell).classList.remove("selected");
        document.getElementById(secondCell).classList.remove("selected");
        firstCell = null;
        secondCell = null;
    }

    // Add selection
    cell.classList.add("selected");
    if (!firstCell) firstCell = cellID;
    else {
        secondCell = cellID;

        // Run match check after slight delay
        setTimeout(() => {
            checkMatch(firstCell, secondCell);
        }, 50);
    }
}

// Function to create the table
function createTable(tableID) {
    let tableRef = document.getElementById(tableID);

    for (let row = 0; row < 128; row++) {
        // Insert a row at the end of the table
        let newRow = tableRef.insertRow(-1);
        // Insert a cell in the row at index 0
        for (let col = 8; col >= 0; col--) {
            let newCell = newRow.insertCell(0);

            newCell.setAttribute('id', row + "-" + col);
            newCell.setAttribute('onclick', "cellClicked(this.id)");
            let newText = document.createTextNode("");
            newCell.appendChild(newText);
        }
    }

    // Set background color for all cells
    for (let row = 0; row < 128; row++) {
        for (let col = 0; col < 9; col++) {
            document.getElementById(row + "-" + col).style.backgroundColor = "white";
        }
    }

    // Populate the table with random numbers
    populateTableWithRandomNumbers(tableID, 1, 9);
}

// Function to check if two cells match
function checkMatch(firstCell, secondCell, hint = false) {
    const cellOne = document.getElementById(firstCell);
    const cellTwo = document.getElementById(secondCell);

    // Apply selected styling
    if (!hint) {
        cellOne.classList.add("selected");
        cellTwo.classList.add("selected");
    }

    const isPathClear =
        isNumbersSameColumn(firstCell, secondCell) ||
        isNumbersSameRow(firstCell, secondCell) ||
        isNumbersDiagonal(firstCell, secondCell) ||
        isNumbersTwoAdjacentLevels(firstCell, secondCell);

    if (!isPathClear) {
        if (!hint) {
            cellOne.classList.add("match-fail");
            cellTwo.classList.add("match-fail");
            setTimeout(() => {
                cellOne.classList.remove("match-fail", "selected");
                cellTwo.classList.remove("match-fail", "selected");
            }, 500);
        }

        // Always clear yellow highlight
        cellOne.style.backgroundColor = "white";
        cellTwo.style.backgroundColor = "white";

        return false;
    }

    let cellOneNumber = parseInt(cellOne.innerText);
    let cellTwoNumber = parseInt(cellTwo.innerText);

    if (cellOneNumber === cellTwoNumber) {
        if (!hint) {
            console.log("Match found! Numbers are the same.");

            cellOne.classList.add("match-success");
            cellTwo.classList.add("match-success");

            setTimeout(() => {
                cellOne.innerText = "";
                cellTwo.innerText = "";

                updateScore(firstCell, secondCell);

                const firstCellRow = parseInt(firstCell.split("-")[0]);
                const secondCellRow = parseInt(secondCell.split("-")[0]);

                if (isRowCleared(firstCellRow)) shiftRowsUp(firstCellRow);
                if (firstCellRow !== secondCellRow && isRowCleared(secondCellRow)) shiftRowsUp(secondCellRow);

                parseAndUpdateLoadLocation();

                // Check if matched cells match the current hint
                if (currentHint && (
                    (firstCell === currentHint[0] && secondCell === currentHint[1]) ||
                    (firstCell === currentHint[1] && secondCell === currentHint[0])
                )) {
                    hintsUsed++;
                    document.getElementById("hintsLeft").innerText = `Hints Left: ${maxHints - hintsUsed}`;
                    currentHint = null;
                }

                cellOne.classList.remove("match-success", "selected");
                cellTwo.classList.remove("match-success", "selected");

                // Clear yellow highlight after success
                cellOne.style.backgroundColor = "white";
                cellTwo.style.backgroundColor = "white";

                checkGameStatus();
            }, 500);
        }
        return true;
    } else if (cellOneNumber + cellTwoNumber === 10) {
        console.log("Match found! Numbers add up to 10.");

        if (!hint) {
            cellOne.classList.add("match-success");
            cellTwo.classList.add("match-success");

            setTimeout(() => {
                cellOne.innerText = "";
                cellTwo.innerText = "";

                updateScore(firstCell, secondCell);

                const firstCellRow = parseInt(firstCell.split("-")[0]);
                const secondCellRow = parseInt(secondCell.split("-")[0]);

                if (isRowCleared(firstCellRow)) shiftRowsUp(firstCellRow);
                if (firstCellRow !== secondCellRow && isRowCleared(secondCellRow)) shiftRowsUp(secondCellRow);

                parseAndUpdateLoadLocation();

                // Check if matched cells match the current hint
                if (currentHint && (
                    (firstCell === currentHint[0] && secondCell === currentHint[1]) ||
                    (firstCell === currentHint[1] && secondCell === currentHint[0])
                )) {
                    hintsUsed++;
                    document.getElementById("hintsLeft").innerText = `Hints Left: ${maxHints - hintsUsed}`;
                    currentHint = null;
                }

                cellOne.classList.remove("match-success", "selected");
                cellTwo.classList.remove("match-success", "selected");

                // Clear yellow highlight after success
                cellOne.style.backgroundColor = "white";
                cellTwo.style.backgroundColor = "white";

                checkGameStatus();
            }, 500);
        }
        return true;
    } else {
        console.log("No match. Numbers do not add up to 10 or are not the same.");

        if (!hint) {
            cellOne.classList.add("match-fail");
            cellTwo.classList.add("match-fail");

            setTimeout(() => {
                cellOne.classList.remove("match-fail", "selected");
                cellTwo.classList.remove("match-fail", "selected");
            }, 500);
        }

        // Always clear yellow highlight on no match
        cellOne.style.backgroundColor = "white";
        cellTwo.style.backgroundColor = "white";

        return false;
    }
}

// Function to copy the remaing numbers
function remainingNumbers() {
    let remainingNumberList = [];

    // Loop through all rows and cells in the table
    for (let row = 0; row < 128; row++) {
        for (let col = 0; col < 9; col++) {
            let cellID = row + "-" + col; // Generate cell ID
            let cell = document.getElementById(cellID);

            // Check if the cell has a number (not empty)
            if (cell.innerText !== "") {
                remainingNumberList.push(parseInt(cell.innerText));
            }
        }
    }

    return remainingNumberList;
}

// Function to copy remaining numbers onto the table
function copyNumbers() {
    if (copiesLeft > 0) {
        let remainingNumberList = remainingNumbers();
        console.log("Remaining numbers:", remainingNumberList);

        // Find the last row that has at least one number
        let lastFilledRow = -1;
        for (let r = 0; r < 128; r++) {
            for (let c = 0; c < 9; c++) {
                let cell = document.getElementById(r + "-" + c);
                if (cell.innerText !== "") {
                    lastFilledRow = r;
                }
            }
        }

        if (lastFilledRow === -1) {
            console.log("No filled rows found. Cannot copy.");
            return;
        }

        // Set starting point for copy after the last number in that row
        let startRow = lastFilledRow;
        let startCol = 0;

        for (let c = 0; c < 9; c++) {
            let cell = document.getElementById(startRow + "-" + c);
            if (cell.innerText === "") {
                startCol = c;
                break;
            } else {
                startCol = 9; 
            }
        }

        if (startCol === 9) {
            startRow++; 
            startCol = 0;
        }


        let row = startRow;
        let col = startCol;

        for (let number of remainingNumberList) {
            if (row >= 128) {
                console.log("Reached end of table. Cannot copy more numbers.");
                break;
            }

            let cellID = row + "-" + col;
            let cell = document.getElementById(cellID);

            if (cell.innerText === "") {
                cell.innerText = number;
            }

            if (col === 8) {
                col = 0;
                row++;
            } else {
                col++;
            }
        }

        //update loadlocation
        loadLocation = row + "-" + col;
        console.log("Updated loadLocation:", loadLocation);

        //decrease from copies
        copiesLeft--;
        document.getElementById("copiesLeft").innerHTML = "Copies Left: " + copiesLeft;

        const status = checkGameStatus();
        if (status === "playing") {
            parseAndUpdateLoadLocation();
        }
        return copiesLeft;
    } else {
        window.alert("No more copies left");
    }
}

// Function to check if selected cells are in the same Column
function isNumbersSameColumn(cellOne, cellTwo) {
    const cellOneLocs = cellOne.split("-");
    let cellOneRow = parseInt(cellOneLocs[0]);
    let cellOneCol = parseInt(cellOneLocs[1]);

    const cellTwoLocs = cellTwo.split("-");
    let cellTwoRow = parseInt(cellTwoLocs[0]);
    let cellTwoCol = parseInt(cellTwoLocs[1]);

    // Check if the cells are in the same column
    if (cellOneCol !== cellTwoCol) {
        return false; 
    }

    // Determine the direction to check (up or down)
    let startRow = Math.min(cellOneRow, cellTwoRow);
    let endRow = Math.max(cellOneRow, cellTwoRow);

    // Check if there are any blocking numbers between the two cells
    for (let row = startRow + 1; row < endRow; row++) {
        let cellID = row + "-" + cellOneCol;
        let cell = document.getElementById(cellID);

        if (cell.innerText !== "") {
            return false;
        }
    }

    return true;
}

// Function to check if selected cells are in the same Row
function isNumbersSameRow(cellOne, cellTwo) {
    const cellOneLocs = cellOne.split("-");
    let cellOneRow = parseInt(cellOneLocs[0]);
    let cellOneCol = parseInt(cellOneLocs[1]);

    const cellTwoLocs = cellTwo.split("-");
    let cellTwoRow = parseInt(cellTwoLocs[0]);
    let cellTwoCol = parseInt(cellTwoLocs[1]);

    // Check if the cells are in the same row
    if (cellOneRow !== cellTwoRow) {
        return false; 
    }

    // Determine the direction to check (left or right)
    let startCol = Math.min(cellOneCol, cellTwoCol);
    let endCol = Math.max(cellOneCol, cellTwoCol);

    // Check if there are any blocking numbers between the two cells
    for (let col = startCol + 1; col < endCol; col++) {
        let cellID = cellOneRow + "-" + col;
        let cell = document.getElementById(cellID);

        if (cell.innerText !== "") {
            return false;
        }
    }

    return true;
}

// Function to check if selected cells are Diagonally connected
function isNumbersDiagonal(cellOne, cellTwo) {
    const cellOneLocs = cellOne.split("-");
    let cellOneRow = parseInt(cellOneLocs[0]);
    let cellOneCol = parseInt(cellOneLocs[1]);

    const cellTwoLocs = cellTwo.split("-");
    let cellTwoRow = parseInt(cellTwoLocs[0]);
    let cellTwoCol = parseInt(cellTwoLocs[1]);

    // Check if the cells are diagonally aligned
    if (Math.abs(cellOneRow - cellTwoRow) !== Math.abs(cellOneCol - cellTwoCol)) {
        return false; 
    }

    // Determine the direction of the diagonal
    const rowStep = cellTwoRow > cellOneRow ? 1 : -1; // 1 for downward, -1 for upward
    const colStep = cellTwoCol > cellOneCol ? 1 : -1; // 1 for rightward, -1 for leftward

    // Check for blocking numbers along the diagonal
    let currentRow = cellOneRow + rowStep;
    let currentCol = cellOneCol + colStep;

    while (currentRow !== cellTwoRow && currentCol !== cellTwoCol) {
        const cellID = currentRow + "-" + currentCol;
        const cell = document.getElementById(cellID);

        // If a cell is not empty, it's blocking the diagonal
        if (cell.innerText !== "") {
            return false; 
        }

        // Move to the next cell in the diagonal
        currentRow += rowStep;
        currentCol += colStep;
    }

    return true;
}

// Function to check if selected cells are Adjacently connected
function isNumbersTwoAdjacentLevels(cellOne, cellTwo, hint) {
    const cellOneLocs = cellOne.split("-");
    let cellOneRow = parseInt(cellOneLocs[0]);
    let cellOneCol = parseInt(cellOneLocs[1]);
    const cellTwoLocs = cellTwo.split("-");
    let cellTwoRow = parseInt(cellTwoLocs[0]);
    let cellTwoCol = parseInt(cellTwoLocs[1]);

    // Check if rows are adjacent
    if (Math.abs(cellOneRow - cellTwoRow) === 1) {
        let higherRow, higherCol, lowerRow, lowerCol;
        if (cellOneRow < cellTwoRow) {
            higherRow = cellOneRow;
            higherCol = cellOneCol;
            lowerRow = cellTwoRow;
            lowerCol = cellTwoCol;
        } else {
            higherRow = cellTwoRow;
            higherCol = cellTwoCol;
            lowerRow = cellOneRow;
            lowerCol = cellOneCol;
        }

        // Check the lower level if clear
        for (let i = 0; i < lowerCol; i++) {
            const cellContent = document.getElementById(lowerRow + "-" + i).innerText;
            if (cellContent !== "") {
                console.log("ADJACENT LEVELS CHECK - Cannot match as there is a number between");
                return false;
            }
        }

        // Check the upper level if clear
        for (let i = higherCol + 1; i < 9; i++) {
            const cellContent = document.getElementById(higherRow + "-" + i).innerText;
            if (cellContent !== "") {
                console.log("ADJACENT LEVELS CHECK - Cannot match as there is a number between");
                return false;
            }
        }

        console.log("GOOD MATCH - ADJACENT LEVELS");
        return true;
    }

    return false;
}

// Function to calculate the score and up to existing score
function updateScore(cellOne, cellTwo) {
    let currentScore = parseInt(document.getElementById("score").innerText);

    let basePoints = 0;

    if (isNumbersSameColumn(cellOne, cellTwo) || isNumbersSameRow(cellOne, cellTwo)) {
        basePoints = 10;
    } else if (isNumbersDiagonal(cellOne, cellTwo)) {
        basePoints = 20;
    } else if (isNumbersTwoAdjacentLevels(cellOne, cellTwo)) {
        basePoints = 30;
    }

    const distance = calculateDistance(cellOne, cellTwo);

    const pointsEarned = basePoints * distance;

    currentScore += pointsEarned;

    document.getElementById("score").innerText = currentScore;

    console.log(`Match type score: ${basePoints}, distance: ${distance}`);
    console.log(`Total points earned: ${pointsEarned}`);

    moveScore = 0;
}


// Function to calculate the distance between two cells for updateScore function
function calculateDistance(cellOne, cellTwo) {
    const cellOneLocs = cellOne.split("-");
    let cellOneRow = parseInt(cellOneLocs[0]);
    let cellOneCol = parseInt(cellOneLocs[1]);

    const cellTwoLocs = cellTwo.split("-");
    let cellTwoRow = parseInt(cellTwoLocs[0]);
    let cellTwoCol = parseInt(cellTwoLocs[1]);

    // Calculate the distance (for diagonals)
    const rowDiff = Math.abs(cellOneRow - cellTwoRow);
    const colDiff = Math.abs(cellOneCol - cellTwoCol);

    // For rows or columns, distance is the maximum of rowDiff and colDiff
    return Math.max(rowDiff, colDiff);
}

// Function to check if a row is clear/empty
function isRowCleared(row) {
    // Loop through all columns in the specified row
    for (let col = 0; col < 9; col++) {
        const cellID = row + "-" + col;
        const cell = document.getElementById(cellID);

        if (cell.innerText !== "") {
            return false;
        }
    }

    return true;
}

// Function to shift all remaining numbers up
function shiftRowsUp(clearedRow) {
    console.log(`Attempting to shift rows up starting from row ${clearedRow}`);

    // Start from the cleared row and move down to the bottom of the table
    for (let row = clearedRow; row < 127; row++) {
        // Loop through all columns in the current row
        for (let col = 0; col < 9; col++) {
            const currentCellID = row + "-" + col;
            const belowCellID = (row + 1) + "-" + col;

            const currentCell = document.getElementById(currentCellID);
            const belowCell = document.getElementById(belowCellID);

            // Copy the number from the cell below to the current cell
            currentCell.innerText = belowCell.innerText;

            belowCell.innerText = "";
        }
    }

    // Clear the bottom row after shifting
    for (let col = 0; col < 9; col++) {
        const bottomCellID = "127-" + col;
        const bottomCell = document.getElementById(bottomCellID);
        bottomCell.innerText = "";
    }

    // Check all rows from the clearedRow upwards
    for (let row = clearedRow; row >= 0; row--) {
        if (isRowCleared(row)) {
        // Check if the row BELOW is also cleared
            if (row + 1 > 127 || isRowCleared(row + 1)) {
                console.log(`No more rows to shift from below row ${row}, stopping`);
                break;
        }
        console.log(`Row ${row} was cleared by the shift, shifting again`);
        shiftRowsUp(row);
        break;
    }
}
    // Update the loadLocation to the next available cell
    const locations = loadLocation.split("-");
    let row = parseInt(locations[0]);
    let col = parseInt(locations[1]);

    if (col === 8) {
        col = 0;
        row++;
    } else {
        col++;
    }

    const result = parseAndUpdateLoadLocation(loadLocation);
    loadLocation = result.newLoadLocation;
}

// Function to generate all remaining possible moves as hints
function getAllHints() {
    hintsList = [];
    console.log("Cleared the hints now the size is: " + hintsList.length);

    const cellLocs = loadLocation.split("-");
    let loadLocationRow = parseInt(cellLocs[0]);
    let loadLocationCol = parseInt(cellLocs[1]);

    // Loop through all cells up to the loadLocation
    for (let row = 0; row <= loadLocationRow; row++) {
        for (let col = 0; col < 9; col++) {
            const currentLocation = row + "-" + col;
            const currentCell = document.getElementById(currentLocation);

            if (currentCell.innerText === "") continue;

            // Check for matches in the same row, column, or diagonal
            for (let secondRow = row; secondRow <= loadLocationRow; secondRow++) {
                for (let secondCol = (secondRow === row ? col + 1 : 0); secondCol < 9; secondCol++) {
                    const secondLocation = secondRow + "-" + secondCol;
                    const secondCell = document.getElementById(secondLocation);

                    if (secondCell.innerText === "" || currentLocation === secondLocation) continue;

                    // Check if the cells match
                    if (checkMatch(currentLocation, secondLocation, true)) {
                        hintsList.push(currentLocation + "WITH" + secondLocation);
                    }
                }
            }
        }
    }

    console.log("Current number of hints is: " + hintsList.length);
    console.log("Hints list:", hintsList);
    return hintsList;
}

// Function to display hints to player
function showHints() {
    if (hintsUsed >= maxHints) {
        window.alert("You've used all your hints for this game!");
        return;
    }

    // Clear previous highlights
    for (let row = 0; row < 128; row++) {
        for (let col = 0; col < 9; col++) {
            const cell = document.getElementById(`${row}-${col}`);
            cell.style.backgroundColor = "white";
            cell.classList.remove("selected");
        }
    }

    const cellLocs = loadLocation.split("-");
    let loadLocationRow = parseInt(cellLocs[0]);

    for (let row = 0; row <= loadLocationRow; row++) {
        for (let col = 0; col < 9; col++) {
            const cellID1 = `${row}-${col}`;
            const cell1 = document.getElementById(cellID1);

            if (cell1.innerText === "") continue;

            for (let r2 = row; r2 <= loadLocationRow; r2++) {
                for (let c2 = (r2 === row ? col + 1 : 0); c2 < 9; c2++) {
                    const cellID2 = `${r2}-${c2}`;
                    const cell2 = document.getElementById(cellID2);

                    if (cellID1 === cellID2 || cell2.innerText === "") continue;

                    if (checkMatch(cellID1, cellID2, true)) {
                        // Highlight the hint cells
                        cell1.style.backgroundColor = "yellow";
                        cell2.style.backgroundColor = "yellow";

                        // Store the current hint for later tracking
                        currentHint = [cellID1, cellID2];
                        return;
                    }
                }
            }
        }
    }

    if (copiesLeft === 0) {
        window.alert("Sorry, no more moves left. You lost. Please try again.");
        newGameLoading();
    } else {
        window.alert("No possible plays available!");
    }
}


// Function to show the results to player (win/loss)
function showResultCard(title, message, celebrate = false) {
    const card = document.getElementById("resultCard");
    const titleEl = document.getElementById("resultTitle");
    const messageEl = document.getElementById("resultMessage");
    const scoreEl = document.getElementById("finalScoreDisplay");

    const currentScore = parseInt(document.getElementById("score").innerText);
    scoreEl.innerText = `Your Final Score: ${currentScore}`;

    titleEl.innerText = title;
    messageEl.innerText = message;

    card.classList.remove("hidden");

    if (celebrate) {
        setTimeout(() => {
            const myConfetti = confetti.create(canvas, {
                resize: true,
                useWorker: true
            });

            myConfetti({
                particleCount: 200,
                spread: 100,
                origin: { y: 0.6 }
            });
        }, 100);
    }
}


// Function to check if the player wins or losses
function checkGameStatus() {
    const remaining = remainingNumbers();

    console.log("Remaining Numbers:", remaining);
    console.log("Remaining Count:", remaining.length);
    console.log("Copies Left:", copiesLeft);
    console.log("Hints Left:", hintsList);

    if (remaining.length === 0) {
        showResultCard("🎉 You Won!", "You cleared the board!", true);
        return "won";
    }

    if (copiesLeft <= 0 && hintsList <= 0) {
        showResultCard("😢 Game Over", "No more copies or hints!", false);
        return "lost";
    }

    return "playing";
}

// Function to hide and show the settings 
function toggleSettings() {
    document.getElementById("settingsMenu").classList.toggle("show");
}

// Function to hide and show the leaderboard
function toggleLeaderboard() {
    const settingsMenu = document.getElementById("settingsMenu");
    if (settingsMenu.classList.contains("show")) {
        settingsMenu.classList.remove("show");
    }

    document.getElementById("leaderboardMenu").classList.toggle("show");
    
    // Fetch and display the leaderboard when opened
    fetchLeaderboard();
}

// Function to fetch leaderboard data and update the table
async function fetchLeaderboard() {
    try {
        const response = await fetch('https://your-backend-api/leaderboard');
        const leaderboardData = await response.json();
        
        // Select the table body to update
        const leaderboardTableBody = document.querySelector("#leaderboardTable tbody");
        leaderboardTableBody.innerHTML = '';

        // Populate leaderboard table with new data
        leaderboardData.forEach((entry, index) => {
            const row = document.createElement('tr');
            
            const rankCell = document.createElement('td');
            rankCell.textContent = index + 1;
            row.appendChild(rankCell);

            const nameCell = document.createElement('td');
            nameCell.textContent = entry.name; 
            row.appendChild(nameCell);

            const scoreCell = document.createElement('td');
            scoreCell.textContent = entry.score; 
            row.appendChild(scoreCell);

            leaderboardTableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
    }
}

// Function to handle difficulty 
function handleDifficultyChange(level) {
    localStorage.setItem("difficulty", level);
    console.log("Difficulty set to:", level);
}

// Function to handle the sound  
function handleSoundToggle(isOn) {
    localStorage.setItem("sound", isOn);
    console.log("Sound is", isOn ? "on" : "off");
}

// Function to handle the theme of the game  
function toggleTheme(isDark) {
    document.body.classList.toggle("dark-mode", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
}

// Load saved settings on page load
window.onload = () => {
    const difficulty = localStorage.getItem("difficulty");
    const sound = localStorage.getItem("sound") === "true";
    const theme = localStorage.getItem("theme");

    if (difficulty) document.getElementById("difficulty").value = difficulty;
    document.getElementById("soundToggle").checked = sound;
    document.getElementById("themeToggle").checked = (theme === "dark");
    if (theme === "dark") document.body.classList.add("dark-mode");
};



