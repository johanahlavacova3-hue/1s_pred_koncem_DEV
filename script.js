// ==========================================
// KONFIGURACE - JEDNA BUŇKA (PLAYER)
// ==========================================

var NPC_COUNT = 0;            // Žádní boti, jen ty
var PARTICLE_SIZE = 60;       // Zvětšeno pro demo (základ)
var SPEED = 0.5;              // Trochu rychlejší, aby se s velkou buňkou dalo hýbat
var FRICTION = 0.92;          // Jemný dojezd
var TRAIL_LENGTH = 20;        // Delší stopa pro hezčí efekt

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

// OVLÁDÁNÍ
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
        this.history = [];
        this.isHugging = false; 
        this.flash = 0;      
        this.mistSize = 1.0; 
    }

    update() {
        let accX = 0, accY = 0;

        // POHYB HRÁČE (WASD)
        if (this.isPlayer) {
            if (keys['w']) accY = -1;
            if (keys['s']) accY = 1;
            if (keys['a']) accX = -1;
            if (keys['d']) accX = 1;
            
            // SIGNÁLY (Q a E)
            this.isHugging = keys['q'];      
            if (keys['e']) this.flash = 1.0; 

            // DEMO ÚPRAVA PRO Q:
            // Protože tu není nikdo jiný na "objetí", při stisku Q 
            // natvrdo zvětšíme mlhu, abys viděl vizuální efekt.
            if (this.isHugging) {
                this.mistSize = 2.5; 
            }
        }

        // FYZIKA 1:1
        this.vx += accX * SPEED;
        this.vy += accY * SPEED;
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= FRICTION;
        this.vy *= FRICTION;

        // Postupné zhasínání flash efektu (E)
        if (this.flash > 0) this.flash -= 0.04;

        // Plynulý návrat velikosti mlhy (pokud nedržíš Q)
        if (this.mistSize > 1.0) this.mistSize -= 0.08;

        this.history.unshift({x: this.x, y: this.y});
        if (this.history.length > TRAIL_LENGTH) this.history.pop();
    }

    draw() {
        this.history.forEach((pos, index) => {
            let progress = 1 - (index / TRAIL_LENGTH);
            
            // Výpočet velikosti: základní + roztažení (Q) + bliknutí (E)
            let currentSize = PARTICLE_SIZE * progress * (this.mistSize + this.flash * 1.5); 
            
            // Výpočet jasu: základní + bliknutí (E)
            // Upraveno alfa, aby velká buňka nebyla plný čtverec, ale mlha
            let alpha = ((progress * 0.4) / this.mistSize) + (this.flash * progress * 0.5);

            ctx.fillStyle = `rgba(0, 249, 255, ${alpha})`;
            ctx.fillRect(pos.x - currentSize/2, pos.y - currentSize/2, currentSize, currentSize);
        });
    }
}

// VYTVOŘENÍ POUZE JEDNOHO HRÁČE
const player = new TechEntity(canvas.width/2, canvas.height/2, true);

function loop() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update a Draw pouze hráče
    player.update();
    player.draw();

    requestAnimationFrame(loop);
}

loop();
