let grid = [];
const boardSize = 10;
const totalBombs = 20;
let flagged = 0;
let timer = 0;
let gameInterval;
let gameStarted = false;
let gameOver = false;

// Elements
const gameBoard = document.getElementById("game-board");
const flagCountElement = document.getElementById("flag-count");
const timerElement = document.getElementById("timer");
const resetButton = document.getElementById("reset-button");
const instructionsButton = document.getElementById("instructions-button");
const instructionsModal = document.getElementById("instructions-modal");
const closeModal = document.getElementById("close-modal");

// Open the instructions modal when the "Instructions" button is clicked
instructionsButton.addEventListener("click", () => {
  instructionsModal.style.display = "block";
});

// Close the modal when the "x" is clicked
closeModal.addEventListener("click", () => {
  instructionsModal.style.display = "none";
});

// Close the modal if the user clicks anywhere outside of the modal
window.addEventListener("click", (event) => {
  if (event.target === instructionsModal) {
    instructionsModal.style.display = "none";
  }
});

// Start a new game
function startNewGame() {
  clearInterval(gameInterval); // Stops the current game timer
  gameOver = false;
  gameStarted = false;
  flagged = 0;
  timer = 0;
  timerElement.textContent = "00:00";
  flagCountElement.textContent = flagged;
  winnerMessage.style.display = "none";
  createBoard(); // Create a new fresh
}

// Create the new game board
function createBoard() {
  grid = [];
  gameBoard.innerHTML = ""; // Clears the game board
  for (let row = 0; row < boardSize; row++) {
    const rowArray = [];
    for (let column = 0; column < boardSize; column++) {
      const box = document.createElement("div");
      box.classList.add("box");
      box.dataset.row = row;
      // console.log("row", row);, 10 x 10
      box.dataset.column = column;
      // console.log("column", column); 10 x 10
      box.addEventListener("click", handleLeftClick);
      box.addEventListener("contextmenu", handleRightClick); // distinct event in JavaScript for the right mouse button
      gameBoard.appendChild(box);
      rowArray.push({
        element: box, //storing box reference in the DOM element property of the object, class="box", makes it easier to access that cell later.
        bomb: false,
        revealed: false,
        flagged: false,
        adjacentBombs: 0,
      });
    }
    grid.push(rowArray);
  }
  placeBombs();
  calculateAdjacentBombs();
}

// Place bombs randomly
function placeBombs() {
  let bombsPlaced = 0;
  while (bombsPlaced < totalBombs) {
    //use while to loop continuously repeat placing bombs until totalBombs number of bombs are placed
    // totalBombs set to 20
    const row = Math.floor(Math.random() * boardSize);
    const column = Math.floor(Math.random() * boardSize);
    if (!grid[row][column].bomb) {
      //cghecking if the box cell doesn't already have a bomb
      grid[row][column].bomb = true;
      bombsPlaced++;

      /* 
//this is for when we wanna know where all the bombs are located, 
  so we can test the winner message etc.//
//
     //Get the box cell and set the background color to indicate a bomb
      
      const box = grid[row][column].element;
      box.style.backgroundColor = "#f44336";
//
      */
    }
  }
}

// Calculate the number of adjacent bombs for each cell
function calculateAdjacentBombs() {
  for (let row = 0; row < boardSize; row++) {
    for (let column = 0; column < boardSize; column++) {
      if (grid[row][column].bomb) continue;
      let adjacentBombs = 0;
      for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
        for (let columnOffset = -1; columnOffset <= 1; columnOffset++) {
          const newRow = row + rowOffset; // row can be +1 row above, 0 current row or -1 row below
          const newColumn = column + columnOffset; //column can be +1 column to the riught, 0 current column, -1 column to the left
          if (
            newRow >= 0 && // checking for VALID rows,
            newRow < boardSize && // checks if row is between 0 and 10, stop from trying row numbers below 0 and above 10
            // boardSize is 10, so it will test up to 9
            newColumn >= 0 && //checking for VALID columns,
            newColumn < boardSize && // checks if column is between 0 and 10, dont want negative column number or column number above 10
            //then if the cell is a valid row number and valid cell number, we can check if it has a bomb in it
            grid[newRow][newColumn].bomb // check if the bomb cell accessed with the bomb property is set to true
          ) {
            adjacentBombs++;
            //so after checking all 8 cells around the current cell we checking, except the edge cells where it will only check 5,
            //and the corner cells where it will only check 3
            //then it will increment the number of bombs located near that specific cell
          }
        }
      }
      grid[row][column].adjacentBombs = adjacentBombs;
      // then it will add the number of bombs located around that cell to the adjacentBombs property
    }
  }
}

// Handle left-click to reveal a box cell
function handleLeftClick(event) {
  if (gameOver) return; // so if the game is oiver, cell is a bomb, the user can't click the cells anymore.

  const box = event.target; // box will now represent the clicked cell
  const row = parseInt(box.dataset.row); //all attribute values in HTML are treated as strings, including data-* attributes,
  const column = parseInt(box.dataset.column); //so thats why we have to parse it back to a number/integer

  // Don't reveal flagged cells
  if (grid[row][column].flagged) return;

  if (!gameStarted) {
    gameStarted = true;
    startGameTimer(); // Start the timer when the first box cell is clicked
  }

  if (grid[row][column].bomb) {
    box.classList.add("bomb", "fizzling");
    setTimeout(() => {
      // After fizzling, explode the bomb
      box.classList.remove("fizzling");
      box.classList.add("exploded");
      triggerConfetti(box);
    }, 2000); // Fizzling for 2 seconds before exploding
    gameOver = true;
    clearInterval(gameInterval); // Stop the timer
    revealAllBombs();
  } else {
    revealCell(row, column);
  }
  checkForWinner();
}
// Trigger confetti effect
function triggerConfetti(box) {
  for (let i = 0; i < 20; i++) {
    // Create 20 confetti pieces
    const confettiPiece = document.createElement("div");
    confettiPiece.classList.add("confetti");
    box.appendChild(confettiPiece);
    // Randomly position each confetti piece
    confettiPiece.style.left = `${Math.random() * 50}px`;
    confettiPiece.style.top = `${Math.random() * 50}px`;
  }
}

// Reveal all bombs and apply fizzling/explosion effects one by one (Domino Effect)
function revealAllBombs() {
  let delay = 0;

  for (let row = 0; row < boardSize; row++) {
    for (let column = 0; column < boardSize; column++) {
      if (grid[row][column].bomb && !grid[row][column].revealed) {
        const box = grid[row][column].element;
        setTimeout(() => {
          box.classList.add("bomb", "fizzling"); // Start fizzing

          setTimeout(() => {
            box.classList.remove("fizzling");
            box.classList.add("exploded"); // After fizzling, explode css styles
            triggerConfetti(box); // Add confetti to the relevant exploded bombs
          }, 1000); // 2 seconds for fizzling before explosion
        }, delay);
        delay += 250; // Delay the explosion of each bomb by 0.5 seconds for the domino down effect
      }
    }
  }
}
// Reveal the cell and adjacent cells if no bombs are around
function revealCell(row, column) {
  if (grid[row][column].revealed) return;
  const box = grid[row][column].element;
  grid[row][column].revealed = true;
  box.classList.add("revealed");

  if (grid[row][column].adjacentBombs > 0) {
    box.textContent = grid[row][column].adjacentBombs;
    box.classList.add(`number-${grid[row][column].adjacentBombs}`);
  } else {
    for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
      for (let columnOffset = -1; columnOffset <= 1; columnOffset++) {
        const newRow = row + rowOffset;
        const newColumn = column + columnOffset;
        if (
          newRow >= 0 &&
          newRow < boardSize &&
          newColumn >= 0 &&
          newColumn < boardSize &&
          !grid[newRow][newColumn].revealed
        ) {
          revealCell(newRow, newColumn);
        }
      }
    }
  }
}

// Handle right-click to flag a cell
function handleRightClick(event) {
  event.preventDefault();
  //so in the grid the default right click behaviour of the browser's
  //context menu doesn't show and we can reassign it to the flag
  if (gameOver) return;

  const box = event.target;
  const row = parseInt(box.dataset.row);
  const column = parseInt(box.dataset.column);

  if (grid[row][column].revealed) return;

  if (grid[row][column].flagged) {
    grid[row][column].flagged = false;
    box.classList.remove("flagged");
    flagged--;
  } else {
    if (flagged < totalBombs) {
      grid[row][column].flagged = true;
      box.classList.add("flagged");
      flagged++;
    } else if (flagged === 20) {
      // Check if all 20 flags have been used
      flagCountElement.textContent = "All 20 flags have been used!";
      return;
    }
  }
  flagCountElement.textContent = flagged;
}

// Check for win condition (all bombs flagged or all non-bombs revealed)
function checkForWinner() {
  let allBombsFlagged = true;
  let allNonBombsRevealed = true;

  for (let row = 0; row < boardSize; row++) {
    for (let column = 0; column < boardSize; column++) {
      if (grid[row][column].bomb && !grid[row][column].flagged) {
        allBombsFlagged = false;
      }
      if (!grid[row][column].bomb && !grid[row][column].revealed) {
        allNonBombsRevealed = false;
      }
    }
  }

  // If all bombs are flagged or all non-bombs are revealed, player wins
  if (allBombsFlagged || allNonBombsRevealed) {
    displayWinner();
  }
}

// Display the winner message
function displayWinner() {
  winnerMessage.style.display = "block"; // Show winner message
  clearInterval(gameInterval); // Stops the current game timer
}

function updateTimer() {
  timer++; // Increment the timer by 1 second every time
  const minutes = Math.floor(timer / 60); // Calculating the minutes
  const remainingSeconds = timer % 60; // Calculating seconds
  timerElement.textContent = `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds
  ).padStart(2, "0")}`; // Update the timer display
}
function startGameTimer() {
  gameInterval = setInterval(updateTimer, 1000); // Update the timer every second
}

// Reset the game when the reset button is clicked
resetButton.addEventListener("click", startNewGame);

// Initialize the game BOOYAH!
startNewGame();
