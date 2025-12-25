// ==========================================
// KONFIGURACE - EXTRÉMNĚ POMALÝ REŽIM
// ==========================================
const TRAIL_LENGTH = 40;    // Delší stopa pro plynulejší vizuál
const PARTICLE_SIZE = 5;
const SPEED = 0.15;         // Výrazně zpomalená akcelerace
const FRICTION = 0.96;      // Velmi vysoké tření - objekty skoro hned zastaví, když se nepohnou
const HUG_DIST = 110;       // Velký dosah pro spojení
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
        // Hráč čistě bílá, NPC tlumená šedá
        this.color = isPlayer ? "255, 255, 255" : "120, 120, 120";
        this.history = [];
        
        this.flash = 0; 
        this.isHugging = false;

        // "Pomalý mozek" NPC
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
            // NPC: Mnohem méně časté změny směru
            this.moveTimer--;
            if (this.moveTimer <= 0) {
                // 50% šance, že se úplně zastaví a odpočívá
                if (Math.random() < 0.5) {
                    this.inputX = 0;
                    this.inputY = 0;
                } else {
                    this.inputX = (Math.random() * 2 - 1);
                    this.inputY = (Math.random() * 2 - 1);
                }
                this.moveTimer = Math.random() * 200 + 100;
            }
            ax = this.inputX;
            ay = this.inputY;

            // Náhodné signály (E) - velmi vzácné, aby vynikly
            if (Math.random() < 0.002) this.flash = 1.0;
            
            // Náhodné nálady na objetí (Q)
            this.actionTimer--;
            if (this.actionTimer <= 0) {
                this.isHugging = !this.isHugging;
                this.actionTimer = Math.random() * 400 + 200;
            }

            // Jemné odpuzování od stěn
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

        // Pomalé dohasínání signálu
        if (this.flash > 0) this.flash -= 0.02;

        this.history.unshift({x: this.x, y: this.y});
        if (this.history.length > TRAIL_LENGTH) this.history.pop();
    }

    draw() {
        // Vykreslení stopy (jemnější)
        this.history.forEach((pos, i) => {
            let ratio = (1 - i / TRAIL_LENGTH);
            let opacity = ratio * (this.isPlayer ? 0.3 : 0.1);
            ctx.fillStyle = `rgba(${this.color}, ${opacity + this.flash * 0.4})`;
            let size = this.isPlayer ? 3 : 2;
            ctx.fillRect(pos.x - size/2, pos.y - size/2, size, size);
        });

        // Tělo entity
        // Při signálu (E) se entita rozzáří a zvětší
        let s = PARTICLE_SIZE + (this.flash * 12);
        if (this.flash > 0.1) {
            ctx.fillStyle = `rgba(255, 255, 255, ${this.flash})`;
            ctx.shadowBlur = 15 * this.flash;
            ctx.shadowColor = "white";
        } else {
            ctx.fillStyle = `rgb(${this.color})`;
            ctx.shadowBlur = 0;
        }
        ctx.fillRect(this.x - s/2, this.y - s/2, s, s);
        ctx.shadowBlur = 0; // Reset stínu pro ostatní vykreslování

        // Indikátor Q (Objetí) - kroužek
        if (this.isHugging) {
            ctx.strokeStyle = this.isPlayer ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.2)";
            ctx.setLineDash([2, 2]);
            ctx.beginPath();
            ctx.arc(this.x, this.y, 15, 0, Math.PI * 2);
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
                    // Jasnější čára, pokud je jedním z nich hráč
                    let alpha = (1 - d/HUG_DIST) * (a.isPlayer || b.isPlayer ? 0.8 : 0.3);
                    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
                    ctx.lineWidth = a.isPlayer || b.isPlayer ? 1.5 : 0.5;
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
