// ==========================================
// KONFIGURACE
// ==========================================

var TRAIL_LENGTH = 30;        // Délka stopy
var PARTICLE_SIZE = 9;        // Velikost bublin
var SPEED = 0.35;             // Rychlost pohybu
var FRICTION = 0.93;          // "Klouzavost"
var HUG_DIST = 70;            // Vzdálenost pro spojení
var NPC_COUNT = 130;          // Počet NPC

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

// Klávesy
const keys = {};
window.addEventListener("keydown", (e) => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", (e) => keys[e.key.toLowerCase()] = false);

class TechEntity {
    constructor(x, y, isPlayer = false) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.isPlayer = isPlayer;
        
        // --- BARVY (Fialová paleta) ---
        // Hráč je světlý, NPC sytější fialová
        this.baseColor = isPlayer ? "240, 230, 255" : "180, 160, 255"; 
        this.history = [];
        
        // Stavy
        this.flash = 0;      
        this.isHugging = false; 
        
        // --- AI LOGIKA ---
        this.inputX = 0; 
        this.inputY = 0;
        this.moveTimer = 0;
        this.hugTimer = Math.random() * 500; 
    }

    update() {
        // --- 1. OVLÁDÁNÍ / AI ---
        let accX = 0;
        let accY = 0;

        if (this.isPlayer) {
            // Ovládání hráče
            if (keys['w']) accY = -1;
            if (keys['s']) accY = 1;
            if (keys['a']) accX = -1;
            if (keys['d']) accX = 1;
            if (keys['e']) this.flash = 1.0; 
            this.isHugging = keys['q'];      
        } 
        else {
            // AI pro NPC
            this.moveTimer--;
            if (this.moveTimer <= 0) {
                if (Math.random() < 0.4) {
                    this.inputX = 0; this.inputY = 0;
                } else {
                    this.inputX = Math.floor(Math.random() * 3) - 1; 
                    this.inputY = Math.floor(Math.random() * 3) - 1; 
                }
                
                // Odrážení od okrajů
                if (this.x < 50) this.inputX = 1;
                if (this.x > canvas.width - 50) this.inputX = -1;
                if (this.y < 50) this.inputY = 1;
                if (this.y > canvas.height - 50) this.inputY = -1;

                this.moveTimer = Math.random() * 80 + 30; 
            }
            accX = this.inputX;
            accY = this.inputY;

            // Náhodné bliknutí
            if (Math.random() < 0.003) { 
                this.flash = 1.0;
            }

            // Logika objetí (střídání nálad)
            this.hugTimer--;
            if (this.hugTimer <= 0) {
                this.isHugging = !this.isHugging; 
                this.hugTimer = this.isHugging ? (Math.random() * 150 + 50) : (Math.random() * 500 + 200);
            }
        }

        // --- 2. FYZIKA ---
        this.vx += accX * SPEED;
        this.vy += accY * SPEED;
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= FRICTION;
        this.vy *= FRICTION;

        if (this.flash > 0) this.flash -= 0.03;

        // --- 3. STOPA ---
        this.history.unshift({x: this.x, y: this.y});
        if (this.history.length > TRAIL_LENGTH) this.history.pop();
    }

    draw() {
        // Vykreslení stopy (ocas) - KRUHY
        this.history.forEach((pos, index) => {
            let progress = 1 - (index / TRAIL_LENGTH);
            let size = PARTICLE_SIZE * progress; 
            
            let baseAlpha = this.isPlayer ? 0.5 : 0.25; 
            let flashBonus = this.flash * 0.6; 
            let alpha = progress * (baseAlpha + flashBonus);

            ctx.fillStyle = `rgba(${this.baseColor}, ${alpha})`;
            
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, size / 2, 0, Math.PI * 2);
            ctx.fill();
        });

        // Vykreslení hlavy - KRUH
        let headSize = PARTICLE_SIZE + (this.flash * 8);
        ctx.fillStyle = this.flash > 0.5 ? "white" : `rgb(${this.baseColor})`;
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, headSize / 2, 0, Math.PI * 2);
        ctx.fill();

        // Indikace objetí (Q)
        if (this.isHugging) {
            ctx.strokeStyle = `rgba(230, 220, 255, ${0.1 + Math.random()*0.1})`; 
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 18, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
}

// --- Inicializace ---

const entities = [];

// Hráč
const player = new TechEntity(window.innerWidth/2, window.innerHeight/2, true);
entities.push(player);

// NPC - Startují ve shluku uprostřed (Swarm efekt)
for (let i = 0; i < NPC_COUNT; i++) {
    let angle = Math.random() * Math.PI * 2;
    let radius = Math.random() * 200; // Rozptyl od středu
    let startX = (window.innerWidth / 2) + Math.cos(angle) * radius;
    let startY = (window.innerHeight / 2) + Math.sin(angle) * radius;

    entities.push(new TechEntity(startX, startY, false));
}

// Zrnění (jemně fialové)
function drawGrain() {
    ctx.fillStyle = "rgba(200, 180, 255, 0.03)";
    for(let i=0; i<400; i++) {
        ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1, 1);
    }
}

function loop() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 1. Update všech
    entities.forEach(e => e.update());

    // 2. Vykreslení spojení (Logic Hug)
    ctx.strokeStyle = "rgba(230, 220, 255, 0.3)"; // Fialová linka
    ctx.lineWidth = 1;
    
    for (let i = 0; i < entities.length; i++) {
        let e1 = entities[i];
        if (!e1.isHugging) continue; 

        for (let j = i + 1; j < entities.length; j++) {
            let e2 = entities[j];
            if (!e2.isHugging) continue; 

            let dx = e1.x - e2.x;
            let dy = e1.y - e2.y;
            let distSq = dx*dx + dy*dy; 

            if (distSq < HUG_DIST * HUG_DIST) {
                ctx.beginPath();
                ctx.moveTo(e1.x, e1.y);
                ctx.lineTo(e2.x, e2.y);
                ctx.stroke();
                
                if (e1.flash < 0.2) e1.flash += 0.05;
                if (e2.flash < 0.2) e2.flash += 0.05;
            }
        }
    }

    // 3. Vykreslení entit
    entities.forEach(e => e.draw());

    drawGrain();
    requestAnimationFrame(loop);
}

loop();
