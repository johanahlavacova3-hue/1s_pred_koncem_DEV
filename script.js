// ==========================================
// KONFIGURACE PRO EFEKT "MLHY"
// ==========================================

var NPC_COUNT = 400;          // Výrazně víc teček pro efekt mlhy
var PARTICLE_SIZE = 3;        // Menší tečky
var TRAIL_LENGTH = 15;        // Kratší stopa, aby se mlha nerozmazávala moc
var SPEED = 0.4;              // Rychlost hráče
var FRICTION = 0.94;          
var HUG_DIST = 80;            

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
        
        // Fialová mlha (velmi nízká alfa pro efekt vrstvení)
        this.baseColor = isPlayer ? "255, 255, 255" : "160, 140, 255"; 
        this.history = [];
        
        // AI parametry pro shlukování
        this.angle = Math.random() * Math.PI * 2;
    }

    update() {
        let accX = 0;
        let accY = 0;

        if (this.isPlayer) {
            if (keys['w']) accY = -1;
            if (keys['s']) accY = 1;
            if (keys['a']) accX = -1;
            if (keys['d']) accX = 1;
        } else {
            // NPC se drží v "mraku" - gravitace směrem ke středu obrazovky
            let centerX = canvas.width / 2;
            let centerY = canvas.height / 2;
            
            // Jemný tah ke středu, aby se nerozprchli
            accX = (centerX - this.x) * 0.0001 + (Math.random() - 0.5) * 0.2;
            accY = (centerY - this.y) * 0.0001 + (Math.random() - 0.5) * 0.2;
        }

        this.vx += accX * SPEED;
        this.vy += accY * SPEED;
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= FRICTION;
        this.vy *= FRICTION;

        this.history.unshift({x: this.x, y: this.y});
        if (this.history.length > TRAIL_LENGTH) this.history.pop();
    }

    draw() {
        // Vykreslení historie jako jemný mrak
        this.history.forEach((pos, index) => {
            let progress = 1 - (index / TRAIL_LENGTH);
            // Velmi nízká průhlednost (0.05) vytvoří efekt mlhy při překrytí více teček
            let alpha = progress * (this.isPlayer ? 0.4 : 0.08);

            ctx.fillStyle = `rgba(${this.baseColor}, ${alpha})`;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, PARTICLE_SIZE * progress, 0, Math.PI * 2);
            ctx.fill();
        });
    }
}

const entities = [];
const player = new TechEntity(window.innerWidth/2, window.innerHeight/2, true);
entities.push(player);

// Inicializace NPC do jednoho hustého mraku
for (let i = 0; i < NPC_COUNT; i++) {
    // Náhodné umístění v kruhu kolem středu (hustý start)
    let dist = Math.pow(Math.random(), 0.5) * 150; 
    let ang = Math.random() * Math.PI * 2;
    entities.push(new TechEntity(
        window.innerWidth / 2 + Math.cos(ang) * dist,
        window.innerHeight / 2 + Math.sin(ang) * dist,
        false
    ));
}

function loop() {
    // Aby mlha zářila, nepoužijeme úplně čisté mazání, ale necháme tam "ghosting"
    ctx.fillStyle = "rgba(0, 0, 0, 0.15)"; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    entities.forEach(e => {
        e.update();
        e.draw();
    });

    requestAnimationFrame(loop);
}

loop();
