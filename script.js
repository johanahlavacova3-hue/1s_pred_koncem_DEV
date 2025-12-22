const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

// ====== PARAMETRY (TADY LADÍŠ) ======
const COUNT = 5;
const CENTER_FORCE = 0.002;
const SWIRL_FORCE = 0.002;
const NOISE_FORCE = 0.3;
const MAX_SPEED = 0.6;

// ====== ČÁSTICE ======
const particles = [];
const center = { x: () => canvas.width / 2, y: () => canvas.height / 2 };

for (let i = 0; i < COUNT; i++) {
  particles.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: 0,
    vy: 0,
    phase: Math.random() * Math.PI * 2,
    seed: Math.random() * 1000
  });
}

let time = 0;

// ====== HLAVNÍ SMYČKA ======
function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  time += 0.01;

  particles.forEach(p => {
    // vektor ke středu
    const dx = center.x() - p.x;
    const dy = center.y() - p.y;

    // vzdálenost
    const dist = Math.sqrt(dx * dx + dy * dy) + 0.001;

    // normalizace
    const nx = dx / dist;
    const ny = dy / dist;

    // pulzující přitažlivost (shromažďování / rozpad)
    const pulse = Math.sin(time + p.phase);

    // síly
    p.vx += nx * CENTER_FORCE * pulse;
    p.vy += ny * CENTER_FORCE * pulse;

    // rotace kolem středu
    p.vx += -ny * SWIRL_FORCE;
    p.vy += nx * SWIRL_FORCE;

    // jemný „chaos“ (ale řízený)
    p.vx += Math.sin(time + p.seed) * NOISE_FORCE * 0.001;
    p.vy += Math.cos(time + p.seed) * NOISE_FORCE * 0.001;

    // limit rychlosti
    const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
    if (speed > MAX_SPEED) {
      p.vx = (p.vx / speed) * MAX_SPEED;
      p.vy = (p.vy / speed) * MAX_SPEED;
    }

    // pohyb
    p.x += p.vx;
    p.y += p.vy;

    // kreslení
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(160, 200, 255, 0.6)";
    ctx.fill();
  });

  requestAnimationFrame(update);
}

update();
