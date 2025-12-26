const canvas = document.getElementById('gridCanvas');
const ctx = canvas.getContext('2d');

let width, height;
const keys = { q: false, e: false };

// Parametry mřížky podle obrázku
const gridCount = 12;      // Počet sloupců a řad
const depthLayers = 40;    // Počet čtverců v hloubce
let speed = 0.005;         // Rychlost pohybu vpřed
let movement = 0;

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);
window.addEventListener('keydown', (e) => { if(e.key.toLowerCase() in keys) keys[e.key.toLowerCase()] = true; });
window.addEventListener('keyup', (e) => { if(e.key.toLowerCase() in keys) keys[e.key.toLowerCase()] = false; });

function draw() {
    // Pozadí
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    
    movement += speed;
    if (movement > 1) movement = 0;

    // Vykreslování od nejvzdálenějších (vzadu) po nejbližší (vpředu)
    for (let z = depthLayers; z > 0; z--) {
        const zPos = z - movement;
        
        // Výpočet perspektivy (čím menší zPos, tím větší objekt)
        const scale = 600 / (zPos * 15 + 1); 
        const opacity = Math.min(1, (depthLayers - zPos) / (depthLayers * 0.7));
        
        // Nastavení vzhledu čáry
        ctx.lineWidth = keys.q ? 2 : 0.8;
        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.6})`;
        
        // Efekt záře při stisknutí Q
        if (keys.q) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = "white";
        } else {
            ctx.shadowBlur = 0;
        }

        for (let i = -gridCount / 2; i <= gridCount / 2; i++) {
            for (let j = -gridCount / 2; j <= gridCount / 2; j++) {
                
                // Pozice čtverce v prostoru
                const x = centerX + i * (110 * scale);
                const y = centerY + j * (110 * scale);
                const size = 30 * scale;

                // BLUR DO STRAN: Čím dál od středu, tím větší blur
                const dist = Math.sqrt(i*i + j*j);
                if (dist > 2) {
                    ctx.filter = `blur(${dist * 0.8}px)`;
                } else {
                    ctx.filter = 'none';
                }

                // Efekt E: Propojení se středem (vytvoření tunelu)
                if (keys.e) {
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(centerX, centerY);
                    ctx.stroke();
                }

                // Vykreslení samotného čtverce
                ctx.strokeRect(x - size / 2, y - size / 2, size, size);
            }
        }
    }

    requestAnimationFrame(draw);
}

resize();
draw();
