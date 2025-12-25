// ==========================================
// KONFIGURACE
// ==========================================

var TRAIL_LENGTH = 25;        // Délka stopy (stejná pro všechny)
var PARTICLE_SIZE = 6;        // Velikost
var SPEED = 0.8;              // Síla akcelerace (stejná pro všechny)
var FRICTION = 0.91;          // Klouzavost (stejná pro všechny)
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

// Klávesy pro hráče
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
        
        // Hráč je čistě bílý, NPC jsou skoro stejné, jen miniaturně šedší, aby se hráč našel
        this.color = isPlayer ? "255, 255, 255" : "200, 200, 200"; 
        
        this.history = [];
        
        // --- AI LOGIKA PRO NPC (Virtuální ovladač) ---
        // inputX/Y simuluje, jako by NPC drželo klávesu (-1 = vlevo/nahoru, 1 = vpravo/dolů, 0 = nic)
        this.inputX = 0; 
        this.inputY = 0;
        this.aiTimer = 0; // Odpočet do změny rozhodnutí
    }

    update() {
        // 1. ZÍSKÁNÍ VSTUPU (Input)
        let accX = 0;
        let accY = 0;

        if (this.isPlayer) {
            // -- Hráč: poslouchá klávesnici --
            if (keys['w']) accY = -1;
            if (keys['s']) accY = 1;
            if (keys['a']) accX = -1;
            if (keys['d']) accX = 1;
        } else {
            // -- NPC: poslouchá svůj "mozek" --
            this.aiTimer--;
            
            // Každých pár snímků (náhodně 20 až 80) změní NPC své "klávesy"
            if (this.aiTimer <= 0) {
                // Rozhodování:
                // 30% šance, že pustí klávesy a jen klouže (jako hráč)
                // 70% šance, že vybere nový směr
                if (Math.random() < 0.3) {
                    this.inputX = 0;
                    this.inputY = 0;
                } else {
                    this.inputX = Math.floor(Math.random() * 3) - 1; // -1, 0, nebo 1
                    this.inputY = Math.floor(Math.random() * 3) - 1; 
                }
                
                // Ochrana proti útěku z obrazovky:
                // Pokud je moc u kraje, "zmáčkne" klávesu na druhou stranu
                if (this.x < 50) this.inputX = 1;
                if (this.x > canvas.width - 50) this.inputX = -1;
                if (this.y < 50) this.inputY = 1;
                if (this.y > canvas.height - 50) this.inputY = -1;

                this.aiTimer = Math.random() * 60 + 20;
            }
            accX = this.inputX;
            accY = this.inputY;
        }

        // 2. APLIKACE FYZIKY (Identická pro všechny)
        // Přičteme rychlost podle "stisknutých kláves"
        this.vx += accX * SPEED;
        this.vy += accY * SPEED;

        // Pohyb
        this.x += this.vx;
        this.y += this.vy;

        // Tření (Friction) - tohle dělá ten "floaty" pocit
        this.vx *= FRICTION;
        this.vy *= FRICTION;

        // 3. STOPA (Identická pro všechny)
        this.history.unshift({x: this.x, y: this.y});
        if (this.history.length > TRAIL_LENGTH) this.history.pop();
    }

    draw() {
        // Vykreslení stopy
        this.history.forEach((pos, index) => {
            let progress = 1 - (index / TRAIL_LENGTH);
            let size = PARTICLE_SIZE * progress;
            // NPC mají stopu malinko průhlednější, aby se to dalo vykreslit (performance)
            // Ale chovají se vizuálně stejně
            let alpha = progress * (this.isPlayer ? 0.4 : 0.15);

            ctx.fillStyle = `rgba(${this.color}, ${alpha})`;
            ctx.fillRect(pos.x - size/2, pos.y - size/2, size, size);
        });

        // Hlava
        ctx.fillStyle = `rgb(${this.color})`;
        ctx.fillRect(this.x - PARTICLE_SIZE/2, this.y - PARTICLE_SIZE/2, PARTICLE_SIZE, PARTICLE_SIZE);
    }
}

// --- Inicializace ---

const hero = new TechEntity(window.innerWidth / 2, window.innerHeight / 2, true);

const npcs = [];
for (let i = 0; i < NPC_COUNT; i++) {
    // Náhodná pozice startu
    let x = Math.random() * window.innerWidth;
    let y = Math.random() * window.innerHeight;
    npcs.push(new TechEntity(x, y, false));
}

// Jemný šum
function drawGrain() {
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    for(let i=0; i<500; i++) {
        let x = Math.random() * canvas.width;
        let y = Math.random() * canvas.height;
        ctx.fillRect(x, y, 1, 1);
    }
}

function loop() {
    // Pozadí
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update NPC
    npcs.forEach(npc => {
        npc.update();
        npc.draw();
    });

    // Update Hráče (kreslíme ho posledního, aby byl nahoře)
    hero.update();
    hero.draw();
    
    // Zvýraznění hráče - malý kroužek kolem něj, abys věděl, který jsi ty v tom davu
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.beginPath();
    ctx.arc(hero.x, hero.y, 20, 0, Math.PI*2);
    ctx.stroke();

    drawGrain();
    requestAnimationFrame(loop);
}

loop();
