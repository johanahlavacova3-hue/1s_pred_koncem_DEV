// ==========================================
// KONFIGURACE - PROCEDURÁLNÍ BINÁRNÍ REŽIM
// ==========================================
const TRAIL_LENGTH = 10;    
const ENTITY_SIZE = 35;     // Základní měřítko postavy
const SPEED = 0.7;          // Rychlost pohybu
const FRICTION = 0.93;      
const HUG_DIST = 120;       
const NPC_COUNT = 100;      

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Ostrý look
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
        
        // Animace chůze
        this.walkCycle = Math.random() * Math.PI * 2;
        this.walkSpeed = 0.15;

        // AI
        this.moveTimer = Math.random() * 100;
        this.actionTimer = Math.random() * 200;
        this.inputX = 0;
        this.inputY = 0;
    }

    // --- VNITŘNÍ KÓDOVANÁ ANIMACE (Nahrazuje video) ---
    drawStickman(ctx, x, y, scale, t, isPlayer) {
        ctx.save();
        ctx.translate(x, y);
        
        // Barva: Hráč čistě bílá, NPC šedobílá
        ctx.fillStyle = isPlayer ? "white" : "rgba(200, 200, 200, 0.8)";
        if (this.flash > 0.1) ctx.fillStyle = "white";

        // Výpočet pohybu končetin (binární styl)
        let legMove = Math.sin(t) * 12;
        let armMove = Math.cos(t) * 8;
        let headBob = Math.abs(Math.cos(t * 2)) * 3;

        // Vše kreslíme jako "bloky" (čtverečky), aby to vypadalo jako tvoje video
        
        // Hlava
        ctx.fillRect(-4, -25 - headBob, 8, 8);
        
        // Tělo
        ctx.fillRect(-3, -18 - headBob, 6, 12);
        
        // Ruce (pokud drží Q, zvedne je)
        let hugOffset = this.isHugging ? -15 : 0;
        ctx.fillRect(-8, -16 + armMove + hugOffset, 4, 8); // Levá
        ctx.fillRect(4, -16 - armMove + hugOffset, 4, 8);  // Pravá
        
        // Nohy
        ctx.fillRect(-6, -6 + legMove, 4, 10);  // Levá
        ctx.fillRect(2, -6 - legMove, 4, 10);   // Pravá

        ctx.restore();
    }

    update() {
        let ax = 0, ay = 0;
        if (this.isPlayer) {
            if (keys['w']) ay = -1;
            if (keys['s']) ay = 1;
            if (keys['a']) ax = -1;
            if (keys['d']) ax = 1;
            if (keys['e']) this.flash = 1.5;
            this.isHugging = keys['q'];
        } else {
            this.moveTimer--;
            if (this.moveTimer <= 0) {
                this.inputX = (Math.random() * 2 - 1);
                this.inputY = (Math.random() * 2 - 1);
                this.moveTimer = Math.random() * 60 + 20;
            }
            ax = this.inputX; ay = this.inputY;
            if (Math.random() < 0.005) this.flash = 1.2;
            this.actionTimer--;
            if (this.actionTimer <= 0) {
                this.isHugging = !this.isHugging;
                this.actionTimer = Math.random() * 200 + 100;
            }
        }

        this.vx += ax * SPEED; this.vy += ay * SPEED;
        this.x += this.vx; this.y += this.vy;
        this.vx *= FRICTION; this.vy *= FRICTION;

        // Rychlost animace chůze se odvíjí od reálného pohybu
        let currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        this.walkCycle += currentSpeed * this.walkSpeed + 0.05;

        if (this.flash > 0) this.flash -= 0.05;

        // Odraz od stěn
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;

        this.history.unshift({x: this.x, y: this.y});
        if (this.history.length > TRAIL_LENGTH) this.history.pop();
    }

    draw() {
        // Stopa (digitální šum)
        this.history.forEach((pos, i) => {
            if (i % 2 === 0) {
                let op = (1 - i / TRAIL_LENGTH) * 0.2;
                ctx.fillStyle = `rgba(255, 255, 255, ${op})`;
                ctx.fillRect(Math.floor(pos.x), Math.floor(pos.y), 2, 2);
            }
        });

        // Samotná animovaná postavička
        this.drawStickman(ctx, this.x, this.y, 1, this.walkCycle, this.isPlayer);

        // Flash efekt
        if (this.flash > 0.5) {
            ctx.fillStyle = `rgba(255, 255, 255, ${this.flash * 0.3})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 30 * this.flash, 0, Math.PI*2);
            ctx.fill();
        }

        // Q (Objetí) - Čtvercový zaměřovač
        if (this.isHugging) {
            ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
            ctx.strokeRect(this.x - 20, this.y - 30, 40, 50);
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
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                }
            }
        }
    }
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 1;
    ctx.stroke();
}

function loop() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    entities.forEach(e => e.update());
    drawConnections();
    entities.forEach(e => e.draw());
    requestAnimationFrame(loop);
}

loop();
