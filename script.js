// ==========================================
// KONFIGURACE - BINÁRNÍ / AGRESIVNÍ REŽIM
// ==========================================
const TRAIL_LENGTH = 15;    
const ENTITY_SIZE = 60;     // Větší postavy pro lepší čitelnost pixelů
const SPEED = 0.6;          // Výrazně zvýšeno (původně 0.15)
const FRICTION = 0.92;      // Méně drhne, více lítají
const HUG_DIST = 130;       
const NPC_COUNT = 80;       // Sníženo pro lepší výkon při kreslení mnoha instancí videa

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Zakázání vyhlazování pro ten "pixel/binární" look
ctx.imageSmoothingEnabled = false;
ctx.mozImageSmoothingEnabled = false;
ctx.webkitImageSmoothingEnabled = false;

const video = document.createElement("video");
video.src = "maja_walk.mp4";
video.loop = true;
video.muted = true;
video.playsInline = true;

let videoReady = false;
video.oncanplay = () => videoReady = true;

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
            if (keys['e']) this.flash = 1.5; // Agresivnější záblesk
            this.isHugging = keys['q'];
        } else {
            this.moveTimer--;
            if (this.moveTimer <= 0) {
                this.inputX = (Math.random() * 2 - 1);
                this.inputY = (Math.random() * 2 - 1);
                this.moveTimer = Math.random() * 60 + 20;
            }
            ax = this.inputX; ay = this.inputY;
            
            if (Math.random() < 0.01) this.flash = 1.2;
            this.actionTimer--;
            if (this.actionTimer <= 0) {
                this.isHugging = !this.isHugging;
                this.actionTimer = Math.random() * 200 + 50;
            }
        }

        this.vx += ax * SPEED; this.vy += ay * SPEED;
        this.x += this.vx; this.y += this.vy;
        this.vx *= FRICTION; this.vy *= FRICTION;
        
        if (this.flash > 0) this.flash -= 0.05;

        // Okraje - tvrdý odraz
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1.2;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1.2;
        
        this.history.unshift({x: this.x, y: this.y});
        if (this.history.length > TRAIL_LENGTH) this.history.pop();
    }

    draw() {
        // Digitální stopa (binární čtverečky)
        this.history.forEach((pos, i) => {
            if (i % 3 === 0) { // Jen každý 3. frame stopy pro "glitch" efekt
                let op = (1 - i / TRAIL_LENGTH) * (this.isPlayer ? 0.4 : 0.1);
                ctx.fillStyle = `rgba(255, 255, 255, ${op})`;
                ctx.fillRect(Math.floor(pos.x), Math.floor(pos.y), 2, 2);
            }
        });

        let s = ENTITY_SIZE + (this.flash * 40);
        
        ctx.save();
        if (videoReady) {
            // Binární look: vysoký kontrast a žádné vyhlazování
            if (!this.isPlayer) ctx.globalAlpha = 0.6;
            
            // Při flashi (E) invertujeme barvy nebo přidáme jas
            if (this.flash > 0.5) {
                ctx.filter = `brightness(${1 + this.flash}) contrast(200%)`;
            } else if (!this.isPlayer) {
                ctx.filter = `contrast(150%) brightness(0.8)`;
            }

            // Kreslíme na celá čísla (pixel-perfect)
            ctx.drawImage(video, Math.floor(this.x - s/2), Math.floor(this.y - s/2), Math.floor(s), Math.floor(s));
        }
        ctx.restore();

        // Propojení (Q) - ostré linky
        if (this.isHugging) {
            ctx.strokeStyle = this.isPlayer ? "white" : "rgba(255,255,255,0.3)";
            ctx.lineWidth = this.isPlayer ? 2 : 1;
            ctx.strokeRect(this.x - s/2 - 5, this.y - s/2 - 5, s+10, s+10);
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
    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
    ctx.lineWidth = 0.5;
    ctx.stroke();
}

function loop() {
    // Čistě černá, žádné poloprůhledné mazání pro ostrost
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    entities.forEach(e => e.update());
    drawConnections();
    entities.forEach(e => e.draw());
    requestAnimationFrame(loop);
}

window.addEventListener('click', () => {
    video.play();
}, { once: true });

loop();
