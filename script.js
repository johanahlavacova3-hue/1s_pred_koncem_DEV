// ==========================================
// KONFIGURAČNÍ PANEL (Ladicí parametry)
// ==========================================

// 1. TVAR A HUSTOTA
var PARTICLE_COUNT = 400;      // Počet teček v jednom zhluku
var CLOUD_RADIUS = 130;        // Základní velikost zhluku
var SHAPE_IRREGULARITY = 0.7;  // Jak moc je tvar "šišatý" (0 = kruh, 1+ = divoká skvrna)
var SHAPE_DETAIL = 4;          // Počet "hrbolů" na obvodu (členitost tvaru)

// 2. VZHLED ČÁSTIC
var DOT_MIN_SIZE = 0.5;        // Minimální velikost tečky
var DOT_MAX_SIZE = 2.8;        // Maximální velikost tečky
var OPACITY = 0.85;            // Průhlednost (0 až 1)
var BLUR_STRENGTH = 12;        // Měkkost okrajů (glow efekt)

// 3. POHYB A FYZIKA
var SPEED = 0.55;              // Zrychlení pohybu (WASD / Šipky)
var FRICTION = 0.91;           // Tření (pocit "setrvačnosti" ve vodě)
var JITTER_SPEED = 0.04;       // Rychlost vnitřního chvění
var JITTER_STRENGTH = 6;       // Intenzita vnitřního chvění teček

// 4. EFEKT OBJETÍ (Q / P)
var HUG_COMPRESSION = 0.25;    // Jak moc se tvar smrští při stisku klávesy
var HUG_LINE_STRENGTH = 0.2;   // Viditelnost propojovacích vláken
var HUG_GLOW_ALPHA = 0.15;     // Intenzita aury při objetí

// 5. TEXTURA (GRAIN)
var GRAIN_DENSITY = 0.08;      // Hustota šumu (0.01 až 0.2)
var GRAIN_STRENGTH = 35;       // Kontrast šumu

// ==========================================
// JÁDRO PROGRAMU
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

class Player {
    constructor(x, y, controls) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.controls = controls;
        this.isHugging = false;
        this.particles = [];
        
        // Inicializace organického tvaru pomocí polárních souřadnic
        for(let i = 0; i < PARTICLE_COUNT; i++) {
            let angle = Math.random() * Math.PI * 2;
            
            // Tvorba nepravidelného obvodu (skvrny)
            let shapeNoise = 1 + (Math.sin(angle * SHAPE_DETAIL) * SHAPE_IRREGULARITY);
            // Rozmístění uvnitř tohoto tvaru
            let dist = Math.sqrt(Math.random()) * CLOUD_RADIUS * shapeNoise;

            this.particles.push({
                offX: Math.cos(angle) * dist,
                offY: Math.sin(angle) * dist,
                size: Math.random() * (DOT_MAX_SIZE - DOT_MIN_SIZE) + DOT_MIN_SIZE,
                seed: Math.random() * 100
            });
        }
    }

    update() {
        // Vstupy z klávesnice
        if (keys[this.controls.up])    this.vy -= SPEED;
        if (keys[this.controls.down])  this.vy += SPEED;
        if (keys[this.controls.left])  this.vx -= SPEED;
        if (keys[this.controls.right]) this.vx += SPEED;

        // Aplikace fyziky
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= FRICTION;
        this.vy *= FRICTION;
        
        this.isHugging = keys[this.controls.hug];
    }

    draw(time) {
        let compression = this.isHugging ? HUG_COMPRESSION : 1.0;
        
        // Nastavení vizuálního stylu (Monochromatický Blur)
        ctx.shadowBlur = BLUR_STRENGTH;
        ctx.shadowColor = "white";
        ctx.fillStyle = `rgba(255, 255, 255, ${OPACITY})`;

        this.particles.forEach(p => {
            // Vnitřní neustálý pohyb (jitter)
            let jitterX = Math.sin(time * JITTER_SPEED + p.seed) * JITTER_STRENGTH;
            let jitterY = Math.cos(time * JITTER_SPEED + p.seed) * JITTER_STRENGTH;
            
            let drawX = this.x + (p.offX * compression) + jitterX;
            let drawY = this.y + (p.offY * compression) + jitterY;

            ctx.beginPath();
            ctx.arc(drawX, drawY, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.shadowBlur = 0; // Reset pro výkon

        // Aura při objetí
        if (this.isHugging) {
            let g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, CLOUD_RADIUS * 2);
            g.addColorStop(0, `rgba(255, 255, 255, ${HUG_GLOW_ALPHA})`);
            g.addColorStop(1, "transparent");
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(this.x, this.y, CLOUD_RADIUS * 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// Inicializace hráčů (WASD+Q a Šipky+P)
const p1 = new Player(window.innerWidth * 0.3, window.innerHeight / 2, { 
    up: 'w', down: 's', left: 'a', right: 'd', hug: 'q' 
});
const p2 = new Player(window.innerWidth * 0.7, window.innerHeight / 2, { 
    up: 'arrowup', down: 'arrowdown', left: 'arrowleft', right: 'arrowright', hug: 'p' 
});

// Funkce pro generování zrnité textury (Grain)
function applyGrain() {
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    const buffer = new Uint32Array(imageData.data.buffer);
    
    for (let i = 0; i < buffer.length; i++) {
        if (Math.random() < GRAIN_DENSITY) {
            let val = Math.random() * GRAIN_STRENGTH;
            // Šedotónový šum
            buffer[i] = (val << 24) | 0xFFFFFF; 
        }
    }
    
    let tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    tempCanvas.getContext('2d').putImageData(imageData, 0, 0);
    
    ctx.globalCompositeOperation = "overlay";
    ctx.drawImage(tempCanvas, 0, 0);
    ctx.globalCompositeOperation = "source-over";
}

let time = 0;
function loop() {
    // Pozadí (černá s mírným dozvukem pro motion blur)
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    time++;
    p1.update();
    p2.update();

    // Logika propojení (Interference při objetí)
    let dx = p1.x - p2.x;
    let dy = p1.y - p2.y;
    let dist = Math.sqrt(dx*dx + dy*dy);

    if (p1.isHugging && p2.isHugging && dist < 600) {
        ctx.strokeStyle = `rgba(255, 255, 255, ${HUG_LINE_STRENGTH})`;
        ctx.lineWidth = 0.5;
        for(let i=0; i < 15; i++) {
            ctx.beginPath();
            ctx.moveTo(p1.x + (Math.random()-0.5)*80, p1.y + (Math.random()-0.5)*80);
            ctx.lineTo(p2.x + (Math.random()-0.5)*80, p2.y + (Math.random()-0.5)*80);
            ctx.stroke();
        }
    }

    // Vykreslení hráčů
    p1.draw(time);
    p2.draw(time);
    
    // Finální vrstva textury
    applyGrain();

    requestAnimationFrame(loop);
}

loop();
