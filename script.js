// ==========================================
// KONFIGURACE - VIDEO REŽIM
// ==========================================
const TRAIL_LENGTH = 30;    
const ENTITY_WIDTH = 40;    // Šířka videa na obrazovce
const ENTITY_HEIGHT = 40;   // Výška videa na obrazovce
const SPEED = 0.15;         
const FRICTION = 0.96;      
const HUG_DIST = 110;       
const NPC_COUNT = 130;

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// --- Příprava Videa ---
const videoSource = document.createElement("video");
videoSource.src = "maja_wakl.mp4";
videoSource.loop = true;
videoSource.muted = true;
videoSource.play().catch(e => console.log("Čekám na interakci uživatele pro spuštění videa..."));

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
        this.color = isPlayer ? "255, 255, 255" : "120, 120, 120";
        this.history = [];
        this.flash = 0; 
        this.isHugging = false;

        this.moveTimer = Math.random() * 200;
        this.actionTimer = Math.random() * 400;
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
            if (keys['e']) this.flash = 1.0;
            this.isHugging = keys['q'];
        } else {
            this.moveTimer--;
            if (this.moveTimer <= 0) {
                if (Math.random() < 0.5) {
                    this.inputX = 0; this.inputY = 0;
                } else {
                    this.inputX = (Math.random() * 2 - 1);
                    this.inputY = (Math.random() * 2 - 1);
                }
                this.moveTimer = Math.random() * 200 + 100;
            }
            ax = this.inputX;
            ay = this.inputY;

            if (Math.random() < 0.002) this.flash = 1.0;
            this.actionTimer--;
            if (this.actionTimer <= 0) {
                this.isHugging = !this.isHugging;
                this.actionTimer = Math.random() * 400 + 200;
            }

            if (this.x < 100) this.vx += 0.1;
            if (this.x > canvas.width - 100) this.vx -= 0.1;
            if (this.y < 100) this.vy += 0.1;
            if (this.y > canvas.height - 100) this.vy -= 0.1;
        }

        this.vx += ax * SPEED;
        this.vy += ay * SPEED;
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= FRICTION;
        this.vy *= FRICTION;

        if (this.flash > 0) this.flash -= 0.02;

        this.history.unshift({x: this.x, y: this.y});
        if (this.history.length > TRAIL_LENGTH) this.history.pop();
    }

    draw() {
        // Stopa (v dálce jen tečky pro výkon)
        this.history.forEach((pos, i) => {
            let ratio = (1 - i / TRAIL_LENGTH);
            let opacity = ratio * (this.isPlayer ? 0.3 : 0.1);
            ctx.fillStyle = `rgba(${this.color}, ${opacity + this.flash * 0.4})`;
            ctx.fillRect(pos.x - 1, pos.y - 1, 2, 2);
        });

        // Vykreslení VIDEA místo čtverečku
        let s = ENTITY_WIDTH + (this.flash * 20);
        let h = ENTITY_HEIGHT + (this.flash * 20);

        ctx.save();
        // Pokud je to NPC, uděláme ho trochu průhlednější nebo tmavší
        if (!this.isPlayer) {
            ctx.globalAlpha = 0.7;
            // Volitelně: ctx.filter = "grayscale(100%)"; // Pokud chceš NPC černobíle
        }

        // Efekt záře při E
        if (this.flash > 0.1) {
            ctx.shadowBlur = 20 * this.flash;
            ctx.shadowColor = "white";
        }

        // Vykreslení aktuálního frame z videa
        ctx.drawImage(videoSource, this.x - s/2, this.y - h/2, s, h);
        ctx.restore();

        // Indikátor Q (Objetí)
        if (this.isHugging) {
            ctx.strokeStyle = this.isPlayer ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.2)";
            ctx.setLineDash([2, 2]);
            ctx.beginPath();
            ctx.arc(this.x, this.y, s * 0.8, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }
}

// --- Start ---
const entities = [];
for(let i=0; i<NPC_COUNT; i++) {
    entities.push(new TechEntity(Math.random()*canvas.width, Math.random()*canvas.height));
}
const player = new TechEntity(canvas.width/2, canvas.height/2, true);
entities.push(player);

function drawConnections() {
    for (let i = 0; i < entities.length; i++) {
        for (let j = i + 1; j < entities.length; j++) {
            let a = entities[i];
            let b = entities[j];
            if (a.isHugging && b.isHugging) {
                let d = Math.hypot(a.x - b.x, a.y - b.y);
                if (d < HUG_DIST) {
                    let alpha = (1 - d/HUG_DIST) * (a.isPlayer || b.isPlayer ? 0.8 : 0.3);
                    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
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

// Spuštění po kliknutí (prohlížeče vyžadují interakci pro video)
window.addEventListener('click', () => {
    videoSource.play();
    loop();
}, { once: true });

// Pokud uživatel neklikne, zkusíme spustit aspoň loop
loop();
