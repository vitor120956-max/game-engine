const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
document.body.appendChild(canvas);

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.imageSmoothingEnabled = false;
}
window.addEventListener('resize', resize);
resize();

// --- CONFIGURAÇÃO ---
let worldSize = 5000;
let player = { 
    x: 2500, y: 2500, s: 30, speed: 5, vx: 0, vy: 0, 
    color: '#3498db', hp: 100, maxHp: 100, xp: 0, maxXp: 100, lvl: 1, gold: 0,
    dir: 1, frame: 0, skillCD: 0
};
let cam = { x: 2500, y: 2500 };
let mobs = [], loot = [], popups = [], joystick = { active: false, baseX: 0, baseY: 0, stickX: 0, stickY: 0 };

// Inimigos
for(let i=0; i<50; i++) spawnMob();

function spawnMob() {
    mobs.push({ x: Math.random()*worldSize, y: Math.random()*worldSize, hp: 50, maxHp: 50, s: 22, t: Math.random()*10 });
}

function addPopup(x, y, text, color) {
    popups.push({ x, y, text, color, life: 1, vy: -2 });
}

// --- RENDERIZAÇÃO ---

function drawPlayer() {
    let gx = player.x - cam.x, gy = player.y - cam.y;
    player.frame += (Math.abs(player.vx) + Math.abs(player.vy) > 0.1) ? 0.2 : 0;
    let bounce = Math.sin(player.frame) * 4;

    ctx.save();
    ctx.translate(gx, gy);
    ctx.scale(player.dir, 1);
    
    // Sombra
    ctx.fillStyle = "rgba(0,0,0,0.2)"; ctx.beginPath(); ctx.ellipse(0, 15, 15, 5, 0, 0, 7); ctx.fill();
    
    // Corpo Estilo Rucoy
    ctx.fillStyle = player.color; ctx.fillRect(-14, -15 + bounce, 28, 26);
    ctx.fillStyle = "#FFCCBC"; ctx.fillRect(-10, -32 + bounce, 20, 18); // Rosto
    ctx.fillStyle = "#2c3e50"; ctx.fillRect(-12, -35 + bounce, 24, 8); // Elmo
    ctx.fillStyle = "black"; ctx.fillRect(2, -26 + bounce, 3, 4); ctx.fillRect(8, -26 + bounce, 3, 4); // Olhos
    
    if(player.skillCD > 170) {
        ctx.strokeStyle = "rgba(255,255,255,0.6)"; ctx.lineWidth = 8;
        ctx.beginPath(); ctx.arc(0,0, 60, 0, 7); ctx.stroke();
    }
    ctx.restore();
}

function update() {
    // 1. LIMPEZA TOTAL DA TELA (Corrige o bug de duplicação)
    ctx.fillStyle = "#1e1e1e"; // Cor do "vazio" fora do mapa
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Lógica Joystick
    if(joystick.active) {
        let dx = joystick.stickX - joystick.baseX, dy = joystick.stickY - joystick.baseY, dist = Math.hypot(dx, dy);
        if(dist > 5) {
            player.vx = (dx/dist) * player.speed; player.vy = (dy/dist) * player.speed;
            player.dir = player.vx > 0 ? 1 : -1;
        }
    } else { player.vx *= 0.7; player.vy *= 0.7; }

    player.x = Math.max(0, Math.min(worldSize, player.x + player.vx));
    player.y = Math.max(0, Math.min(worldSize, player.y + player.vy));

    // Câmera Travada nos limites (Corrige o bug visual)
    cam.x = player.x - canvas.width / 2;
    cam.y = player.y - canvas.height / 2;
    
    // Skill Cooldown
    if(player.skillCD > 0) player.skillCD--;

    // 2. DESENHO DO CHÃO (Limitado ao tamanho do mundo)
    ctx.fillStyle = "#27ae60"; // Grama principal
    ctx.fillRect(0 - cam.x, 0 - cam.y, worldSize, worldSize);
    
    // Grade de referência
    ctx.strokeStyle = "rgba(0,0,0,0.05)";
    for(let i=0; i<=worldSize; i+=100) {
        ctx.beginPath(); ctx.moveTo(i-cam.x, 0-cam.y); ctx.lineTo(i-cam.x, worldSize-cam.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0-cam.x, i-cam.y); ctx.lineTo(worldSize-cam.x, i-cam.y); ctx.stroke();
    }

    // Mobs e Loot
    mobs.forEach((m, i) => {
        let d = Math.hypot(player.x-m.x, player.y-m.y);
        let gx = m.x-cam.x, gy = m.y-cam.y;
        
        // Desenho Simples Slime
        ctx.fillStyle = "#e74c3c"; ctx.fillRect(gx-15, gy-15, 30, 30);
        ctx.fillStyle = "#2ecc71"; ctx.fillRect(gx-15, gy-25, (m.hp/m.maxHp)*30, 5);

        if(d < 50) {
            m.hp -= 1.5;
            if(Math.random() > 0.9) addPopup(m.x, m.y, "-15", "white");
            if(m.hp <= 0) {
                player.xp += 25;
                loot.push({x: m.x, y: m.y});
                mobs.splice(i, 1); spawnMob();
            }
        }
    });

    loot.forEach((l, i) => {
        ctx.fillStyle = "#f1c40f"; ctx.beginPath(); ctx.arc(l.x-cam.x, l.y-cam.y, 6, 0, 7); ctx.fill();
        if(Math.hypot(player.x-l.x, player.y-l.y) < 30) { 
            loot.splice(i, 1); player.gold += 10; 
            addPopup(player.x, player.y, "+10G", "yellow"); 
        }
    });

    popups.forEach((p, i) => {
        p.y += p.vy; p.life -= 0.02;
        ctx.fillStyle = p.color; ctx.globalAlpha = p.life;
        ctx.font = "bold 16px Arial"; ctx.fillText(p.text, p.x-cam.x, p.y-cam.y);
        ctx.globalAlpha = 1;
        if(p.life <= 0) popups.splice(i, 1);
    });

    if(player.xp >= player.maxXp) {
        player.lvl++; player.xp = 0; player.maxXp += 50; 
        addPopup(player.x, player.y, "LVL UP!", "#2ecc71");
    }

    drawPlayer();

    // Interface
    ctx.fillStyle = "rgba(0,0,0,0.7)"; ctx.fillRect(20, 20, 180, 50);
    ctx.fillStyle = "#3498db"; ctx.fillRect(25, 55, (player.xp/player.maxXp)*170, 8); // XP bar
    ctx.fillStyle = "white"; ctx.font = "bold 14px Arial";
    ctx.fillText(`LVL ${player.lvl} | GOLD ${player.gold}`, 30, 45);

    // Joystick
    if(joystick.active) {
        ctx.strokeStyle="white"; ctx.lineWidth=2;
        ctx.beginPath(); ctx.arc(joystick.baseX, joystick.baseY, 50, 0, 7); ctx.stroke();
        ctx.fillStyle="rgba(255,255,255,0.3)";
        ctx.beginPath(); ctx.arc(joystick.stickX, joystick.stickY, 25, 0, 7); ctx.fill();
    }
    
    requestAnimationFrame(update);
}

// Comandos
window.addEventListener('dblclick', () => {
    if(player.skillCD <= 0) {
        player.skillCD = 180;
        mobs.forEach(m => {
            if(Math.hypot(player.x-m.x, player.y-m.y) < 120) { 
                m.hp -= 30; addPopup(m.x, m.y, "CRIT!", "orange"); 
            }
        });
    }
});

window.addEventListener('touchstart', e => {
    let t = e.touches[0]; joystick.active = true;
    joystick.baseX = t.clientX; joystick.baseY = t.clientY;
    joystick.stickX = t.clientX; joystick.stickY = t.clientY;
}, {passive: false});
window.addEventListener('touchmove', e => {
    if(joystick.active) {
        let t = e.touches[0];
        let dx = t.clientX-joystick.baseX, dy = t.clientY-joystick.baseY, dist = Math.hypot(dx, dy);
        if(dist > 50) { joystick.stickX = joystick.baseX+(dx/dist)*50; joystick.stickY = joystick.baseY+(dy/dist)*50; }
        else { joystick.stickX = t.clientX; joystick.stickY = t.clientY; }
    }
    e.preventDefault();
}, {passive: false});
window.addEventListener('touchend', () => { joystick.active = false; });

update();
