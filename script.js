// ====== ZÁKLAD CANVASU ======
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// ====== ČAS ======
let time = 0;

// ====== HRÁČ (POZICE + POHYB) ======
let player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  vx: 0,
  vy: 0,
  speed: 0.4,
  moving: false
};

// ====== DRUHÁ ENTITA (TEN DRUHÝ) ======
let other = {
  x: canvas.width / 2 + 200,
  y: canvas.height / 2,
  baseRadius: 80
};

// ====== SRDEČNÍ RYTMUS (MODEL) ======
let heartRate = 70;      // BPM
let calmRate = 55;       // při objetí
let pulseStrength = 20;  // velikost pulzu

// ====== STAV OBJETÍ ======
let hugging = false;

// ====== INPUT (ZATÍM KLÁVESY) ======
window.addEventListener("keydown", e => {
  if (e.key === "ArrowUp") player.vy = -player.speed;
  if (e.key === "ArrowDown") player.vy = player.speed;
  if (e.key === "ArrowLeft") player.vx = -player.speed;
  if (e.key === "ArrowRight") player.vx = player.speed;
});

window.addEventListener("keyup", () => {
  player.vx = 0;
  player.vy = 0;
});

// ====== HLAVNÍ SMYČKA ======
function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // ---- POHYB HRÁČE ----
  player.x += player.vx;
  player.y += player.vy;

  player.moving = Math.abs(player.vx) + Math.abs(player.vy) > 0;

  // ---- MIN–MAX CHOVÁNÍ ----
  if (!player.moving) {
    // když stojí → osciluje mezi min a max
    heartRate = 60 + Math.sin(time * 0.5) * 5;
  } else {
    // když se pohybuje → roste aktivita
    heartRate = Math.min(120, heartRate + 0.05);
  }

  // ---- VZDÁLENOST MEZI ENTITAMI ----
  const dx = player.x - other.x;
  const dy = player.y - other.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // ---- OBJETÍ ----
  hugging = distance < 100;

  if (hugging) {
    // rytmy se synchronizují a uklidňují
    heartRate += (calmRate - heartRate) * 0.05;
  }

  // ---- PULZ ----
  const frequency = heartRate / 60;
  const pulse = Math.sin(time * frequency * Math.PI * 2);

  // ---- VIZUÁLNÍ TVARY ----
  drawField(player.x, player.y, 100 + pulse * pulseStrength, hugging);
  drawField(other.x, other.y, other.baseRadius, hugging);

  time += 0.016;
  requestAnimationFrame(update);
}

// ====== KRESLENÍ POLE ======
function drawField(x, y, radius, hugging) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);

  if (hugging) {
    // OBJETÍ = ZMĚNA TVARU / STAVU
    ctx.fillStyle = "rgba(200, 200, 255, 0.25)";
  } else {
    ctx.fillStyle = "rgba(120, 180, 255, 0.12)";
  }

  ctx.fill();
}

// START
update();
