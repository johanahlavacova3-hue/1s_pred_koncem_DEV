const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let w, h;
const keys = { q: false, e: false };

// Konfigurace mřížky
const GRID_SIZE = 12;      // Počet čtverců v jedné rovině
const DEPTH_LAYERS = 35;   // Kolik vrstev vidíme do dálky
const SPACING = 150;       // Mezery mezi čtverci
let speed = 0.007;         // Rychlost pohybu
let progress = 0;          // Aktuální posun v čase

function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);
window.addEventListener('keydown', e => { if(e.key.toLowerCase() in keys) keys[e.key.toLowerCase()] = true; });
window.addEventListener('keyup', e => { if(e.key.toLowerCase() in keys) keys[e.key.toLowerCase()] = false; });

function draw() {
    // Čistě černý podklad
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, w, h);

    progress += speed;
    if (progress > 1) progress -= 1;

    // Vykreslování od nejvzdálenějších po nejbližší (Z-sorting)
    for (let z = DEPTH_LAYERS; z > 0; z--) {
        const currentZ = z - progress;
        
        // Perspektivní koeficient (čím menší Z, tím větší měřítko)
        const scale = 400 / (currentZ * 10 + 1);
        
        // Efekt mlhy/vzdálenosti (čím dál, tím víc mizí)
        const alpha = Math.max(0, 1 - (currentZ / DEPTH_LAYERS));
        
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.7})`;
        ctx.lineWidth = keys.q ? 2.5 : 1;

        // Nastavení záře (Bloom)
        if (keys.q) {
            ctx.shadowBlur = 12;
            ctx.shadowColor = 'white';
        } else {
            ctx.shadowBlur = 0;
        }

        for (let x = -GRID_SIZE / 2; x <= GRID_SIZE / 2; x++) {
            for (let y = -GRID_SIZE / 2; y <= GRID_SIZE / 2; y++) {
                
                // Výpočet pozice na obrazovce
                const screenX = w / 2 + x * SPACING * scale;
                const screenY = h / 2 + y * SPACING * scale;
                const size = 30 * scale;

                // Rozmazání (Blur) do stran - simulace optické vady
                const distFromCenter = Math.sqrt(x * x + y * y);
                if (distFromCenter > 2) {
                    ctx.filter = `blur(${distFromCenter * 0.7}px)`;
                } else {
                    ctx.filter = 'none';
                }

                // Funkce [E]: Propojení se sousedními vrstvami nebo středem
                if (keys.e) {
                    ctx.beginPath();
                    ctx.moveTo(screenX, screenY);
                    ctx.lineTo(w / 2, h / 2);
                    ctx.stroke();
                }

                // Vlastní vykreslení čtverce
                // Přidáváme mírný "jitter" (chvění), aby to vypadalo jako náčrt z obrázku
                const jitter = keys.q ? 0 : Math.random() * 1; 
                ctx.strokeRect(
                    screenX - size / 2 + jitter, 
                    screenY - size / 2 + jitter, 
                    size, 
                    size
                );
            }
        }
    }

    requestAnimationFrame(draw);
}

// Spuštění
resize();
draw();
