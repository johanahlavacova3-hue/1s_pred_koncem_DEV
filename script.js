const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let w, h;
const keys = { q: false, e: false };

// Nastavení mřížky přesně podle tvého obrázku
const GRID_COUNT = 10;     // Kolik čtverců v řadě
const DEPTH_LAYERS = 40;   // Hloubka tunelu
const SPACING = 150;       // Rozestupy
let progress = 0;
let speed = 0.005;

function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.innerHeight = window.innerHeight;
}

window.addEventListener('resize', resize);
window.addEventListener('keydown', e => { 
    const key = e.key.toLowerCase();
    if(key in keys) keys[key] = true; 
});
window.addEventListener('keyup', e => { 
    const key = e.key.toLowerCase();
    if(key in keys) keys[key] = false; 
});

function draw() {
    // Pozadí
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, w, h);

    progress += speed;
    if (progress > 1) progress = 0;

    const centerX = w / 2;
    const centerY = h / 2;

    // Vykreslování od nejvzdálenějších
    for (let z = DEPTH_LAYERS; z > 0; z--) {
        const currentZ = z - progress;
        const scale = 500 / (currentZ * 15 + 1); // Perspektiva
        const alpha = Math.max(0, 1 - (currentZ / DEPTH_LAYERS));
        
        // Základní styl čáry
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
        ctx.lineWidth = keys.q ? 2 : 1;
        
        // Efekt záře (pouze pokud je stisknuto Q - je to náročné na výkon)
        if (keys.q) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = 'white';
        } else {
            ctx.shadowBlur = 0;
        }

        for (let x = -GRID_COUNT / 2; x <= GRID_COUNT / 2; x++) {
            for (let y = -GRID_COUNT / 2; y <= GRID_COUNT / 2; y++) {
                
                const posX = centerX + x * SPACING * scale;
                const posY = centerY + y * SPACING * scale;
                const size = 30 * scale;

                // Místo náročného filtru blur používáme "špinavé čáry" pro efekt z obrázku
                const dist = Math.sqrt(x*x + y*y);
                
                // Klávesa E: Propojení
                if (keys.e) {
                    ctx.globalAlpha = alpha * 0.3;
                    ctx.beginPath();
                    ctx.moveTo(posX, posY);
                    ctx.lineTo(centerX, centerY);
                    ctx.stroke();
                    ctx.globalAlpha = 1.0;
                }

                // Vykreslení čtverce s lehkým chvěním (jitter) jako na screenshotu
                const shift = (Math.random() - 0.5) * (dist * 0.5);
                
                ctx.strokeRect(
                    posX - size / 2 + shift, 
                    posY - size / 2 + shift, 
                    size, 
                    size
                );
            }
        }
    }

    requestAnimationFrame(draw);
}

resize();
draw();
