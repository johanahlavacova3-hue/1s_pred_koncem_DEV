const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

// ====== NASTAVENÍ (TADY SI HRAJEŠ SE VZHLEDEM) ======
const GAP = 20;           // Rozestup mezi tečkami (menší číslo = hustší mřížka)
const MAX_RADIUS = 8;     // Maximální velikost tečky
const SPEED = 0.05;       // Rychlost animace
const FREQUENCY = 0.03;   // Hustota vln (jak moc jsou "nahusto")

let time = 0;

function update() {
    // 1. Vyčistit plátno (černé pozadí jako na obrázku)
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // 2. Projít mřížku (grid)
    for (let x = GAP / 2; x < canvas.width; x += GAP) {
        for (let y = GAP / 2; y < canvas.height; y += GAP) {
            
            // Vzdálenost bodu od středu (pro kruhový efekt)
            const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
            
            // === MATEMATIKA VLN ===
            // Kombinujeme sinusovku podle vzdálenosti a času.
            // Můžete zkusit změnit 'dist' na 'x' pro svislé vlny nebo 'y' pro vodorovné.
            const angle = dist * FREQUENCY - time;
            
            // Sinus vrací -1 až 1. Převedeme to na rozsah 0 až 1.
            const wave = (Math.sin(angle) + 1) / 2; 

            // 3. Velikost tečky podle vlny
            const radius = wave * MAX_RADIUS;

            if (radius > 0) {
                // 4. Barva (HSL) - měníme odstín (Hue) podle vlny
                // 0 = červená, 120 = zelená, 240 = modrá
                // Zde mícháme barvy od červené po tyrkysovou (jako na vašem obr. vlevo nahoře)
                const hue = wave * 360; 
                const saturation = 80;
                const lightness = 50;

                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
                ctx.fill();
            }
        }
    }

    time += SPEED;
    requestAnimationFrame(update);
}

update();
