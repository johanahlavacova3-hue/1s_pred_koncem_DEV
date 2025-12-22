const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// ====== DŮLEŽITÉ PROMĚNNÉ PRO LADĚNÍ (BIO DATA) ======
// Později sem napojíš data z mobilu/senzoru.
let simulace = {
    heartRate: 60,       // Tep za minutu (ovlivňuje rychlost pulzování)
    isHugging: false,    // Pokud true, aktivuje se animace objetí
    playerX: 0,          // Pozice hráče (simulováno myší)
    playerY: 0
};

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

// ====== KONFIGURACE ČÁSTIC ======
const COLS = 40;  // Počet sloupců
const ROWS = 40;  // Počet řádků
const GAP = 25;   // Rozestup v klidovém stavu
const particles = [];

// Pomocná funkce pro plynulý přechod (Linear Interpolation)
// Tohle dělá ten "minimax" efekt - hledání cesty mezi A a B
const lerp = (start, end, factor) => start + (end - start) * factor;

// Inicializace částic
function initParticles() {
    particles.length = 0;
    const startX = (canvas.width - COLS * GAP) / 2;
    const startY = (canvas.height - ROWS * GAP) / 2;

    for (let ix = 0; ix < COLS; ix++) {
        for (let iy = 0; iy < ROWS; iy++) {
            particles.push({
                // Původní mřížková pozice (HOME)
                gridX: startX + ix * GAP,
                gridY: startY + iy * GAP,
                
                // Aktuální pozice (kde tečka zrovna je)
                x: startX + ix * GAP,
                y: startY + iy * GAP,
                
                // Náhodný offset pro organický vzhled při objetí
                noiseX: (Math.random() - 0.5) * 300,
                noiseY: (Math.random() - 0.5) * 300,
                
                // Základní velikost
                baseRadius: 2 + Math.random() * 4
            });
        }
    }
}

// Simulace interakce (Myš = Pohyb hráče, Klik = Objetí)
window.addEventListener("mousemove", (e) => {
    simulace.playerX = e.clientX;
    simulace.playerY = e.clientY;
});
window.addEventListener("mousedown", () => simulace.isHugging = true);
window.addEventListener("mouseup", () => simulace.isHugging = false);


// ====== HLAVNÍ SMYČKA ======
let time = 0;

function update() {
    // 1. Nastavení pozadí (černá, mírně průhledná pro efekt stopy/duchů)
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)"; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Rychlost tepu převedená na čas (čím vyšší tep, tím rychlejší čas)
    const beatSpeed = simulace.heartRate / 60 * 0.05;
    time += beatSpeed;

    // Simulace tlukotu srdce (sinusovka s ostrým náběhem)
    // Vytváří efekt "bumbum... bumbum..."
    const heartBeat = Math.pow(Math.sin(time), 30) * (simulace.isHugging ? 1.5 : 0.5); 

    particles.forEach(p => {
        let targetX, targetY;

        if (simulace.isHugging) {
            // === STAV OBJETÍ (CLUSTER) ===
            // Částice se ignorují mřížku a letí ke středu (nebo k sobě), 
            // inspirováno obrázkem 2 (bílý shluk) a 4 (Chladni).
            
            // Cíl je střed plátna + trochu náhody (noise)
            targetX = (canvas.width / 2) + p.noiseX;
            targetY = (canvas.height / 2) + p.noiseY;

            // Při objetí se barva mění na intenzivní bílou/růžovou
            ctx.fillStyle = `hsl(${320 - heartBeat * 50}, 80%, ${60 + heartBeat * 40}%)`;

        } else {
            // === KLIDOVÝ STAV (GRID) ===
            // Částice drží mřížku, ale reagují na pohyb "hráče" (myši)
            // Inspirováno obrázkem 1 a 3.
            
            targetX = p.gridX;
            targetY = p.gridY;

            // Efekt: Pokud je hráč blízko, mřížka se trochu ohne
            const distDx = simulace.playerX - p.x;
            const distDy = simulace.playerY - p.y;
            const dist = Math.sqrt(distDx*distDx + distDy*distDy);
            
            if (dist < 200) {
                targetX -= distDx * 0.1; // Odtlačení
                targetY -= distDy * 0.1;
            }

            // Barva v klidu (studenější, modro-fialová)
            // Velikost se mění podle vlny (jako tvůj první kód)
            const wave = Math.sin(p.gridX * 0.05 + time) + Math.sin(p.gridY * 0.05 + time);
            const hue = 220 + wave * 40; 
            ctx.fillStyle = `hsl(${hue}, 60%, 50%)`;
        }

        // === FYZIKA (MINIMAX POHYB) ===
        // Plynulý přesun z aktuální pozice (x) na cílovou (targetX)
        // Faktor 0.05 znamená, že se každým snímkem posune o 5% blíže k cíli (tlumený pohyb)
        p.x = lerp(p.x, targetX, 0.08);
        p.y = lerp(p.y, targetY, 0.08);

        // Tep srdce ovlivňuje velikost tečky
        const radiusNoise = Math.sin(time + p.gridX); // Každá tečka pulzuje trochu jinak
        let currentRadius = p.baseRadius + (heartBeat * 5) + radiusNoise;
        
        // Vykreslení
        ctx.beginPath();
        if (currentRadius > 0) {
            ctx.arc(p.x, p.y, currentRadius, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    requestAnimationFrame(update);
}

// Spustit
initParticles();
update();
