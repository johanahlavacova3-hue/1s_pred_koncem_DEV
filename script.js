const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let width, height;
let keys = { q: false, e: false };

// Parametry mřížky
const cols = 14;
const rows = 14;
const depth = 25; // Počet vrstev čtverců v dálce
let speed = 0.015;
let offset = 0;

// Nastavení velikosti plátna
function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}

// Sledování kláves
window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (key === 'q' || key === 'e') keys[key] = true;
});

window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (key === 'q' || key === 'e') keys[key] = false;
});

function draw() {
    // Čištění obrazovky s mírným průsvitem pro efekt "smearing" (volitelné)
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;

    // Posun v čase pro efekt pohybu vpřed
    offset += speed;
    if (offset > 1) offset -= 1;

    // Vykreslování odzadu dopředu
    for (let z = depth; z > 0; z--) {
        const zPos = z - offset;
        const perspective = 500 / (zPos + 1); // Výpočet perspektivy
        
        // Viditelnost (fade do dálky)
        const opacity = Math.max(0, 1 - zPos / (depth * 0.7));
        const size = 40 * perspective;

        // Nastavení stylu čar
        ctx.lineWidth = keys.q ? 2.5 : 1;
        ctx.shadowBlur = keys.q ? 15 : 0;
        ctx.shadowColor = "white";
        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;

        for (let i = -cols / 2; i <= cols / 2; i++) {
            for (let j = -rows / 2; j <= rows / 2; j++) {
                const x = centerX + i * 120 * perspective;
                const y = centerY + j * 120 * perspective;

                // Blur efekt do stran: čím dál od středu, tím víc rozmazané
                const distFromCenter = Math.sqrt(i * i + j * j);
                ctx.filter = distFromCenter > 3 ? `blur(${distFromCenter * 0.6}px)` : 'none';

                // Režim [E] - Propojení čarami k úběžnému bodu
                if (keys.e) {
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(centerX, centerY);
                    ctx.stroke();
                }

                // Vykreslení čtverce
                ctx.strokeRect(x - size / 2, y - size / 2, size, size);
            }
        }
    }

    requestAnimationFrame(draw);
}

// Inicializace
window.addEventListener('resize', resize);
resize();
draw();
