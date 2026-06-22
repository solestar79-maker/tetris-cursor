// --- 상수 ---
const COLS = 10;
const ROWS = 20;
const DROP_INTERVAL_MS = 800;

const SCORE_BY_LINES = {
  1: 100,
  2: 300,
  3: 500,
  4: 800,
};

const PIECE_CLASS_NAMES = [
  "piece-i",
  "piece-o",
  "piece-t",
  "piece-s",
  "piece-z",
  "piece-j",
  "piece-l",
];

const TETROMINOES = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    color: "i",
  },
  O: {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: "o",
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: "t",
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    color: "s",
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    color: "z",
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: "j",
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: "l",
  },
};

const PIECE_TYPES = Object.keys(TETROMINOES);

// --- DOM 참조 ---
const boardElement = document.getElementById("board");
const scoreElement = document.getElementById("score");
const statusElement = document.getElementById("game-status");
const startBtn = document.getElementById("start-btn");
const restartBtn = document.getElementById("restart-btn");

// --- 게임 상태 ---
let score = 0;
let gameState = "idle";
let settledBoard = null;
let currentPiece = null;
let boardCells = null;

const dropLoop = {
  timerId: null,

  start() {
    this.stop();
    this.timerId = setInterval(tick, DROP_INTERVAL_MS);
  },

  stop() {
    if (this.timerId === null) {
      return;
    }
    clearInterval(this.timerId);
    this.timerId = null;
  },

  isRunning() {
    return this.timerId !== null;
  },
};

// --- 보드 데이터 ---
function createEmptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

function isCellInsideBoard(boardRow, boardCol) {
  return (
    boardRow >= 0 &&
    boardRow < ROWS &&
    boardCol >= 0 &&
    boardCol < COLS
  );
}

function getOccupiedBoardCells(piece, rowOffset = 0, colOffset = 0) {
  const cells = [];

  for (let shapeRow = 0; shapeRow < piece.shape.length; shapeRow += 1) {
    for (let shapeCol = 0; shapeCol < piece.shape[shapeRow].length; shapeCol += 1) {
      if (!piece.shape[shapeRow][shapeCol]) {
        continue;
      }

      cells.push({
        row: piece.row + shapeRow + rowOffset,
        col: piece.col + shapeCol + colOffset,
      });
    }
  }

  return cells;
}

function clearLines(board) {
  let clearedLineCount = 0;
  let targetRow = ROWS - 1;

  for (let sourceRow = ROWS - 1; sourceRow >= 0; sourceRow -= 1) {
    const isRowFull = board[sourceRow].every((cell) => cell !== 0);

    if (isRowFull) {
      clearedLineCount += 1;
    } else {
      board[targetRow] = board[sourceRow];
      targetRow -= 1;
    }
  }

  for (let row = targetRow; row >= 0; row -= 1) {
    board[row] = Array(COLS).fill(0);
  }

  return clearedLineCount;
}

// --- 블록 ---
function createPiece(type) {
  const template = TETROMINOES[type] ?? TETROMINOES.T;
  const resolvedType = TETROMINOES[type] ? type : "T";

  if (!TETROMINOES[type]) {
    console.warn(`Unknown piece type: ${type}, using T instead.`);
  }

  const shapeWidth = template.shape[0].length;

  return {
    type: resolvedType,
    shape: template.shape.map((row) => [...row]),
    color: template.color,
    row: 0,
    col: Math.floor((COLS - shapeWidth) / 2),
  };
}

function pickRandomPieceType() {
  return PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
}

function rotateShape(shape) {
  const rowCount = shape.length;
  const colCount = shape[0].length;
  const rotated = Array.from({ length: colCount }, () => Array(rowCount).fill(0));

  for (let row = 0; row < rowCount; row += 1) {
    for (let col = 0; col < colCount; col += 1) {
      rotated[col][rowCount - 1 - row] = shape[row][col];
    }
  }

  return rotated;
}

function createPieceWithShape(piece, shape) {
  return { ...piece, shape };
}

// --- 충돌 판정 ---
function canMove(piece, deltaCol, deltaRow, board) {
  for (const { row: boardRow, col: boardCol } of getOccupiedBoardCells(
    piece,
    deltaRow,
    deltaCol,
  )) {
    if (!isCellInsideBoard(boardRow, boardCol)) {
      return false;
    }

    if (board[boardRow][boardCol]) {
      return false;
    }
  }

  return true;
}

function canSpawn(piece, board) {
  return canMove(piece, 0, 0, board);
}

function canLockPiece(piece) {
  return getOccupiedBoardCells(piece).every(({ row, col }) =>
    isCellInsideBoard(row, col),
  );
}

function lockPiece(piece, board) {
  for (const { row: boardRow, col: boardCol } of getOccupiedBoardCells(piece)) {
    board[boardRow][boardCol] = piece.color;
  }
}

function mergePieceOntoBoard(board, piece) {
  const mergedBoard = board.map((row) => [...row]);

  for (const { row: boardRow, col: boardCol } of getOccupiedBoardCells(piece)) {
    if (isCellInsideBoard(boardRow, boardCol)) {
      mergedBoard[boardRow][boardCol] = piece.color;
    }
  }

  return mergedBoard;
}

// --- 렌더링 ---
function setupBoardElement() {
  boardElement.style.setProperty("--cols", COLS);
  boardElement.style.setProperty("--rows", ROWS);
}

function initBoardCells() {
  if (boardCells) {
    return;
  }

  boardCells = [];

  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      boardElement.appendChild(cell);
      boardCells.push(cell);
    }
  }
}

function updateCellElement(cell, cellValue) {
  cell.classList.remove("filled", ...PIECE_CLASS_NAMES);

  if (cellValue) {
    cell.classList.add("filled", `piece-${cellValue}`);
  }
}

function renderBoard(board) {
  initBoardCells();

  let cellIndex = 0;
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      updateCellElement(boardCells[cellIndex], board[row][col]);
      cellIndex += 1;
    }
  }
}

function buildDisplayBoard() {
  const board = settledBoard ?? createEmptyBoard();
  return currentPiece ? mergePieceOntoBoard(board, currentPiece) : board;
}

function renderGame() {
  renderBoard(buildDisplayBoard());
}

// --- UI ---
function updateScore(nextScore) {
  score = nextScore;
  scoreElement.textContent = score;
}

function updateGameStatus(message, isGameOver = false) {
  statusElement.textContent = message;
  statusElement.classList.toggle("is-over", isGameOver);
}

function updateButtonState() {
  startBtn.disabled = gameState === "playing";
  restartBtn.disabled = gameState !== "playing" && gameState !== "gameover";
}

function addScoreForLines(clearedLineCount) {
  if (clearedLineCount <= 0) {
    return;
  }

  const points = SCORE_BY_LINES[clearedLineCount] ?? clearedLineCount * 100;
  updateScore(score + points);
}

// --- 게임 흐름 ---
function isPlayingWithActivePiece() {
  return gameState === "playing" && currentPiece !== null;
}

function handleGameOver() {
  dropLoop.stop();
  gameState = "gameover";
  currentPiece = null;
  updateGameStatus("게임 오버", true);
  renderGame();
  updateButtonState();
}

function spawnNextPiece() {
  currentPiece = createPiece(pickRandomPieceType());

  if (!canSpawn(currentPiece, settledBoard)) {
    handleGameOver();
    return;
  }

  renderGame();
}

function lockCurrentPiece() {
  if (!currentPiece) {
    return;
  }

  if (!canLockPiece(currentPiece)) {
    return;
  }

  lockPiece(currentPiece, settledBoard);
  const clearedLineCount = clearLines(settledBoard);
  addScoreForLines(clearedLineCount);
  spawnNextPiece();
}

function tick() {
  if (!isPlayingWithActivePiece()) {
    return;
  }

  if (canMove(currentPiece, 0, 1, settledBoard)) {
    currentPiece.row += 1;
    renderGame();
    return;
  }

  lockCurrentPiece();
}

function tryMovePiece(deltaCol, deltaRow) {
  if (!isPlayingWithActivePiece()) {
    return false;
  }

  if (!canMove(currentPiece, deltaCol, deltaRow, settledBoard)) {
    return false;
  }

  currentPiece.row += deltaRow;
  currentPiece.col += deltaCol;
  renderGame();
  return true;
}

function tryRotatePiece() {
  if (!isPlayingWithActivePiece()) {
    return false;
  }

  const rotatedShape = rotateShape(currentPiece.shape);
  const rotatedPiece = createPieceWithShape(currentPiece, rotatedShape);

  if (!canMove(rotatedPiece, 0, 0, settledBoard)) {
    return false;
  }

  currentPiece.shape = rotatedShape;
  renderGame();
  return true;
}

function hardDrop() {
  if (!isPlayingWithActivePiece()) {
    return;
  }

  while (canMove(currentPiece, 0, 1, settledBoard)) {
    currentPiece.row += 1;
  }

  renderGame();
  lockCurrentPiece();
}

function resetBoardData() {
  settledBoard = createEmptyBoard();
  currentPiece = createPiece(pickRandomPieceType());
  updateScore(0);
}

function beginGameSession() {
  dropLoop.stop();
  resetBoardData();
  updateGameStatus("플레이 중");

  if (!canSpawn(currentPiece, settledBoard)) {
    handleGameOver();
    return;
  }

  renderGame();
  dropLoop.start();
}

function enterPlayingSession() {
  gameState = "playing";
  beginGameSession();
  updateButtonState();
}

function startGame() {
  if (gameState === "playing") {
    return;
  }

  enterPlayingSession();
}

function restartGame() {
  if (gameState !== "playing" && gameState !== "gameover") {
    return;
  }

  enterPlayingSession();
}

// --- 입력 ---
function handleKeyDown(event) {
  if (!isPlayingWithActivePiece()) {
    return;
  }

  switch (event.code) {
    case "ArrowLeft":
      event.preventDefault();
      tryMovePiece(-1, 0);
      break;
    case "ArrowRight":
      event.preventDefault();
      tryMovePiece(1, 0);
      break;
    case "ArrowDown":
      event.preventDefault();
      tryMovePiece(0, 1);
      break;
    case "ArrowUp":
      event.preventDefault();
      tryRotatePiece();
      break;
    case "Space":
      event.preventDefault();
      hardDrop();
      break;
    default:
      break;
  }
}

function bindKeyboardControls() {
  document.addEventListener("keydown", handleKeyDown);
}

// --- 초기화 ---
startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", restartGame);
bindKeyboardControls();

setupBoardElement();
initBoardCells();
settledBoard = createEmptyBoard();
renderGame();
updateGameStatus("대기 중");
updateButtonState();
