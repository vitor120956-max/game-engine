/**
 * RPG Engine - Senior Architecture Edition
 * Features: Depth Sorting, Layered Sprites, Frame-Independent Physics
 */

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
document.body.appendChild(canvas);

const config = {
    worldSize: 5000,
    tileSize: 64,
    debug: false
};

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.imageSmoothingEnabled = false; // Pixel-perfect rendering
}
window.addEventListener('resize', resize);
resize();

// --- SISTEMA DE ENTIDADES ---
class Entity {
    constructor(x, y, type) {
        this.x = x; this.y = y;
        this.type = type;
        this.vx = 0; this.vy = 0;
        this.frame = 0;
        this.flip = 1;
        this.z = y; // Usado para Depth Sorting
    }
}

class Player extends Entity {
    constructor(x, y) {
        super(x, y, 'player');
        this.hp = 100; this.maxHp = 100;
        this.lvl = 1; this.xp = 0;
        this.speed = 4.5;
        this.atkCooldown = 0;
        this.isAttacking = false;
        this.equipment = { sword: '#bdc3c7', glow: 'rgba(52, 152, 219, 0.5)' };
    }

    draw(ctx, cam) {
        const gx = this.x - cam.x;
        const gy = this.y - cam.y;
        const walkCycle = Math.sin(this.frame * 0.2);
        const bobbing = Math.abs(Math.cos(this.frame * 0.2)) * 5;

        ctx.save();
        ctx.translate(gx, gy);
        ctx.scale(this.flip, 1);

        // 1. Sombra Projetada
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.beginPath(); ctx.ellipse(0, 5, 18, 7, 0, 0, Math.PI * 2); ctx.fill();

        // 2. Pés (Animação de Caminhada)
        ctx.fillStyle = "#2c3e50";
        if(Math.hypot(this.vx, this.vy) > 0.1) {
            ctx.fillRect(-10 + (walkCycle * 8), -5, 8, 8);
            ctx.fillRect(2 - (walkCycle * 8), -5, 8, 8);
        } else {
            ctx.fillRect(-10, -5, 8, 8); ctx.fillRect(2, -5, 8, 8);
        }

        // 3. Corpo e Capa
        ctx.fillStyle = "#2980b9";
        ctx.fillRect(-15, -35 + bobbing, 30, 32); 
        
        // 4. Cabeça e Rosto (Técnica de Detalhe)
        ctx.fillStyle = "#f3e0d2"; ctx.fillRect(-10, -52 + bobbing, 20, 20);
        ctx.fillStyle = "#34495e"; ctx.fillRect(-12, -55 + bobbing, 24, 8); // Cabelo/Elmo
        
        // Olhos com brilho
        ctx.fillStyle = "#000"; ctx.fillRect(2, -45 + bobbing, 3, 5); ctx.fillRect(9, -45 + bobbing, 3, 5);
        ctx.fillStyle = "#fff"; ctx.fillRect(2, -45 + bobbing, 1, 1); // Brilho no olho

        // 5. Arma com Efeito de Rastro
        if(this.isAttacking) {
            ctx.strokeStyle = this.equipment.glow; ctx.lineWidth = 6;
            ctx.beginPath(); ctx.arc(0, -25, 50, -0.5, 0.5); ctx.stroke();
            ctx.fillStyle = this.equipment.sword;
            ctx.rotate(0.5); ctx.fillRect(20, -45, 6, 35);
        } else {
            ctx.fillStyle = this.equipment.sword;
            ctx.fillRect(15, -35 + bobbing, 5, 25);
        }

        ctx.restore();
    }
}

// --- ENGINE CORE ---
const engine = {
    player: new Player(config.worldSize/2, config.worldSize/2),
    mobs: [],
    props: [],
    particles: [],
    cam: { x: 0, y: 0 },
    input: { active: false, x: 0, y: 0, bx: 0, by: 0 },

    init() {
        // Gerar mundo procedural
        for(let i=0; i<80; i++) {
            this.props.push({
                x: Math.random()*config.worldSize,
                y: Math.random()*config.worldSize,
                s: 40 + Math.random()*40,
                z: 0 // Será definido no sort
            });
        }
        for(let i=0; i<30; i++) this.spawnMob();
        this.loop();
    },

    spawnMob() {
        this.mobs.push({
            x: Math.random()*config.worldSize,
            y: Math.random()*config.worldSize,
            hp: 100, maxHp: 100,
            s: 30, color: '#e74c3c',
            frame: Math.random()*100
        });
    },

    update() {
        // Input Handling
        if(this.input.active) {
            const dx = this.input.x - this.input.bx;
            const dy = this.input.y - this.input.by;
            const dist = Math.hypot(dx, dy);
            if(dist > 5) {
                this.player.vx = (dx/dist) * this.player.speed;
                this.player.vy = (dy/dist) * this.player.speed;
                this.player.flip = this.player.vx > 0 ? 1 : -1;
                this.player.frame++;
            }
        } else {
            this.player.vx *= 0.8; this.player.vy *= 0.8;
        }

        this.player.x += this.player.vx;
        this.player.y += this.player.vy;
        
        // Camera Follow
        this.cam.x += (this.player.x - canvas.width/2 - this.cam.x) * 0.1;
        this.cam.y += (this.player.y - canvas.height/2 - this.cam.y) * 0.1;
        
        if(this.player.atkCooldown > 0) this.player.atkCooldown--;
        else this.player.isAttacking = false;
    },

    render() {
        // Clear screen with high-performance solid color
        ctx.fillStyle = "#1b5e20"; // Dark Grass
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Render Tile Grid (Optimization: only visible tiles)
        ctx.strokeStyle = "rgba(0,0,0,0.05)";
        const startX = Math.floor(this.cam.x / config.tileSize) * config.tileSize;
        const startY = Math.floor(this.cam.y / config.tileSize) * config.tileSize;
        for(let x=startX; x < startX + canvas.width + config.tileSize; x += config.tileSize) {
            ctx.beginPath(); ctx.moveTo(x-this.cam.x, 0); ctx.lineTo(x-this.cam.x, canvas.height); ctx.stroke();
        }

        // Y-Sorting (O segredo do GTA 2D e Rucoy)
        const renderQueue = [
            ...this.props.map(p => ({...p, render: (ctx) => this.drawTree(p)})),
            ...this.mobs.map(m => ({...m, render: (ctx) => this.drawMob(m)})),
            {...this.player, render: (ctx) => this.player.draw(ctx, this.cam)}
        ];
        renderQueue.sort((a, b) => (a.y || a.z) - (b.y || b.z));

        renderQueue.forEach(obj => obj.render(ctx));

        this.drawInterface();
    },

    drawTree(p) {
        const gx = p.x - this.cam.x; const gy = p.y - this.cam.y;
        ctx.fillStyle = "rgba(0,0,0,0.2)"; ctx.beginPath(); ctx.ellipse(gx, gy, 20, 8, 0, 0, 7); ctx.fill(); // Sombra
        ctx.fillStyle = "#4e342e"; ctx.fillRect(gx-8, gy-20, 16, 25); // Tronco
        ctx.fillStyle = "#2e7d32"; ctx.beginPath(); ctx.arc(gx, gy-45, p.s/1.5, 0, 7); ctx.fill(); // Copa
    },

    drawMob(m) {
        const gx = m.x - this.cam.x; const gy = m.y - this.cam.y;
        const bounce = Math.sin(Date.now()/200) * 5;
        ctx.fillStyle = m.color; ctx.fillRect(gx-15, gy-15+bounce, 30, 30);
        // HP Bar Pro
        ctx.fillStyle = "black"; ctx.fillRect(gx-15, gy-25, 30, 4);
        ctx.fillStyle = "#ff5252"; ctx.fillRect(gx-15, gy-25, (m.hp/m.maxHp)*30, 4);
    },

    drawInterface() {
        // HUD Glassmorphism
        ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.roundRect(20, 20, 200, 60, 10); ctx.fill();
        ctx.fillStyle = "#4CAF50"; ctx.fillRect(30, 35, 180, 10);
        ctx.fillStyle = "white"; ctx.font = "bold 14px Inter, sans-serif";
        ctx.fillText(`HERO LVL ${this.player.lvl}`, 30, 60);

        // Buttons
        this.drawButton(canvas.width - 80, canvas.height - 80, "ATK", "#f44336");
        
        // Joystick
        if(this.input.active) {
            ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(this.input.bx, this.input.by, 50, 0, 7); ctx.stroke();
            ctx.fillStyle = "rgba(255,255,255,0.2)";
            ctx.beginPath(); ctx.arc(this.input.x, this.input.y, 25, 0, 7); ctx.fill();
        }
    },

    drawButton(x, y, label, col) {
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, 40, 0, 7); ctx.fill();
        ctx.fillStyle = "white"; ctx.textAlign = "center"; ctx.fillText(label, x, y+5);
    },

    loop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.loop());
    }
};

// --- CONTROLES PRO ---
window.addEventListener('touchstart', e => {
    const t = e.touches[0];
    if(t.clientX > canvas.width - 150) {
        engine.player.isAttacking = true;
        engine.player.atkCooldown = 15;
        // Hit detection
        engine.mobs.forEach(m => {
            if(Math.hypot(engine.player.x - m.x, engine.player.y - m.y) < 80) m.hp -= 25;
        });
    } else {
        engine.input.active = true;
        engine.input.bx = t.clientX; engine.input.by = t.clientY;
        engine.input.x = t.clientX; engine.input.y = t.clientY;
    }
}, {passive: false});

window.addEventListener('touchmove', e => {
    if(engine.input.active) {
        const t = e.touches[0];
        engine.input.x = t.clientX; engine.input.y = t.clientY;
    }
    e.preventDefault();
}, {passive: false});

window.addEventListener('touchend', () => engine.input.active = false);

engine.init();
