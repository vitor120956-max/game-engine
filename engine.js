const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
document.body.appendChild(canvas);
canvas.width = window.innerWidth; canvas.height = window.innerHeight;
ctx.imageSmoothingEnabled = false; // Deixa o visual com aspecto de Pixel Art

let worldSize = 4000;
let player = { 
    x: 2000, y: 2000, s: 30, speed: 4.5, vx: 0, vy: 0, 
    color: '#3498db', hp: 100, maxHp: 100, lvl: 1, gold: 0,
    dir: 1, frame: 0, isAttacking: false 
};
let cam = { x: 2000, y: 2000 };
let mobs = [], loot = [], trees = [], joystick = { active: false, baseX: 0, baseY: 0, stickX: 0, stickY: 0 };

// Gerador de Mundo (Estilo Curse of Aros)
for(let i=0; i<30; i++) mobs.push({ x: Math.random()*worldSize, y: Math.random()*worldSize, hp: 50, s: 20, t: Math.random()*10 });
for(let i=0; i<40; i++) trees.push({ x: Math.random()*worldSize, y: Math.random()*worldSize, s: 60 });

// --- RENDERIZAÇÃO DE SPRITES (ESTILO RUCOY) ---

function drawPixelMan(x, y, color, frame, dir, attacking) {
    ctx.save();
    ctx.translate(x - cam.x, y - cam.y);
    ctx.scale(dir, 1); // Vira o personagem para a esquerda ou direita

    let bounce = Math.sin(frame * 0.2) * 3;
    let armSwing = Math.cos(frame * 0.2) * 10;

    // Sombra
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath(); ctx.ellipse(0, 15, 15, 5, 0, 0, 7); ctx.fill();

    // Pernas
    ctx.fillStyle = "#2c3e50";
    if(Math.abs(player.vx) + Math.abs(player.vy) > 0.1) {
        ctx.fillRect(-10, 5 + armSwing/2, 8, 10);
        ctx.fillRect(2, 5 - armSwing/2, 8, 10);
    } else {
        ctx.fillRect(-10, 5, 8, 10); ctx.fillRect(2, 5, 8, 10);
    }

    // Corpo (Túnica)
    ctx.fillStyle = color;
    ctx.fillRect(-14, -15 + bounce, 28, 25);
    ctx.strokeStyle = "rgba(0,0,0,0.2)"; ctx.strokeRect(-14, -15 + bounce, 28, 25);

    // Braços
    ctx.fillStyle = "#ebedee";
    if(attacking) {
        ctx.fillRect(10, -10, 15, 8); // Braço esticado atacando
    } else {
        ctx.fillRect(-18, -10 + bounce + armSwing, 6, 12);
        ctx.fillRect(12, -10 + bounce - armSwing, 6, 12);
    }

    // Cabeça (Capacete/Cabelo)
    ctx.fillStyle = "#FFCCBC"; ctx.fillRect(-10, -32 + bounce, 20, 18);
    ctx.fillStyle = "#34495e"; ctx.fillRect(-12, -35 + bounce, 24, 8); // Topo do elmo

    // Olhos Pixelados
    ctx.fillStyle = "black";
    ctx.fillRect(2, -26 + bounce, 3, 3);
    ctx.fillRect(8, -26 + bounce, 3, 3);

    ctx.restore();
}

function drawMob(m) {
    let gx = m.x - cam.x, gy = m.y - cam.y;
    let sq = Math.sin(m.t) * 4;
    ctx.fillStyle = "rgba(0,0,0,0.2)"; ctx.beginPath(); ctx.ellipse(gx, gy+12, 15, 5, 0, 0, 7); ctx.fill();
    
    // Slime estilo Rucoy
    ctx.fillStyle = "#2ecc71";
    ctx.fillRect(gx-15-sq/2, gy-15+sq, 30+sq, 30-sq);
    ctx.fillStyle = "white"; ctx.fillRect(gx-8, gy-5+sq, 4, 4); ctx.fillRect(gx+4, gy-5+sq, 4, 4);
}

// --- LÓGICA PRINCIPAL ---

function update() {
    // Movimento com correção de travamento
    if(joystick.active) {
        let dx = joystick.stickX - joystick.baseX;
        let dy = joystick.stickY - joystick.baseY;
        let dist = Math.hypot(dx, dy);
        if(dist > 5) {
            player.vx = (dx/dist) * player.speed;
            player.vy = (dy/dist) * player.speed;
            player.dir = player.vx > 0 ? 1 : -1;
            player.frame++;
        }
    } else {
        player.vx *= 0.8; player.vy *= 0.8;
    }

    player.x += player.vx;
    player.y += player.vy;
    
    // Limites do mapa
    player.x = Math.max(20, Math.min(worldSize-20, player.x));
    player.y = Math.max(20, Math.min(worldSize-20, player.y));

    // Câmera Suave
    cam.x += (player.x - canvas.width/2 - cam.x) * 0.1;
    cam.y += (player.y - canvas.height/2 - cam.y) * 0.1;

    // --- DESENHO ---
    ctx.fillStyle = "#27ae60"; ctx.fillRect(0,0,canvas.width,canvas.height); // Chão grama

    // Loot (Moedas no chão)
    loot.forEach((l, i) => {
        ctx.fillStyle = "#f1c40f"; ctx.beginPath(); ctx.arc(l.x-cam.x, l.y-cam.y, 6, 0, 7); ctx.fill();
        if(Math.hypot(player.x-l.x, player.y-l.y) < 30) { loot.splice(i,1); player.gold += 5; }
    });

    // Mobs e Combate
    player.isAttacking = false;
    mobs.forEach((m, i) => {
        m.t += 0.1;
        let d = Math.hypot(player.x-m.x, player.y-m.y);
        if(d < 150) { // Perseguição
            m.x += (player.x-m.x)/d * 1.5; m.y += (player.y-m.y)/d * 1.5;
        }
        drawMob(m);
        if(d < 50) {
            player.isAttacking = true; m.hp -= 2;
            if(m.hp <= 0) { 
                loot.push({x: m.x, y: m.y}); 
                mobs.splice(i,1); 
            }
        }
    });

    drawPixelMan(player.x, player.y, player.color, player.frame, player.dir, player.isAttacking);

    // HUD (Estilo Rucoy)
    ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(10, 10, 200, 60);
    ctx.fillStyle = "#e74c3c"; ctx.fillRect(15, 15, (player.hp/player.maxHp)*190, 20); // HP
    ctx.fillStyle = "white"; ctx.font = "bold 14px monospace";
    ctx.fillText(`LVL: ${player.lvl}  GOLD: ${player.gold}`, 15, 55);

    // Joystick
    if(joystick.active) {
        ctx.strokeStyle="white"; ctx.beginPath(); ctx.arc(joystick.baseX, joystick.baseY, 50, 0, 7); ctx.stroke();
        ctx.fillStyle="rgba(255,255,255,0.2)"; ctx.beginPath(); ctx.arc(joystick.stickX, joystick.stickY, 25, 0, 7); ctx.fill();
    }
    requestAnimationFrame(update);
}

// Eventos Mobile
window.addEventListener('touchstart', e => {
    let t = e.touches[0];
    joystick.active = true;
    joystick.baseX = t.clientX; joystick.baseY = t.clientY;
    joystick.stickX = t.clientX; joystick.stickY = t.clientY;
});
window.addEventListener('touchmove', e => {
    if(joystick.active) {
        let t = e.touches[0];
        let dx = t.clientX - joystick.baseX, dy = t.clientY - joystick.baseY;
        let dist = Math.hypot(dx, dy);
        if(dist > 50) {
            joystick.stickX = joystick.baseX + (dx/dist)*50;
            joystick.stickY = joystick.baseY + (dy/dist)*50;
        } else {
            joystick.stickX = t.clientX; joystick.stickY = t.clientY;
        }
    }
    e.preventDefault();
}, {passive:false});
window.addEventListener('touchend', () => { joystick.active = false; });

update();
