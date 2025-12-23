// ==========================================
// KONFIGURACE (Organický & Šumivý styl)
// ==========================================

var TRAIL_LENGTH = 45;         
var PARTICLE_SIZE = 12;        
var SPEED = 0.6;              
var FRICTION = 0.92;          
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

class BioPlayer {
    constructor(x, y, controls, color) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.controls = controls; 
        this.color = color; // Formát "255, 255, 255"
        this.history = [];
        this.pulse = 0;
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

        this.pulse += 0.05;

        this.history.unshift({x: this.x, y: this.y});
        if (this.history.length > TRAIL_LENGTH) this.history.pop();
        
        this.isHugging = keys[this.controls.hug];
    }

    draw() {
        // Vykreslení organické stopy (jako na obr. 2)
        this.history.forEach((pos, index) => {
            let progress = 1 - (index / TRAIL_LENGTH);
            let size = PARTICLE_SIZE * progress * (1 + Math.sin(this.pulse + index * 0.1) * 0.1);
            let alpha = progress * 0.4;

            ctx.beginPath();
            ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${this.color}, ${alpha})`;
            ctx.fill();

            // Přidání jemného šumu do stopy (jako na obr. 3)
            if (index % 3 === 0) {
                this.drawGrainPoint(pos.x, pos.y, size);
            }
        });

        // Hlava - zářící koule
        ctx.beginPath();
        ctx.arc(this.x, this.y, PARTICLE_SIZE * 1.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgb(${this.color})`;
        ctx.fill();
    }

    drawGrainPoint(x, y, radius) {
        for (let i = 0; i < 5; i++) {
            let angle = Math.random() * Math.PI * 2;
            let r = Math.random() * radius;
            let gx = x + Math.cos(angle) * r;
            let gy = y + Math.sin(angle) * r;
            ctx.fillStyle = "rgba(0,0,0,0.5)";
            ctx.fillRect(gx, gy, 1, 1);
        }
    }
}

const p1 = new BioPlayer(window.innerWidth * 0.3, window.innerHeight * 0.5, {
    up: 'w', down: 's', left: 'a', right: 'd', hug: 'q'
}, "240, 240, 230");

const p2 = new BioPlayer(window.innerWidth * 0.7, window.innerHeight * 0.5, {
    up: 'arrowup', down: 'arrowdown', left: 'arrowleft', right: 'arrowright', hug: 'p'
}, "200, 200, 200");

// Celoplošný šum (Background Grain)
function drawGlobalGrain() {
    ctx.fillStyle = "rgba(255,255,255,0.03)";
    for(let i=0; i<800; i++) {
        let x = Math.random() * canvas.width;
        let y = Math.random() * canvas.height;
        ctx.fillRect(x, y, 1, 1);
    }
}

function loop() {
    ctx.fillStyle = "#0a0a0a"; // Téměř černá
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    p1.update();
    p2.update();

    // Logika propojení - REZONANCE (inspirováno obr. 1)
    let dist = Math.sqrt((p1.x-p2.x)**2 + (p1.y-p2.y)**2);
    if (dist < HUG_DIST * 2) {
        let opacity = 1 - (dist / (HUG_DIST * 2));
        
        // Vykreslení soustředných kruhů mezi nimi
        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.2})`;
        ctx.lineWidth = 1;
        for (let i = 1; i < 4; i++) {
            ctx.beginPath();
            ctx.arc(p1.x + (p2.x - p1.x) * 0.5, p1.y + (p2.y - p1.y) * 0.5, 
                    (dist * 0.3) * i, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    p1.draw();
    p2.draw();
    
    drawGlobalGrain();
    requestAnimationFrame(loop);
}

loop();
