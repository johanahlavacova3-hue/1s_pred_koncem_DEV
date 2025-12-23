// ==========================================
// KONFIGURACE (Interferenční styl)
// ==========================================

var GRID_SIZE = 35;           // Kolik bodů v řadě/sloupci (vytváří hustotu mřížky)
var DOT_MAX_SIZE = 3.5;       // Maximální velikost bodu
var SPACING = 5;              // Mezery mezi body v mřížce

// VIZUÁLNÍ DNA (mění se při refresh)
var WAVE_A = Math.random() * 0.1 + 0.05; 
var WAVE_B = Math.random() * 0.1 + 0.05;

// FYZIKA
var SPEED = 0.6;
var FRICTION = 0.92;
var MORPH_SPEED = 0.04;       // Rychlost vlnění (animace)

// ==========================================
// JÁDRO JEDNOTLIVÝCH SHLUKŮ
// ==========================================

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

const keys = {};
window.addEventListener("keydown", (e) => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", (e) => keys[e.key.toLowerCase()] = false);

class WaveShape {
    constructor(x, y, controls) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.controls = controls;
        
        // Unikátní vlnění pro každého hráče
        this.personalWave = Math.random() * 10;
    }

    update() {
        if (keys[this.controls.up])    this.vy -= SPEED;
        if (keys[this.controls.down])  this.vy += SPEED;
        if (keys[this.controls.left])  this.vx -= SPEED;
        if (keys[this.controls.right]) this.vx += SPEED;

        this.x += this.vx;
        this.y += this.vy;
        this.vx *= FRICTION;
        this.vy *= FRICTION;
        this.isHugging = keys[this.controls.hug];
    }

    draw(time) {
        let hugEffect = this.isHugging ? 2.5 : 1.0;
        
        // Vytváříme mřížku bodů (podobně jako na tvých fotkách)
        for (let i = -GRID_SIZE/2; i < GRID_SIZE/2; i++) {
            for (let j = -GRID_SIZE/2; j < GRID_SIZE/2; j++) {
                
                let posX = i * SPACING;
                let posY = j * SPACING;

                // HLAVNÍ TRIK: Matematická deformace tvaru (Interference)
                // Toto vytváří ty "vlnky" a nepravidelné okraje z tvých obrázků
                let angle = Math.atan2(posY, posX);
                let dist = Math.sqrt(posX * posX + posY * posY);
                
                // Tato funkce deformuje čtvercovou mřížku na organický tvar
                let wave = Math.sin(dist * WAVE_A - time * MORPH_SPEED) * Math.cos(angle * 4 + this.personalWave);
                
                let offsetX = Math.cos(angle) * wave * 20 * hugEffect;
                let offsetY = Math.sin(angle) * wave * 20 * hugEffect;

                // Velikost bodu se mění podle interference (vytváří to ty vzorce)
                let sizeFactor = Math.abs(wave) * DOT_MAX_SIZE;
                
                if (sizeFactor > 0.5) { // Kreslíme jen viditelné body
                    ctx.fillStyle = `rgba(255, 255, 255, ${0.4 + sizeFactor/DOT_MAX_SIZE})`;
                    ctx.beginPath();
                    ctx.arc(this.x + posX + offsetX, this.y + posY + offsetY, sizeFactor, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    }
}

// Inicializace
const p1 = new WaveShape(window.innerWidth * 0.3, window.innerHeight * 0.5, { 
    up: 'w', down: 's', left: 'a', right: 'd', hug: 'q' 
});
const p2 = new WaveShape(window.innerWidth * 0.7, window.innerHeight * 0.5, { 
    up: 'arrowup', down: 'arrowdown', left: 'arrowleft', right: 'arrowright', hug: 'p' 
});

function drawGrain() {
    ctx.globalCompositeOperation = "overlay";
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.05})`;
    ctx.fillRect(0,0,canvas.width, canvas.height);
    ctx.globalCompositeOperation = "source-over";
}

let t = 0;
function loop() {
    // Černé pozadí
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    t++;
    p1.update();
    p2.update();
    
    p1.draw(t);
    p2.draw(t);
    
    drawGrain();
    requestAnimationFrame(loop);
}

loop();
