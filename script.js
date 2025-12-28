// ==========================================
// KONFIGURACE - SIMULACE JEDNÉ BUŇKY
// ==========================================

var PARTICLE_SIZE = 60;       // Zvětšeno pro náhled (cca 100px s efekty)
var SPEED = 0.2;              // Zpomaleno, aby to bylo "těžkotonážní"
var FRICTION = 0.94;          // Větší tření, aby se držela na místě
var TRAIL_LENGTH = 20;        // Delší ocas pro hezčí efekt

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

class DemoEntity {
    constructor() {
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.vx = 0;
        this.vy = 0;
        
        // Vizuální stavy
        this.history = [];
        this.isHugging = false; 
        this.flash = 0;      
        this.mistSize = 1.0; 
        
        // Časovače pro automatickou simulaci chování
        this.simTimer = 0;
    }

    update() {
        this.simTimer++;

        // 1. SIMULACE CHOVÁNÍ (Automaticky spouští efekty)
        // Každých 120 snímků (cca 2 sekundy) blikne (E)
        if (this.simTimer % 200 === 0) {
            this.flash = 1.0;
        }

        // Každých 300 snímků přepne režim "Objetí" (Q)
        if (this.simTimer % 300 === 0) {
            this.isHugging = !this.isHugging;
        }

        // Pokud je v režimu "HUG" a nemá sousedy, musíme simulovat růst mlhy uměle
        if (this.isHugging) {
            // Pulzování velikosti mlhy
            this.mistSize = 1.5 + Math.sin(this.simTimer * 0.1) * 0.2;
        } else {
            // Návrat do normálu
            if (this.mistSize > 1.0) this.mistSize -= 0.05;
        }

        // Postupné zhasínání flash efektu
        if (this.flash > 0) this.flash -= 0.04;

        // 2. POHYB "NA MÍSTĚ"
        // Náhodné cukání (Brownův pohyb)
        this.vx += (Math.random() - 0.5) * SPEED;
        this.vy += (Math.random() - 0.5) * SPEED;

        // Pružina: Tahá buňku zpět do středu obrazovky
        let dx = (canvas.width / 2) - this.x;
        let dy = (canvas.height / 2) - this.y;
        this.vx += dx * 0.005; 
        this.vy += dy * 0.005;

        // Aplikace fyziky
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= FRICTION;
        this.vy *= FRICTION;

        // Ukládání stopy
        this.history.unshift({x: this.x, y: this.y});
        if (this.history.length > TRAIL_LENGTH) this.history.pop();
    }

    draw() {
        this.history.forEach((pos, index) => {
            let progress = 1 - (index / TRAIL_LENGTH);
            
            // Výpočet velikosti: základní + (mlha nebo bliknutí)
            // Zde se projeví to zvětšení na 100px+
            let currentSize = PARTICLE_SIZE * progress * (this.mistSize + this.flash * 1.5); 
            
            // Výpočet jasu - když je "HUG" (mistSize > 1), je trochu průhlednější
            let alpha = ((progress * 0.4) / this.mistSize) + (this.flash * progress * 0.6);

            // Barva: Pokud je "HUG", jde lehce do fialova, jinak tyrkysová
            if (this.isHugging) {
                ctx.fillStyle = `rgba(100, 200, 255, ${alpha})`; // Světlejší při hugu
            } else {
                ctx.fillStyle = `rgba(0, 249, 255, ${alpha})`;
            }
            
            ctx.fillRect(pos.x - currentSize/2, pos.y - currentSize/2, currentSize, currentSize);
        });

        // Indikátor stavu (jen text pro info)
        ctx.fillStyle = "white";
        ctx.font = "12px monospace";
        let status = "IDLE";
        if (this.isHugging) status = "HUGGING (Mlha)";
        if (this.flash > 0.1) status = "SIGNAL (Blesk)";
        ctx.fillText(status, this.x + 40, this.y);
    }
}

const entity = new DemoEntity();

function loop() {
    // Tmavší pozadí pro lepší kontrast
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    entity.update();
    entity.draw();

    requestAnimationFrame(loop);
}

loop();
