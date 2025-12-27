// ==========================================
// KONFIGURACE
// ==========================================

var NPC_COUNT = 150;          
var PARTICLE_SIZE = 3;        
var SPEED = 0.1;             
var FRICTION = 0.90;          
var HUG_DIST = 10;           // OPRAVENO: Zvětšeno z 10 na 100 pro viditelný efekt
var TRAIL_LENGTH = 5;        

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
        this.flash = 0;      // Logika pro klávesu E
        this.mistSize = 1.0; 
        
        // AI Logika
        this.inputX = 0; this.inputY = 0;
        this.moveTimer = 0;
        this.hugTimer = Math.random() * 200; 
    }

    update() {
        let accX = 0, accY = 0;

        if (this.isPlayer) {
            // POHYB
            if (keys['w']) accY = -1;
            if (keys['s']) accY = 1;
            if (keys['a']) accX = -1;
            if (keys['d']) accX = 1;
            
            // SIGNÁLY (Q a E)
            this.isHugging = keys['q'];      // Držení Q roztahuje mlhu
            if (keys['e']) this.flash = 1.0; // Stisknutí E vyvolá bliknutí
        } else {
            // AI CHOVÁNÍ (Nezkušený hráč)
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

            // Náhodné blikání NPC
            if (Math.random() < 0.005) this.flash = 1.0;

            // Náhodné zkoušení objetí (Q)
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

        // Postupné zhasínání flash efektu (E)
        if (this.flash > 0) this.flash -= 0.04;

        // Plynulý návrat velikosti mlhy
        if (this.mistSize > 1.0) this.mistSize -= 0.08;

        this.history.unshift({x: this.x, y: this.y});
        if (this.history.length > TRAIL_LENGTH) this.history.pop();
    }

    draw() {
        this.history.forEach((pos, index) => {
            let progress = 1 - (index / TRAIL_LENGTH);
            
            // Výpočet velikosti: základní + roztažení (Q) + bliknutí (E)
            let currentSize = PARTICLE_SIZE * progress * (this.mistSize + this.flash * 2); 
            
            // Výpočet jasu: základní + bliknutí (E)
            let alpha = ((progress * 0.3) / this.mistSize) + (this.flash * progress * 0.5);

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
    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // LOGIKA PROPOJENÍ MLH
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
                let dist = Math.sqrt(distSq);
                let strength = 1 - (dist / HUG_DIST);
                
                // Obě mlhy se zvětší (roztáhnou k sobě)
                e1.mistSize = Math.max(e1.mistSize, 1 + strength * 2.5);
                e2.mistSize = Math.max(e2.mistSize, 1 + strength * 2.5);
                
                // Jiskření mezi nimi
                if (Math.random() > 0.4) {
                    ctx.fillStyle = `rgba(255, 255, 255, ${strength})`;
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
