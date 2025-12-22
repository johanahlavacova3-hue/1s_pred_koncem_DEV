const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Přizpůsobení velikosti okna
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

// ====== OVLÁDÁNÍ (Klávesnice) ======
const keys = {};

window.addEventListener("keydown", (e) => {
    keys[e.key.toLowerCase()] = true; // Ukládáme stisknuté klávesy
    // Pro šipky (ArrowUp atd.)
    keys[e.key] = true; 
});

window.addEventListener("keyup", (e) => {
    keys[e.key.toLowerCase()] = false;
    keys[e.key] = false;
});

// ====== NASTAVENÍ HRÁČŮ ======
class Player {
    constructor(x, y, controls) {
        this.x = x;
        this.y = y;
        this.vx = 0; // Rychlost X
        this.vy = 0; // Rychlost Y
        this.radius = 50; // Základní velikost aury
        this.controls = controls; // Mapování kláves {up, down, left, right, hug}
        this.isHugging = false;
        this.pulsePhase = Math.random() * Math.PI; // Každý má jiný rytmus
    }

    update() {
        // 1. Získání vstupu
        const speed = 0.5; // Zrychlení
        const friction = 0.92; // Tření (aby pohyb "plaval")

        if (keys[this.controls.up])    this.vy -= speed;
        if (keys[this.controls.down])  this.vy += speed;
        if (keys[this.controls.left])  this.vx -= speed;
        if (keys[this.controls.right]) this.vx += speed;

        // Kontrola tlačítka "Objetí"
        this.isHugging = keys[this.controls.hug];

        // 2. Fyzika (Setrvačnost)
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= friction;
        this.vy *= friction;

        // Odrážení od stěn (volitelné, aby neutekli)
        if (this.x < 0) this.x = 0;
        if (this.x > canvas.width) this.x = canvas.width;
        if (this.y < 0) this.y = 0;
        if (this.y > canvas.height) this.y = canvas.height;
    }

    draw(ctx, time) {
        // Simulace tepu: Pokud drží objetí, tep se zrychlí a zesílí
        const pulseSpeed = this.isHugging ? 0.2 : 0.05;
        const pulseIntensity = this.isHugging ? 40 : 10;
        
        // Sinusovka pro dýchání (velikost aury)
        const breathe = Math.sin(time * 5 + this.pulsePhase) * pulseIntensity;
        
        const currentRadius = this.radius + breathe + (this.isHugging ? 60 : 0);

        // Vykreslení "Aury" (Gradient místo pevného tvaru)
        // Toto vytváří ten "rozmazaný" efekt
        const gradient = ctx.createRadialGradient(this.x, this.y, 5, this.x, this.y, currentRadius * 4);
        
        // Barva: Bílá s různou průhledností. 
        // Díky 'lighter' blend mode se středy rozzáří do běla.
        const alpha = this.isHugging ? 0.8 : 0.4;
        
        gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);   // Střed
        gradient.addColorStop(0.2, `rgba(200, 200, 255, ${alpha * 0.5})`); // Záře
        gradient.addColorStop(0.5, `rgba(100, 100, 150, ${alpha * 0.1})`); // Okraj
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");             // Ztraceno do tmy

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentRadius * 4, 0, Math.PI * 2);
        ctx.fill();

        // Jádro (tenká linka nebo kruhy jako na rentgenu)
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        // Nakreslíme pár soustředných kruhů (interference)
        for(let i=1; i<4; i++) {
             ctx.arc(this.x, this.y, currentRadius * i * 0.3, 0, Math.PI * 2);
        }
        ctx.stroke();
    }
}

// ====== DEFINICE HRÁČŮ ======
const p1 = new Player(window.innerWidth / 3, window.innerHeight / 2, {
    up: 'w', down: 's', left: 'a', right: 'd', hug: 'q'
});

const p2 = new Player(window.innerWidth / 3 * 2, window.innerHeight / 2, {
    up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', hug: 'p'
});


// ====== EFEKT ZRNO (GRAIN) ======
// Vytvoříme si off-screen canvas pro šum, abychom ho nepočítali v každém framu znovu (optimalizace)
const noiseCanvas = document.createElement('canvas');
const noiseCtx = noiseCanvas.getContext('2d');
function generateNoise() {
    noiseCanvas.width = window.innerWidth;
    noiseCanvas.height = window.innerHeight;
    const w = noiseCanvas.width;
    const h = noiseCanvas.height;
    const idata = noiseCtx.createImageData(w, h);
    const buffer32 = new Uint32Array(idata.data.buffer);
    const len = buffer32.length;

    for (let i = 0; i < len; i++) {
        if (Math.random() < 0.1) { // 10% pixelů bude šum
            // Bílá barva s velmi malou alfa (průhledností)
            // 0xAAFFFFFF = Alpha AA (cca 60%), BGR = FFFFFF
            // Zde použijeme malou alfu, např 15 (cca 8%) -> 0x15FFFFFF
            buffer32[i] = 0x10FFFFFF; 
        }
    }
    noiseCtx.putImageData(idata, 0, 0);
}
// Pře-generovat šum při změně velikosti
window.addEventListener("resize", generateNoise);
generateNoise();


// ====== HLAVNÍ SMYČKA ======
let time = 0;

function loop() {
    // 1. Clear s efektem stopy (Motion Blur)
    // Místo úplného smazání vykreslíme poloprůhlednou černou.
    // Tím staré polohy pomalu "vyhasínají".
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = "rgba(0, 0, 0, 0.15)"; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Nastavení pro "Sčítání světla" (Monochromatický Blur efekt)
    ctx.globalCompositeOperation = 'lighter'; 

    time += 0.01;

    // 3. Update a Draw Hráčů
    p1.update();
    p2.update();

    // Vykreslení hráčů
    p1.draw(ctx, time);
    p2.draw(ctx, time);

    // 4. Interakce mezi hráči (Vlnění při spojení)
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    const dist = Math.sqrt(dx*dx + dy*dy);

    // Pokud jsou blízko A OBA drží "Objetí" (Q + P), vznikne spojení
    if (dist < 300 && p1.isHugging && p2.isHugging) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
        ctx.lineWidth = 2 + Math.random() * 3; // "Elektrický" efekt
        
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        
        // Křivka mezi nimi (ne rovná čára, ale organická)
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        // Náhodný jitter pro efekt energie
        ctx.quadraticCurveTo(midX + (Math.random()-0.5)*50, midY + (Math.random()-0.5)*50, p2.x, p2.y);
        ctx.stroke();

        // Extra záře uprostřed (interference)
        const gradient = ctx.createRadialGradient(midX, midY, 0, midX, midY, 100);
        gradient.addColorStop(0, "white");
        gradient.addColorStop(1, "transparent");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(midX, midY, 100, 0, Math.PI*2);
        ctx.fill();
    }

    // 5. Aplikace šumu (Grain) přes všechno
    ctx.globalCompositeOperation = 'source-over';
    // Šum vykreslíme s náhodným posunem, aby "šuměl"
    ctx.drawImage(noiseCanvas, (Math.random()-0.5)*10, (Math.random()-0.5)*10);

    requestAnimationFrame(loop);
}

loop();
