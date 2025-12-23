// ==========================================
// KONFIGURACE (Technický Fade & Systémové Stavy)
// ==========================================

var TRAIL_LENGTH = 35;        // Délka fade stopy
var PARTICLE_SIZE = 7;        // Velikost čtverce
var SPEED = 0.75;             // Pohyb
var FRICTION = 0.89;          
var HUG_DIST = 50;            // Vzdálenost pro aktivaci objetí

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

class TechPlayer {
    constructor(x, y, controls, color) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.controls = controls; // {up, down, left, right, identify, hug}
        this.color = color;
        this.history = [];
        this.flash = 0; // Pro animaci identifikace
    }

    update() {
        // 1. Pohyb
        if (keys[this.controls.up])    this.vy -= SPEED;
        if (keys[this.controls.down])  this.vy += SPEED;
        if (keys[this.controls.left])  this.vx -= SPEED;
        if (keys[this.controls.right]) this.vx += SPEED;

        this.x += this.vx;
        this.y += this.vy;
        this.vx *= FRICTION;
        this.vy *= FRICTION;

        // 2. Stav: Identifikace (Blikání)
        if (keys[this.controls.identify]) {
            this.flash = 1.0;
        }
        if (this.flash > 0) this.flash -= 0.05;

        // 3. Historie pro fade stopu
        this.history.unshift({x: this.x, y: this.y});
        if (this.history.length > TRAIL_LENGTH) this.history.pop();
        
        this.isHugging = keys[this.controls.hug];
    }

    draw() {
        // Vykreslení stopy
        this.history.forEach((pos, index) => {
            let progress = 1 - (index / TRAIL_LENGTH);
            let size = PARTICLE_SIZE * progress;
            // Pokud hráč "bliká" pro identifikaci, stopa je jasnější
            let alpha = progress * (0.3 + this.flash * 0.7);

            ctx.fillStyle = `rgba(${this.color}, ${alpha})`;
            ctx.fillRect(pos.x - size/2, pos.y - size/2, size, size);
        });

        // Hlava objektu
        let headSize = PARTICLE_SIZE + (this.flash * 10);
        ctx.fillStyle = this.flash > 0.5 ? "white" : `rgb(${this.color})`;
        ctx.fillRect(this.x - headSize/2, this.y - headSize/2, headSize, headSize);
    }
}

// Inicializace hráčů se všemi klávesami
const p1 = new TechPlayer(window.innerWidth * 0.3, window.innerHeight * 0.5, {
    up: 'w', down: 's', left: 'a', right: 'd', identify: 'e', hug: 'q'
}, "255, 255, 255");

const p2 = new TechPlayer(window.innerWidth * 0.7, window.innerHeight * 0.5, {
    up: 'arrowup', down: 'arrowdown', left: 'arrowleft', right: 'arrowright', identify: 'o', hug: 'p'
}, "180, 180, 180");

// Hustý monochromatický grain
function drawGrain() {
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    for(let i=0; i<400; i++) {
        let x = Math.random() * canvas.width;
        let y = Math.random() * canvas.height;
        ctx.fillRect(x, y, 1, 1);
    }
}

function loop() {
    // Černé pozadí (bez stopy, tu dělá pole history)
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    p1.update();
    p2.update();

    // Logika objetí (když jsou blízko a oba drží hug klávesu)
    let dist = Math.sqrt((p1.x-p2.x)**2 + (p1.y-p2.y)**2);
    if (dist < HUG_DIST && p1.isHugging && p2.isHugging) {
        // Vizuální propojení - linka mezi středy
        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
        ctx.setLineDash([2, 4]); // Technická přerušovaná čára
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    p1.draw();
    p2.draw();
    
    drawGrain();
    requestAnimationFrame(loop);
}

loop();
