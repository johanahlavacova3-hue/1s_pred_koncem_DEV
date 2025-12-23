// ==========================================
// KONFIGURACE (Zde ovládáš všechno)
// ==========================================

var PARTICLE_COUNT = 600;      // Počet zrnek (vysoký počet = hustý mrak)
var BASE_RADIUS = 110;         // Základní velikost
var SHAPE_WILDNESS = 1.2;      // Jak moc může tvar "ulétávat" do stran (0 = kruh, 2 = chaos)

// Vzhled (Estetika rentgenu/prachu)
var DOT_SIZE = 1.5;            // Velikost zrnka
var OPACITY = 0.6;             // Průhlednost
var GRAIN_DENSITY = 0.12;      // Hustota šumu na pozadí

// Pohyb
var SPEED = 0.6;               // Rychlost pohybu hráče
var FRICTION = 0.92;           // Setrvačnost
var MORPH_SPEED = 0.03;        // Jak rychle se tvar "přelévá" v čase

// ==========================================
// JÁDRO JEDNOTLIVÝCH SHLUKŮ
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

class ParticleCloud {
    constructor(x, y, controls) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.controls = controls;
        this.particles = [];
        
        // Vytvoření "DNA" tvaru - náhodné body po obvodu
        this.shapeDNA = Array.from({length: 12}, () => Math.random() * SHAPE_WILDNESS);
        
        for(let i = 0; i < PARTICLE_COUNT; i++) {
            let angle = Math.random() * Math.PI * 2;
            
            // Výpočet poloměru na základě DNA tvaru (interpolace mezi body)
            let dnaIndex = Math.floor((angle / (Math.PI * 2)) * this.shapeDNA.length);
            let noiseFactor = this.shapeDNA[dnaIndex];
            
            // Náhodný rozptyl uvnitř nepravidelného tvaru
            let dist = Math.sqrt(Math.random()) * BASE_RADIUS * (1 + noiseFactor);

            this.particles.push({
                angle: angle,
                dist: dist,
                size: Math.random() * DOT_SIZE,
                // Každá částice má vlastní rychlost "vibrace"
                driftSeed: Math.random() * 100,
                driftSpeed: 0.01 + Math.random() * 0.04
            });
        }
    }

    update() {
        if (keys[this.controls.up])    this.vy -= SPEED;
        if (keys[this.controls.down])  this.vy += SPEED;
        if (keys[this.controls.left])  this.vx -= SPEED;
        if (keys[this.controls.right]) this.vx += SPEED;

        this.x += this.vx;
        this.y += this.vy;
        this.vx *= FRICTION;
        this.vy *= FRICTION;
        this.isHugging = keys[this.controls.hug];
    }

    draw(time) {
        let compress = this.isHugging ? 0.2 : 1.0;
        ctx.fillStyle = `rgba(255, 255, 255, ${OPACITY})`;

        this.particles.forEach(p => {
            // Dynamické přelévání tvaru v čase (každá tečka trochu jinak)
            let wave = Math.sin(time * p.driftSpeed + p.driftSeed) * 15;
            
            let currentDist = (p.dist + wave) * compress;
            let targetX = this.x + Math.cos(p.angle) * currentDist;
            let targetY = this.y + Math.sin(p.angle) * currentDist;

            // Vykreslení zrnka prachu
            ctx.fillRect(targetX, targetY, p.size, p.size);
        });
    }
}

// Inicializace
const p1 = new ParticleCloud(window.innerWidth * 0.3, window.innerHeight * 0.5, { 
    up: 'w', down: 's', left: 'a', right: 'd', hug: 'q' 
});
const p2 = new ParticleCloud(window.innerWidth * 0.7, window.innerHeight * 0.5, { 
    up: 'arrowup', down: 'arrowdown', left: 'arrowleft', right: 'arrowright', hug: 'p' 
});

function drawGrain() {
    const imgData = ctx.createImageData(canvas.width, canvas.height);
    const data = new Uint32Array(imgData.data.buffer);
    for (let i = 0; i < data.length; i++) {
        if (Math.random() < GRAIN_DENSITY) {
            // Špinavé zrno (mix šedé)
            let v = Math.random() * 40;
            data[i] = (v << 24) | 0xFFFFFF;
        }
    }
    const temp = document.createElement('canvas');
    temp.width = canvas.width;
    temp.height = canvas.height;
    temp.getContext('2d').putImageData(imgData, 0, 0);
    ctx.globalCompositeOperation = "overlay";
    ctx.drawImage(temp, 0, 0);
    ctx.globalCompositeOperation = "source-over";
}

let t = 0;
function loop() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    t++;
    p1.update();
    p2.update();
    p1.draw(t);
    p2.draw(t);
    
    drawGrain();
    requestAnimationFrame(loop);
}

loop();
