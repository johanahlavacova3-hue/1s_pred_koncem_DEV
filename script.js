// ==========================================
// KONFIGURACE
// ==========================================
const NPC_COUNT = 130;
const PIXELS_PER_ENTITY = 12; // Kolik "teček" tvoří mlhu jednoho hráče
const MIST_SPREAD = 15;       // Jak moc je mlha rozptýlená kolem středu entity
const PIXEL_SIZE = 2;         // Velikost jednoho pixelu mlhy
const SPEED = 0.35;
const FRICTION = 0.93;
const TRAIL_LENGTH = 10;      // Délka stopy každého pixelu

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
        this.baseColor = isPlayer ? "255, 255, 255" : "180, 160, 255";
        
        // Vytvoření vnitřních pixelů mlhy pro tuto entitu
        this.pixels = [];
        for (let i = 0; i < PIXELS_PER_ENTITY; i++) {
            this.pixels.push({
                offX: (Math.random() - 0.5) * MIST_SPREAD,
                offY: (Math.random() - 0.5) * MIST_SPREAD,
                history: []
            });
        }

        // AI logika
        this.inputX = 0;
        this.inputY = 0;
        this.moveTimer = 0;
    }

    update() {
        let accX = 0, accY = 0;

        if (this.isPlayer) {
            if (keys['w']) accY = -1;
            if (keys['s']) accY = 1;
            if (keys['a']) accX = -1;
            if (keys['d']) accX = 1;
        } else {
            this.moveTimer--;
            if (this.moveTimer <= 0) {
                this.inputX = Math.random() < 0.4 ? 0 : Math.floor(Math.random() * 3) - 1;
                this.inputY = Math.random() < 0.4 ? 0 : Math.floor(Math.random() * 3) - 1;
                this.moveTimer = Math.random() * 80 + 30;
            }
            // Odrážení od krajů
            if (this.x < 50) this.inputX = 1;
            if (this.x > canvas.width - 50) this.inputX = -1;
            if (this.y < 50) this.inputY = 1;
            if (this.y > canvas.height - 50) this.inputY = -1;
            accX = this.inputX;
            accY = this.inputY;
        }

        this.vx += accX * SPEED;
        this.vy += accY * SPEED;
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= FRICTION;
        this.vy *= FRICTION;

        // Aktualizace pixelů mlhy
        this.pixels.forEach(p => {
            // Pixely jemně vibrují kolem středu entity
            p.offX += (Math.random() - 0.5) * 2;
            p.offY += (Math.random() - 0.5) * 2;
            // Návratová síla k centru entity
            p.offX *= 0.95;
            p.offY *= 0.95;

            p.history.unshift({ x: this.x + p.offX, y: this.y + p.offY });
            if (p.history.length > TRAIL_LENGTH) p.history.pop();
        });
    }

    draw() {
        this.pixels.forEach(p => {
            p.history.forEach((pos, index) => {
                let progress = 1 - (index / TRAIL_LENGTH);
                let alpha = progress * (this.isPlayer ? 0.6 : 0.3);
                ctx.fillStyle = `rgba(${this.baseColor}, ${alpha})`;
                // Kreslíme čtverečky (pixely)
                ctx.fillRect(pos.x, pos.y, PIXEL_SIZE, PIXEL_SIZE);
            });
        });
    }
}

const entities = [];
entities.push(new TechEntity(window.innerWidth / 2, window.innerHeight / 2, true));

for (let i = 0; i < NPC_COUNT; i++) {
    entities.push(new TechEntity(Math.random() * canvas.width, Math.random() * canvas.height, false));
}

function loop() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    entities.forEach(e => {
        e.update();
        e.draw();
    });

    requestAnimationFrame(loop);
}
loop();
