// ==========================================
// KONFIGURACE
// ==========================================

var TRAIL_LENGTH = 20;        
var PARTICLE_SIZE = 6;        
var SPEED = 0.2;             
var FRICTION = 0.90;          
var HUG_DIST = 100;            // Mírně zvětšený dosah
var NPC_COUNT = 150;          

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

class TechEntity {
    constructor(x, y, isPlayer = false) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.isPlayer = isPlayer;
        this.baseColor = "255, 255, 255"; 
        this.history = [];
        this.flash = 0;      
        this.isHugging = false; 
        
        // AI logika nezkušeného hráče
        this.inputX = 0; 
        this.inputY = 0;
        this.moveTimer = 0;
        this.hugTimer = Math.random() * 200; 
    }

    update() {
        let accX = 0, accY = 0;

        if (this.isPlayer) {
            if (keys['w']) accY = -1;
            if (keys['s']) accY = 1;
            if (keys['a']) accX = -1;
            if (keys['d']) accX = 1;
            if (keys['e']) this.flash = 1.0; 
            this.isHugging = keys['q'];      
        } else {
            this.moveTimer--;
            if (this.moveTimer <= 0) {
                this.inputX = Math.random() < 0.2 ? 0 : Math.floor(Math.random() * 3) - 1;
                this.inputY = Math.random() < 0.2 ? 0 : Math.floor(Math.random() * 3) - 1;
                this.moveTimer = Math.random() * 40 + 10;
            }
            if (this.x < 30) this.inputX = 1;
            if (this.x > canvas.width - 30) this.inputX = -1;
            if (this.y < 30) this.inputY = 1;
            if (this.y > canvas.height - 30) this.inputY = -1;
            accX = this.inputX; accY = this.inputY;

            if (Math.random() < 0.008) this.flash = 0.8;
            this.hugTimer--;
            if (this.hugTimer <= 0) {
                this.isHugging = !this.isHugging; 
                this.hugTimer = Math.random() * 120 + 30;
            }
        }

        this.vx += accX * SPEED;
        this.vy += accY * SPEED;
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= FRICTION;
        this.vy *= FRICTION;

        if (this.flash > 0) this.flash -= 0.04;
        this.history.unshift({x: this.x, y: this.y});
        if (this.history.length > TRAIL_LENGTH) this.history.pop();
    }

    draw() {
        this.history.forEach((pos, index) => {
            let progress = 1 - (index / TRAIL_LENGTH);
            let size = PARTICLE_SIZE * progress; 
            ctx.fillStyle = `rgba(255, 255, 255, ${progress * 0.2})`;
            ctx.fillRect(pos.x - size/2, pos.y - size/2, size, size);
        });

        let headSize = PARTICLE_SIZE + (this.flash * 8);
        ctx.fillStyle = "white";
        ctx.fillRect(this.x - headSize/2, this.y - headSize/2, headSize, headSize);
    }
}

const entities = [];
entities.push(new TechEntity(window.innerWidth/2, window.innerHeight/2, true));
for (let i = 0; i < NPC_COUNT; i++) {
    entities.push(new TechEntity(Math.random() * canvas.width, Math.random() * canvas.height, false));
}

function loop() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    entities.forEach(e => e.update());

    // --- VÝRAZNÉ SPOJENÍ ---
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
                // 1. Vnější záře (Glow)
                ctx.shadowBlur = 15;
                ctx.shadowColor = "white";
                ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(e1.x, e1.y);
                ctx.lineTo(e2.x, e2.y);
                ctx.stroke();

                // 2. Hlavní jasná linka
                ctx.shadowBlur = 0; 
                ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
                ctx.lineWidth = 1.5;
                ctx.stroke();

                // 3. Jiskry mezi hráči
                if (Math.random() > 0.7) {
                    let t = Math.random();
                    let jx = e1.x + dx * t;
                    let jy = e1.y + dy * t;
                    ctx.fillStyle = "white";
                    ctx.fillRect(jx - 1, jy - 1, 2, 2);
                }
                
                // Mírné buzení flash efektu při aktivním spojení
                e1.flash = Math.max(e1.flash, 0.2);
                e2.flash = Math.max(e2.flash, 0.2);
            }
        }
    }

    entities.forEach(e => e.draw());
    requestAnimationFrame(loop);
}

loop();
