// ==========================================
// KONFIGURACE
// ==========================================
const TRAIL_LENGTH = 20;
const PARTICLE_SIZE = 6;
const SPEED = 0.3;          // Pomalý, plynulý pohyb
const FRICTION = 0.94;
const HUG_DIST = 100;       // Větší dosah pro spojení
const NPC_COUNT = 130;

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
        this.color = isPlayer ? "255, 255, 255" : "150, 150, 150";
        this.history = [];
        
        this.flash = 0; 
        this.isHugging = false;

        // AI mozek
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
            
            // Signál a Objetí pro hráče
            if (keys['e']) this.flash = 1.0;
            this.isHugging = keys['q'];
        } else {
            // NPC Logika pohybu
            this.moveTimer--;
            if (this.moveTimer <= 0) {
                this.inputX = Math.floor(Math.random() * 3) - 1;
                this.inputY = Math.floor(Math.random() * 3) - 1;
                this.moveTimer = Math.random() * 100 + 50;
            }
            ax = this.inputX;
            ay = this.inputY;

            // NPC náhodné akce
            if (Math.random() < 0.005) this.flash = 1.0; // Náhodné E
            
            this.actionTimer--;
            if (this.actionTimer <= 0) {
                this.isHugging = !this.isHugging; // Náhodné přepnutí Q
                this.actionTimer = Math.random() * 300 + 100;
            }

            // Hranice obrazovky
            if (this.x < 50) this.vx += 0.5;
            if (this.x > canvas.width - 50) this.vx -= 0.5;
            if (this.y < 50) this.vy += 0.5;
            if (this.y > canvas.height - 50) this.vy -= 0.5;
        }

        this.vx += ax * SPEED;
        this.vy += ay * SPEED;
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= FRICTION;
        this.vy *= FRICTION;

        if (this.flash > 0) this.flash -= 0.04;

        this.history.unshift({x: this.x, y: this.y});
        if (this.history.length > TRAIL_LENGTH) this.history.pop();
    }

    draw() {
        // Vykreslení stopy
        this.history.forEach((pos, i) => {
            let opacity = (1 - i/TRAIL_LENGTH) * (this.isPlayer ? 0.4 : 0.15);
            ctx.fillStyle = `rgba(${this.color}, ${opacity + this.flash * 0.5})`;
            ctx.fillRect(pos.x - 2, pos.y - 2, 4, 4);
        });

        // Hlavní čtvereček (při E se zvětší)
        let s = PARTICLE_SIZE + (this.flash * 15);
        ctx.fillStyle = this.flash > 0.1 ? `rgba(255,255,255,${this.flash})` : `rgb(${this.color})`;
        ctx.fillRect(this.x - s/2, this.y - s/2, s, s);

        // Vizuální indikace Q (Objetí)
        if (this.isHugging) {
            ctx.strokeStyle = this.isPlayer ? "white" : "rgba(255,255,255,0.3)";
            ctx.beginPath();
            ctx.arc(this.x, this.y, 12, 0, Math.PI*2);
            ctx.stroke();
        }
    }
}

const entities = [];
for(let i=0; i<NPC_COUNT; i++) entities.push(new TechEntity(Math.random()*canvas.width, Math.random()*canvas.height));
const player = new TechEntity(canvas.width/2, canvas.height/2, true);
entities.push(player);

function drawConnections() {
    ctx.lineWidth = 2;
    for (let i = 0; i < entities.length; i++) {
        for (let j = i + 1; j < entities.length; j++) {
            let a = entities[i];
            let b = entities[j];
            if (a.isHugging && b.isHugging) {
                let d = Math.hypot(a.x - b.x, a.y - b.y);
                if (d < HUG_DIST) {
                    ctx.strokeStyle = `rgba(255, 255, 255, ${1 - d/HUG_DIST})`;
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.stroke();
                }
            }
        }
    }
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
