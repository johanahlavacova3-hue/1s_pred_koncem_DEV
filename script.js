// ==========================================
// KONFIGURACE
// ==========================================

var TRAIL_LENGTH = 25;        
var PARTICLE_SIZE = 7;        
var SPEED = 0.45;             // Mírně rychlejší pro pocit zmatenosti
var FRICTION = 0.90;          // Menší klouzavost, víc "zasekaný" pohyb
var HUG_DIST = 85;            // Větší dosah pro spojení
var NPC_COUNT = 130;          

// ==========================================
// JÁDRO PROGRAMU
// ==========================================

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
        
        // VŠE STEJNĚ BÍLÉ
        this.baseColor = "255, 255, 255"; 
        this.history = [];
        
        this.flash = 0;      
        this.isHugging = false; 
        
        // AI LOGIKA - NEZKUŠENÝ HRÁČ
        this.inputX = 0; 
        this.inputY = 0;
        this.moveTimer = 0;
        this.hugTimer = Math.random() * 200; 
    }

    update() {
        let accX = 0;
        let accY = 0;

        if (this.isPlayer) {
            if (keys['w']) accY = -1;
            if (keys['s']) accY = 1;
            if (keys['a']) accX = -1;
            if (keys['d']) accX = 1;
            if (keys['e']) this.flash = 1.0; 
            this.isHugging = keys['q'];      
        } 
        else {
            // NPC - CHOVÁNÍ ZAČÁTEČNÍKA
            this.moveTimer--;
            if (this.moveTimer <= 0) {
                // Často dělají chyby nebo se zastavují
                if (Math.random() < 0.2) {
                    this.inputX = 0; this.inputY = 0;
                } else {
                    // Trhaný pohyb do stran
                    this.inputX = Math.floor(Math.random() * 3) - 1; 
                    this.inputY = Math.floor(Math.random() * 3) - 1; 
                }
                this.moveTimer = Math.random() * 40 + 10; // Častější změny směru než profík
            }
            
            // Odrážení od krajů
            if (this.x < 30) this.inputX = 1;
            if (this.x > canvas.width - 30) this.inputX = -1;
            if (this.y < 30) this.inputY = 1;
            if (this.y > canvas.height - 30) this.inputY = -1;

            accX = this.inputX;
            accY = this.inputY;

            // Častější náhodné blikání (hledají se)
            if (Math.random() < 0.01) this.flash = 1.0;

            // Často zmateně zapínají a vypínají Q
            this.hugTimer--;
            if (this.hugTimer <= 0) {
                this.isHugging = !this.isHugging; 
                this.hugTimer = Math.random() * 100 + 20;
            }
        }

        this.vx += accX * SPEED;
        this.vy += accY * SPEED;
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= FRICTION;
        this.vy *= FRICTION;

        if (this.flash > 0) this.flash -= 0.05;

        this.history.unshift({x: this.x, y: this.y});
        if (this.history.length > TRAIL_LENGTH) this.history.pop();
    }

    draw() {
        // STOPA - ČTVERCE
        this.history.forEach((pos, index) => {
            let progress = 1 - (index / TRAIL_LENGTH);
            let size = PARTICLE_SIZE * progress; 
            let alpha = progress * (this.isPlayer ? 0.4 : 0.2);

            ctx.fillStyle = `rgba(${this.baseColor}, ${alpha})`;
            ctx.fillRect(pos.x - size/2, pos.y - size/2, size, size);
        });

        // HLAVA - ČTVEREC
        let headSize = PARTICLE_SIZE + (this.flash * 6);
        ctx.fillStyle = `rgba(${this.baseColor}, ${this.isPlayer ? 1.0 : 0.8})`;
        ctx.fillRect(this.x - headSize/2, this.y - headSize/2, headSize, headSize);

        // INDIKACE DRŽENÍ Q (Jemný čtvercový obrys)
        if (this.isHugging) {
            ctx.strokeStyle = `rgba(255, 255, 255, 0.2)`; 
            ctx.strokeRect(this.x - 12, this.y - 12, 24, 24);
        }
    }
}

const entities = [];
const player = new TechEntity(window.innerWidth/2, window.innerHeight/2, true);
entities.push(player);

for (let i = 0; i < NPC_COUNT; i++) {
    entities.push(new TechEntity(Math.random() * canvas.width, Math.random() * canvas.height, false));
}

function drawGrain() {
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    for(let i=0; i<300; i++) {
        ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1, 1);
    }
}

function loop() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    entities.forEach(e => e.update());

    // VÝRAZNĚJŠÍ SPOJENÍ (OBJETÍ)
    ctx.lineWidth = 2; // Tlustší čára
    
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
                // Jasná bílá čára
                ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
                ctx.beginPath();
                ctx.moveTo(e1.x, e1.y);
                ctx.lineTo(e2.x, e2.y);
                ctx.stroke();
                
                // Efekt propojení - oba se rozzáří
                if (e1.flash < 0.3) e1.flash += 0.02;
                if (e2.flash < 0.3) e2.flash += 0.02;
            }
        }
    }

    entities.forEach(e => e.draw());
    drawGrain();
    requestAnimationFrame(loop);
}

loop();
