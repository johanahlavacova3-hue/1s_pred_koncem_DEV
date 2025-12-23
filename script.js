// ==========================================
// KONFIGURACE (Technický Fade Objekt)
// ==========================================

var TRAIL_LENGTH = 40;        // Délka stopy (počet článků v řadě)
var PARTICLE_SIZE = 8;        // Velikost hlavního objektu
var FADE_SPEED = 0.02;        // Jak rychle stopa mizí
var SPACING = 4;              // Mezera mezi částicemi ve stopě

// FYZIKA
var SPEED = 0.8;
var FRICTION = 0.88;          // Vyšší tření pro přesnější ovládání

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

class TechnicalObject {
    constructor(x, y, controls, color) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.controls = controls;
        this.color = color; // Např. "255, 255, 255"
        
        // Pole pro ukládání historie pozic (vytváří fade stopu)
        this.history = [];
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

        // Uložení aktuální pozice do historie
        this.history.unshift({x: this.x, y: this.y});

        // Omezení délky stopy
        if (this.history.length > TRAIL_LENGTH) {
            this.history.pop();
        }
    }

    draw() {
        // Vykreslení stopy (Fade)
        this.history.forEach((pos, index) => {
            // Výpočet vlastností pro každý článek stopy
            let progress = 1 - (index / TRAIL_LENGTH); // 1 (hlava) až 0 (konec)
            let size = PARTICLE_SIZE * progress;
            let alpha = progress * 0.8;

            ctx.fillStyle = `rgba(${this.color}, ${alpha})`;
            
            // Kreslíme čtverec nebo kosočtverec pro technický vzhled
            ctx.beginPath();
            ctx.fillRect(pos.x - size/2, pos.y - size/2, size, size);
        });

        // Hlavní objekt (vždy nejjasnější)
        ctx.fillStyle = `rgb(${this.color})`;
        ctx.fillRect(this.x - PARTICLE_SIZE/2, this.y - PARTICLE_SIZE/2, PARTICLE_SIZE, PARTICLE_SIZE);
    }
}

// Inicializace hráčů (přísné barvy, žádné záření)
const p1 = new TechnicalObject(window.innerWidth * 0.3, window.innerHeight * 0.5, 
    { up: 'w', down: 's', left: 'a', right: 'd' }, "255, 255, 255");

const p2 = new TechnicalObject(window.innerWidth * 0.7, window.innerHeight * 0.5, 
    { up: 'arrowup', down: 'arrowdown', left: 'arrowleft', right: 'arrowright' }, "200, 200, 200");

// Jednoduchý šum pro texturu pozadí (grain)
function drawStatic() {
    ctx.fillStyle = `rgba(255,255,255,0.02)`;
    for(let i=0; i<100; i++) {
        ctx.fillRect(Math.random()*canvas.width, Math.random()*canvas.height, 1, 1);
    }
}

function loop() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    p1.update();
    p2.update();
    
    p1.draw();
    p2.draw();
    
    drawStatic();
    requestAnimationFrame(loop);
}

loop();
