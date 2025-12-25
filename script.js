// ==========================================
// KONFIGURACE (Technický Fade & Systémové Stavy)
// ==========================================

var TRAIL_LENGTH = 20;        // Mírně zkráceno pro optimalizaci při 130 lidech
var PARTICLE_SIZE = 5;        // Menší velikost pro dav
var SPEED = 0.75;             // Rychlost hráče
var NPC_SPEED = 0.4;          // Rychlost NPC (trochu pomalejší)
var FRICTION = 0.92;          // Setrvačnost
var HUG_DIST = 60;            // Vzdálenost pro interakci
var NPC_COUNT = 130;          // Počet NPC

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
        this.vx = (Math.random() - 0.5) * 2; // Náhodný startovní pohyb
        this.vy = (Math.random() - 0.5) * 2;
        this.isPlayer = isPlayer;
        
        // Barva: Hráč je bílý, NPC jsou šedivější
        this.color = isPlayer ? "255, 255, 255" : "100, 100, 100"; 
        
        this.history = [];
        this.flash = 0; 
        
        // Náhodný čítač pro NPC, aby neměnili směr každý frame
        this.changeDirTimer = Math.random() * 100;
    }

    update() {
        // --- 1. Logika Pohybu ---
        
        if (this.isPlayer) {
            // OVLÁDÁNÍ HRÁČE
            if (keys['w']) this.vy -= SPEED;
            if (keys['s']) this.vy += SPEED;
            if (keys['a']) this.vx -= SPEED;
            if (keys['d']) this.vx += SPEED;

            // Identifikace (E)
            if (keys['e']) this.flash = 1.0;
        } else {
            // AI POHYB PRO NPC
            // Občas jemně změní směr
            this.changeDirTimer--;
            if (this.changeDirTimer <= 0) {
                this.vx += (Math.random() - 0.5) * 0.5;
                this.vy += (Math.random() - 0.5) * 0.5;
                this.changeDirTimer = Math.random() * 50 + 20;
            }
            
            // Limit rychlosti pro NPC
            this.vx = Math.max(Math.min(this.vx, NPC_SPEED * 2), -NPC_SPEED * 2);
            this.vy = Math.max(Math.min(this.vy, NPC_SPEED * 2), -NPC_SPEED * 2);

            // NPC se odráží od stěn, aby neutekli
            if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
            if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
        }

        // Aplikace fyziky
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= FRICTION;
        this.vy *= FRICTION;

        // Blikání (postupné zhasínání)
        if (this.flash > 0) this.flash -= 0.05;

        // --- 2. Historie pro stopu ---
        this.history.unshift({x: this.x, y: this.y});
        if (this.history.length > TRAIL_LENGTH) this.history.pop();
    }

    draw() {
        // Vykreslení stopy
        this.history.forEach((pos, index) => {
            let progress = 1 - (index / TRAIL_LENGTH);
            let size = PARTICLE_SIZE * progress;
            // Pokud je to NPC, stopa je velmi slabá, aby nebyl chaos
            let baseAlpha = this.isPlayer ? 0.3 : 0.05; 
            let alpha = progress * (baseAlpha + this.flash * 0.7);

            ctx.fillStyle = `rgba(${this.color}, ${alpha})`;
            ctx.fillRect(pos.x - size/2, pos.y - size/2, size, size);
        });

        // Hlava objektu
        let headSize = PARTICLE_SIZE + (this.flash * 10);
        
        // Hráč svítí víc než NPC
        if (this.isPlayer) {
             ctx.fillStyle = this.flash > 0.5 ? "white" : `rgb(${this.color})`;
        } else {
             // NPC jsou trochu tlumené
             ctx.fillStyle = `rgba(${this.color}, 0.6)`;
        }
       
        ctx.fillRect(this.x - headSize/2, this.y - headSize/2, headSize, headSize);
    }
}

// --- Inicializace ---

// 1. Vytvoření Hrdiny (uprostřed)
const hero = new TechEntity(window.innerWidth / 2, window.innerHeight / 2, true);

// 2. Vytvoření NPC davu
const npcs = [];
for (let i = 0; i < NPC_COUNT; i++) {
    let x = Math.random() * window.innerWidth;
    let y = Math.random() * window.innerHeight;
    npcs.push(new TechEntity(x, y, false));
}

// Efekt zrnění
function drawGrain() {
    ctx.fillStyle = "rgba(255,255,255,0.03)";
    for(let i=0; i<600; i++) { // Trochu víc zrnění
        let x = Math.random() * canvas.width;
        let y = Math.random() * canvas.height;
        ctx.fillRect(x, y, 1, 1);
    }
}

function loop() {
    // Černé pozadí
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update a vykreslení NPC
    npcs.forEach(npc => {
        npc.update();
        
        // Logika "Propojení": Pokud je hrdina blízko NPC a zmáčkne 'E' (Identify/Flash), spojí se linkou
        let dist = Math.sqrt((hero.x - npc.x)**2 + (hero.y - npc.y)**2);
        if (dist < HUG_DIST && hero.flash > 0.1) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${hero.flash})`; // Síla čáry podle bliknutí
            ctx.beginPath();
            ctx.moveTo(hero.x, hero.y);
            ctx.lineTo(npc.x, npc.y);
            ctx.stroke();
            
            // NPC také trochu "odpoví" bliknutím
            npc.flash = 0.5;
        }

        npc.draw();
    });

    // Update a vykreslení Hrdiny (až nakonec, aby byl "nad" NPC)
    hero.update();
    hero.draw();
    
    drawGrain();
    requestAnimationFrame(loop);
}

loop();
