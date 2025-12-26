// ==========================================
// KONFIGURACE
// ==========================================

var NPC_COUNT = 130;          
var PARTICLE_SIZE = 5;        
var SPEED = 0.1;             
var FRICTION = 0.90;          
var HUG_DIST = 10;           // Vzdálenost, kdy se mraky začnou natahovat k sobě
var TRAIL_LENGTH = 15;        

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
        this.history = [];
        this.isHugging = false; 
        this.mistSize = 1.0; // Koeficient roztažení mlhy
        
        // AI Logika nezkušeného hráče
        this.inputX = 0; this.inputY = 0;
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

        // Resetování velikosti mlhy pro plynulý návrat
        if (this.mistSize > 1.0) this.mistSize -= 0.05;

        this.history.unshift({x: this.x, y: this.y});
        if (this.history.length > TRAIL_LENGTH) this.history.pop();
    }

    draw() {
        this.history.forEach((pos, index) => {
            let progress = 1 - (index / TRAIL_LENGTH);
            // Čím víc je entita v "objetí", tím větší a rozmazanější jsou čtverečky
            let currentSize = PARTICLE_SIZE * progress * this.mistSize; 
            
            // Efekt prolnutí (nižší alpha při roztažení)
            let alpha = (progress * 0.3) / this.mistSize;

            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.fillRect(pos.x - currentSize/2, pos.y - currentSize/2, currentSize, currentSize);
        });
    }
}

const entities = [];
entities.push(new TechEntity(window.innerWidth/2, window.innerHeight/2, true));
for (let i = 0; i < NPC_COUNT; i++) {
    entities.push(new TechEntity(Math.random() * canvas.width, Math.random() * canvas.height, false));
}

function loop() {
    // Používáme mírný fade efekt pro pocit husté mlhy
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Detekce blízkosti pro "množení" mlhy
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
                // Místo čáry zvětšíme mraky obou entit
                let boost = (1 - (Math.sqrt(distSq) / HUG_DIST)) * 3;
                e1.mistSize = Math.max(e1.mistSize, 1 + boost);
                e2.mistSize = Math.max(e2.mistSize, 1 + boost);
                
                // Přidáme náhodné "pixelové jiskry" mezi nimi pro efekt tření mlhy
                if (Math.random() > 0.5) {
                    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
                    ctx.fillRect(e1.x - dx*Math.random(), e1.y - dy*Math.random(), 2, 2);
                }
            }
        }
    }

    entities.forEach(e => {
        e.update();
        e.draw();
    });

    requestAnimationFrame(loop);
}

loop();
