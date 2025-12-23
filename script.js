// ==========================================
// KONFIGURACE (Totální nepravidelnost)
// ==========================================

var PARTICLE_COUNT = 900;     // Hodně teček pro texturu prachu
var NOISE_SCALE = 0.005;      // Jak moc jsou "chuchvalce" velké
var MAX_DIST = 150;           // Maximální rozptyl od středu

// VZHLED (Drsné zrno)
var DOT_SIZE = 1.6;           
var OPACITY = 0.5;            
var GRAIN_STRENGTH = 40;      

// POHYB
var SPEED = 0.7;
var FRICTION = 0.90;
var CHAOS_STRENGTH = 25;      // Jak moc se tvar trhá a deformuje

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

class IrregularCloud {
    constructor(x, y, controls) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.controls = controls;
        this.particles = [];
        
        // Unikátní "otisk" pro tento shluk, aby nebyl stejný jako druhý
        this.seed = Math.random() * 1000;

        for(let i = 0; i < PARTICLE_COUNT; i++) {
            // Náhodné umístění, které budeme deformovat
            let angle = Math.random() * Math.PI * 2;
            let radius = Math.random() * MAX_DIST;
            
            this.particles.push({
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius,
                size: Math.random() * DOT_SIZE,
                // Individuální neklid každé částice
                pSeed: Math.random() * 50 
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
        let hug = this.isHugging ? 0.3 : 1.0;
        ctx.fillStyle = `rgba(255, 255, 255, ${OPACITY})`;

        this.particles.forEach(p => {
            // Vytváření organických deformací pomocí vln (simulace šumu)
            // Toto rozbíjí jakýkoliv náznak kruhu nebo mřížky
            let nX = (p.x + this.x) * NOISE_SCALE;
            let nY = (p.y + this.y) * NOISE_SCALE;
            
            let noiseX = Math.sin(nX * 10 + time * 0.02 + this.seed) * CHAOS_STRENGTH;
            let noiseY = Math.cos(nY * 10 + time * 0.03 + p.pSeed) * CHAOS_STRENGTH;

            let finalX = this.x + (p.x + noiseX) * hug;
            let finalY = this.y + (p.y + noiseY) * hug;

            // Kreslíme nepravidelné zrnko
            ctx.fillRect(finalX, finalY, p.size, p.size);
        });
    }
}

// Inicializace hráčů
const p1 = new IrregularCloud(window.innerWidth * 0.3, window.innerHeight * 0.5, { 
    up: 'w', down: 's', left: 'a', right: 'd', hug: 'q' 
});
const p2 = new IrregularCloud(window.innerWidth * 0.7, window.innerHeight * 0.5, { 
    up: 'arrowup', down: 'arrowdown', left: 'arrowleft', right: 'arrowright', hug: 'p' 
});

// Funkce pro drsnou texturu (Grain)
function applyGrain() {
    ctx.globalCompositeOperation = "overlay";
    for(let i = 0; i < 5; i++) { // Několik vrstev šumu pro "špinavý" vzhled
        ctx.fillStyle = `rgba(${Math.random()*255}, ${Math.random()*255}, ${Math.random()*255}, 0.03)`;
        ctx.fillRect(Math.random()*canvas.width, Math.random()*canvas.height, 2, 2);
    }
    ctx.globalCompositeOperation = "source-over";
}

let t = 0;
function loop() {
    // Čisté černé pozadí pro vyniknutí textury
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    t++;
    p1.update();
    p2.update();
    
    p1.draw(t);
    p2.draw(t);
    
    applyGrain();
    requestAnimationFrame(loop);
}

loop();
