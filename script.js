// ==========================================
// KONFIGURACE
// ==========================================

var TRAIL_LENGTH = 30;        // Délka stopy
var PARTICLE_SIZE = 6;        // Velikost čtverce
var SPEED = 0.35;             // VÝRAZNĚ ZPOMALENO (původně 0.8)
var FRICTION = 0.93;          // Větší klouzavost (původně 0.91) - plavou v prostoru
var HUG_DIST = 70;            // Vzdálenost, na kterou se spojí čára
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

// Klávesy
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
        
        // Barva
        this.baseColor = isPlayer ? "255, 255, 255" : "180, 180, 180"; 
        this.history = [];
        
        // Stavy
        this.flash = 0;      // E (Identify) - 0.0 až 1.0
        this.isHugging = false; // Q (Hug) - true/false
        
        // --- AI LOGIKA (Mozek NPC) ---
        this.inputX = 0; 
        this.inputY = 0;
        this.moveTimer = 0;
        this.hugTimer = Math.random() * 500; // Každý má jiný cyklus nálady na objetí
    }

    update() {
        // --- 1. OVLÁDÁNÍ / AI ---
        let accX = 0;
        let accY = 0;

        if (this.isPlayer) {
            // HRÁČ: Poslouchá reálnou klávesnici
            if (keys['w']) accY = -1;
            if (keys['s']) accY = 1;
            if (keys['a']) accX = -1;
            if (keys['d']) accX = 1;

            // Akce
            if (keys['e']) this.flash = 1.0; // Bliknutí
            this.isHugging = keys['q'];      // Držení objetí
        } 
        else {
            // NPC: Simulace chování
            
            // a) Pohyb (WASD)
            this.moveTimer--;
            if (this.moveTimer <= 0) {
                // 40% šance, že nic nedělá (jen pluje), 60% že změní směr
                if (Math.random() < 0.4) {
                    this.inputX = 0; this.inputY = 0;
                } else {
                    this.inputX = Math.floor(Math.random() * 3) - 1; 
                    this.inputY = Math.floor(Math.random() * 3) - 1; 
                }
                // Odrážení od krajů, aby neutekli pryč
                if (this.x < 50) this.inputX = 1;
                if (this.x > canvas.width - 50) this.inputX = -1;
                if (this.y < 50) this.inputY = 1;
                if (this.y > canvas.height - 50) this.inputY = -1;

                this.moveTimer = Math.random() * 80 + 30; // Nové rozhodnutí za chvíli
            }
            accX = this.inputX;
            accY = this.inputY;

            // b) Blikání (E) - Náhodně občas bliknou
            if (Math.random() < 0.003) { // Malá šance každý frame
                this.flash = 1.0;
            }

            // c) Objetí (Q) - NPC střídá stavy, kdy "chce" a "nechce"
            this.hugTimer--;
            if (this.hugTimer <= 0) {
                this.isHugging = !this.isHugging; // Přepne stav
                // Pokud zapne hug, drží ho kratší dobu (cca 2-3s), pauza je delší
                this.hugTimer = this.isHugging ? (Math.random() * 150 + 50) : (Math.random() * 500 + 200);
            }
        }

        // --- 2. FYZIKA ---
        this.vx += accX * SPEED;
        this.vy += accY * SPEED;
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= FRICTION;
        this.vy *= FRICTION;

        // Blikání mizí
        if (this.flash > 0) this.flash -= 0.03;

        // --- 3. STOPA ---
        this.history.unshift({x: this.x, y: this.y});
        if (this.history.length > TRAIL_LENGTH) this.history.pop();
    }

    draw() {
        // Vykreslení stopy
        this.history.forEach((pos, index) => {
            let progress = 1 - (index / TRAIL_LENGTH);
            let size = PARTICLE_SIZE * progress;
            // Výpočet průhlednosti: NPC jsou méně výrazná, ale pokud bliknou (E), září
            let baseAlpha = this.isPlayer ? 0.4 : 0.15;
            let flashBonus = this.flash * 0.6; 
            let alpha = progress * (baseAlpha + flashBonus);

            ctx.fillStyle = `rgba(${this.baseColor}, ${alpha})`;
            ctx.fillRect(pos.x - size/2, pos.y - size/2, size, size);
        });

        // Vykreslení hlavy
        let headSize = PARTICLE_SIZE + (this.flash * 8);
        
        // Barva hlavy (pokud bliká, jde do bíla)
        ctx.fillStyle = this.flash > 0.5 ? "white" : `rgb(${this.baseColor})`;
        ctx.fillRect(this.x - headSize/2, this.y - headSize/2, headSize, headSize);

        // INDIKACE OBJETÍ (Q)
        // Pokud entita drží Q, má kolem sebe tenký kroužek
        if (this.isHugging) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 + Math.random()*0.1})`; // Jemně problikává
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 15, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
}

// --- Inicializace ---

const entities = [];

// Přidáme hráče (index 0)
const player = new TechEntity(window.innerWidth/2, window.innerHeight/2, true);
entities.push(player);

// Přidáme NPC
for (let i = 0; i < NPC_COUNT; i++) {
    entities.push(new TechEntity(
        Math.random() * window.innerWidth,
        Math.random() * window.innerHeight,
        false
    ));
}

// Zrnění
function drawGrain() {
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    for(let i=0; i<400; i++) {
        ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1, 1);
    }
}

function loop() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 1. Update všech
    entities.forEach(e => e.update());

    // 2. Vykreslení spojení (Logic Hug)
    // Procházíme entity a hledáme páry, co jsou blízko a oba drží Q
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 1;
    
    // Optimalizovaný cyklus (nekontroluje každého s každým dvakrát)
    for (let i = 0; i < entities.length; i++) {
        let e1 = entities[i];
        if (!e1.isHugging) continue; // Pokud první nedrží Q, nezajímá nás

        for (let j = i + 1; j < entities.length; j++) {
            let e2 = entities[j];
            if (!e2.isHugging) continue; // Pokud druhý nedrží Q, nezajímá nás

            // Změření vzdálenosti
            let dx = e1.x - e2.x;
            let dy = e1.y - e2.y;
            let distSq = dx*dx + dy*dy; // Používáme mocninu pro rychlost (odmocnina je drahá)

            if (distSq < HUG_DIST * HUG_DIST) {
                // JSOU BLÍZKO A OBA DRŽÍ Q -> SPOJIT
                ctx.beginPath();
                ctx.moveTo(e1.x, e1.y);
                ctx.lineTo(e2.x, e2.y);
                ctx.stroke();
                
                // Malý efekt, že se "našli" - oba trochu probliknou
                if (e1.flash < 0.2) e1.flash += 0.05;
                if (e2.flash < 0.2) e2.flash += 0.05;
            }
        }
    }

    // 3. Vykreslení entit
    entities.forEach(e => e.draw());

    // Indikátor, kdo jsi ty (malá tečka navíc nad hráčem, volitelné)
    /*
    ctx.fillStyle = "red";
    ctx.fillRect(player.x - 1, player.y - 10, 2, 2);
    */

    drawGrain();
    requestAnimationFrame(loop);
}

loop();
