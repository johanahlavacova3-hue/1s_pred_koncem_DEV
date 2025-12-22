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

// ====== TŘÍDA PRO SHLUK BODŮ ======
class ParticleCloud {
    constructor(x, y, controls, colorShift) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.controls = controls;
        this.isHugging = false;
        
        // Vytvoření nepravidelného zhluku
        this.points = [];
        const count = 400; // Počet teček v jednom zhluku
        for(let i = 0; i < count; i++) {
            this.points.push({
                ox: (Math.random() - 0.5) * 120, // Relativní offset X
                oy: (Math.random() - 0.5) * 120, // Relativní offset Y
                size: Math.random() * 2 + 0.5,
                speed: 0.02 + Math.random() * 0.05
            });
        }
    }

    update() {
        const speed = 0.6;
        const friction = 0.9;

        if (keys[this.controls.up])    this.vy -= speed;
        if (keys[this.controls.down])  this.vy += speed;
        if (keys[this.controls.left])  this.vx -= speed;
        if (keys[this.controls.right]) this.vx += speed;

        this.isHugging = keys[this.controls.hug];

        this.x += this.vx;
        this.y += this.vy;
        this.vx *= friction;
        this.vy *= friction;
    }

    draw(ctx, time) {
        const hugFactor = this.isHugging ? 0.3 : 1.0; // Při objetí se zhluk stáhne k sobě
        
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        
        this.points.forEach(p => {
            // Animace pohybu teček uvnitř zhluku (nepravidelné vlnění)
            const x = this.x + p.ox * hugFactor + Math.sin(time * p.speed + p.ox) * 10;
            const y = this.y + p.oy * hugFactor + Math.cos(time * p.speed + p.oy) * 10;
            
            // Vykreslení tečky s mírným blurem
            ctx.beginPath();
            ctx.arc(x, y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });

        // Přidání záře (glow) pro sčítání světla
        const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, 150 * (2 - hugFactor));
        grad.addColorStop(0, "rgba(255, 255, 255, 0.15)");
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.arc(this.x, this.y, 150 * (2 - hugFactor), 0, Math.PI * 2);
        ctx.fill();
    }
}

// ====== DEFINICE HRÁČŮ ======
const p1 = new ParticleCloud(canvas.width * 0.3, canvas.height / 2, {
    up: 'w', down: 's', left: 'a', right: 'd', hug: 'q'
});
const p2 = new ParticleCloud(canvas.width * 0.7, canvas.height / 2, {
    up: 'arrowup', down: 'arrowdown', left: 'arrowleft', right: 'arrowright', hug: 'p'
});

// ====== FUNKCE PRO POŘÁDNÝ GRAIN (TEXTURA) ======
function drawGrain() {
    const w = canvas.width;
    const h = canvas.height;
    const idata = ctx.createImageData(w, h);
    const buffer32 = new Uint32Array(idata.data.buffer);
    
    for (let i = 0; i < buffer32.length; i++) {
        if (Math.random() > 0.94) { // Hustota zrna
            const val = Math.random() * 50; // Síla šumu
            // Vytvoření "špinavého" pixelu (monochromatický šum)
            buffer32[i] = (val << 24) | (255 << 16) | (255 << 8) | 255;
        }
    }
    // Použijeme dočasný canvas pro vykreslení zrna přes celý obraz
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = w;
    tempCanvas.height = h;
    tempCanvas.getContext('2d').putImageData(idata, 0, 0);
    
    ctx.globalCompositeOperation = 'overlay'; // Prolnutí šumu do obrazu
    ctx.drawImage(tempCanvas, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
}

// ====== HLAVNÍ SMYČKA ======
let time = 0;
function loop() {
    // 1. Pozadí s mírným "ghosting" efektem (dozvuk)
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)"; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Sčítání světla pro zhluky (lighter blend mode)
    ctx.globalCompositeOperation = 'lighter';
    time += 0.5;

    p1.update();
    p1.draw(ctx, time);
    
    p2.update();
    p2.draw(ctx, time);

    // 3. Efekt objetí - propojení zhluků
    const dist = Math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2);
    if (p1.isHugging && p2.isHugging && dist < 400) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        ctx.lineWidth = 0.5;
        for(let i=0; i<20; i++) { // Vykreslíme 20 náhodných vláken mezi zhluky
            ctx.beginPath();
            ctx.moveTo(p1.x + (Math.random()-0.5)*100, p1.y + (Math.random()-0.5)*100);
            ctx.lineTo(p2.x + (Math.random()-0.5)*100, p2.y + (Math.random()-0.5)*100);
            ctx.stroke();
        }
    }

    // 4. Aplikace "pořádného" zrna na závěr
    drawGrain();

    requestAnimationFrame(loop);
}

loop();
