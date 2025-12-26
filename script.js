// ==========================================
// KONFIGURACE - ČISTĚ BINÁRNÍ REŽIM (TEČKY)
// ==========================================
const TRAIL_LENGTH = 20;    // Delší stopa pro lepší efekt
const ENTITY_SIZE = 4;      // Velikost základního bodu
const SPEED = 0.8;          // Agresivní pohyb
const FRICTION = 0.92;      
const HUG_DIST = 150;       
const NPC_COUNT = 150;      // Můžeme si dovolit víc teček než u videa

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Pixel-perfect nastavení
ctx.imageSmoothingEnabled = false;

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

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
        this.flash = 0; 
        this.isHugging = false;
        
        this.moveTimer = Math.random() * 100;
        this.actionTimer = Math.random() * 200;
        this.inputX = 0;
        this.inputY = 0;
    }

    update() {
        let ax = 0, ay = 0;
        if (this.isPlayer) {
            if (keys['w']) ay = -1;
            if (keys['s']) ay = 1;
            if (keys['a']) ax = -1;
            if (keys['d']) ax = 1;
            if (keys['e']) this.flash = 2; // Výrazný puls
            this.isHugging = keys['q'];
        } else {
            this.moveTimer--;
            if (this.moveTimer <= 0) {
                this.inputX = (Math.random() * 2 - 1);
                this.inputY = (Math.random() * 2 - 1);
                this.moveTimer = Math.random() * 60 + 20;
            }
            ax = this.inputX; ay = this.inputY;
            
            if (Math.random() < 0.01) this.flash = 1;
            this.actionTimer--;
            if (this.actionTimer <= 0) {
                this.isHugging = !this.isHugging;
                this.actionTimer = Math.random() * 200 + 50;
            }
        }

        this.vx += ax * SPEED; this.vy += ay * SPEED;
        this.x += this.vx; this.y += this.vy;
        this.vx *= FRICTION; this.vy *= FRICTION;
        
        if (this.flash > 0) this.flash -= 0.1;

        // Odrážení od stěn
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1.2;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1.2;
        
        this.history.unshift({x: this.x, y: this.y});
        if (this.history.length > TRAIL_LENGTH) this.history.pop();
    }

    draw() {
        // Vykreslení stopy (ghosting efekt)
        this.history.forEach((pos, i) => {
            let op = (1 - i / TRAIL_LENGTH) * (this.isPlayer ? 0.6 : 0.2);
            ctx.fillStyle = `rgba(255, 255, 255, ${op})`;
            let s = this.isPlayer ? 3 : 1;
            ctx.fillRect(Math.floor(pos.x), Math.floor(pos.y), s, s);
        });

        // Hlavní bod
        let s = ENTITY_SIZE + (this.flash * 10);
        ctx.fillStyle = this.isPlayer ? "white" : "rgba(200, 200, 200, 0.8)";
        
        if (this.flash > 0.5) ctx.fillStyle = "white";
        
        ctx.fillRect(Math.floor(this.x - s/2), Math.floor(this.y - s/2), Math.floor(s), Math.floor(s));

        // Propojení (Aura při Q)
        if (this.isHugging) {
            ctx.strokeStyle = this.isPlayer ? "white" : "rgba(255, 255, 255, 0.2)";
            ctx.strokeRect(Math.floor(this.x - s/2 - 2), Math.floor(this.y - s/2 - 2), s + 4, s + 4);
        }
    }
}

const entities = [];
for(let i=0; i<NPC_COUNT; i++) entities.push(new TechEntity(Math.random()*canvas.width, Math.random()*canvas.height));
const player = new TechEntity(canvas.width/2, canvas.height/2, true);
entities.push(player);

function drawConnections() {
    ctx.beginPath();
    for (let i = 0; i < entities.length; i++) {
        for (let j = i + 1; j < entities.length; j++) {
            let a = entities[i], b = entities[j];
            if (a.isHugging && b.isHugging) {
                let d = Math.hypot(a.x - b.x, a.y - b.y);
                if (d < HUG_DIST) {
                    ctx.moveTo(Math.floor(a.x), Math.floor(a.y));
                    ctx.lineTo(Math.floor(b.x), Math.floor(b.y));
                }
            }
        }
    }
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 0.5;
    ctx.stroke();
}

function loop() {
    // Čistě černé pozadí bez šmouh
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    entities.forEach(e => e.update());
    drawConnections();
    entities.forEach(e => e.draw());
    requestAnimationFrame(loop);
}

loop();
