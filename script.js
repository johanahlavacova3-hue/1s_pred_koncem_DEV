// ==========================================
// KONFIGURAČNÍ PANEL (Estetika prachu a zrna)
// ==========================================

var PARTICLE_COUNT = 800;      // Mnohem více částic pro efekt prachu
var CLOUD_RADIUS = 100;        // Základní rozptyl
var SHAPE_IRREGULARITY = 0.9;  // Vysoká nepravidelnost (jako améba)
var SHAPE_DETAIL = 3;          // Méně detailů pro hladší, organické tvary

// VZHLED ČÁSTIC (Pískový/Prachový efekt)
var DOT_MIN_SIZE = 0.3;        // Skoro neviditelné body
var DOT_MAX_SIZE = 1.8;        // Drobné zrnka
var OPACITY_BASE = 0.4;        // Velmi nízká průhlednost pro vrstvení
var COLOR_VARIATION = 50;      // Rozsah šedi (aby to nebylo jen čistě bílé)

// POHYB
var SPEED = 0.45;
var FRICTION = 0.93;
var JITTER_STRENGTH = 4;       // Jemné chvění prachu

// TEXTURA (Zásadní pro vzhled starého tisku/rentgenu)
var GRAIN_DENSITY = 0.15;      // Hodně šumu
var GRAIN_STRENGTH = 25;       // Jemný, ale všudypřítomný šum

// ==========================================
// KÓD
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
        this.particles = [];
        
        for(let i = 0; i < PARTICLE_COUNT; i++) {
            let angle = Math.random() * Math.PI * 2;
            let shapeNoise = 1 + (Math.sin(angle * SHAPE_DETAIL) * SHAPE_IRREGULARITY);
            let dist = Math.sqrt(Math.random()) * CLOUD_RADIUS * shapeNoise;

            // Každé zrnko má trochu jiný odstín šedé (vytváří texturu)
            let gray = 255 - Math.random() * COLOR_VARIATION;

            this.particles.push({
                offX: Math.cos(angle) * dist,
                offY: Math.sin(angle) * dist,
                size: Math.random() * (DOT_MAX_SIZE - DOT_MIN_SIZE) + DOT_MIN_SIZE,
                color: `rgba(${gray}, ${gray}, ${gray}, ${OPACITY_BASE})`,
                seed: Math.random() * 100
            });
        }
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
        let compression = this.isHugging ? 0.3 : 1.0;
        
        // Žádný shadowBlur - chceme ostré/špinavé zrno
        this.particles.forEach(p => {
            let jtX = Math.sin(time * 0.05 + p.seed) * JITTER_STRENGTH;
            let jtY = Math.cos(time * 0.05 + p.seed) * JITTER_STRENGTH;
            
            let drawX = this.x + (p.offX * compression) + jtX;
            let drawY = this.y + (p.offY * compression) + jtY;

            ctx.fillStyle = p.color;
            ctx.beginPath();
            // Kreslíme čtverečky místo kruhů pro více "pixelatý/lo-fi" vzhled
            ctx.fillRect(drawX, drawY, p.size, p.size);
        });
    }
}

const p1 = new Player(window.innerWidth * 0.3, window.innerHeight * 0.5, { up:'w', down:'s', left:'a', right:'d', hug:'q' });
const p2 = new Player(window.innerWidth * 0.7, window.innerHeight * 0.5, { up:'arrowup', down:'arrowdown', left:'arrowleft', right:'arrowright', hug:'p' });

function applyGrain() {
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    const buffer = new Uint32Array(imageData.data.buffer);
    for (let i = 0; i < buffer.length; i++) {
        if (Math.random() < GRAIN_DENSITY) {
            let v = Math.random() * GRAIN_STRENGTH;
            buffer[i] = (v << 24) | 0xFFFFFF; 
        }
    }
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    tempCanvas.getContext('2d').putImageData(imageData, 0, 0);
    
    // Použijeme "soft-light" nebo "overlay" pro prolnutí
    ctx.globalCompositeOperation = "overlay";
    ctx.drawImage(tempCanvas, 0, 0);
    ctx.globalCompositeOperation = "source-over";
}

function loop() {
    // Čistě černé pozadí bez ghostingu (aby zrno zůstalo ostré)
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    p1.update();
    p2.update();

    p1.draw(Date.now() * 0.001);
    p2.draw(Date.now() * 0.001);
    
    applyGrain();
    requestAnimationFrame(loop);
}

loop();
