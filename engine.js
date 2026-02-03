const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
document.body.appendChild(canvas);
canvas.width = window.innerWidth; canvas.height = window.innerHeight;
ctx.imageSmoothingEnabled = false;

let worldSize = 4000;
let player = { 
    x: 2000, y: 2000, s: 30, speed: 4.8, vx: 0, vy: 0, 
    color: '#3498db', hp: 100, maxHp: 100, xp: 0, maxXp: 100, lvl: 1, gold: 0,
    dir: 1, frame: 0, skillReady: true, skillCD: 0
};
let cam = { x: 2000, y: 2000 };
let mobs = [], loot = [], popups = [], biomas = [], joystick = { active: false, baseX: 0, baseY: 0, stickX: 0, stickY: 0 };

// Gerador de Biomas (Mosaico de Chão)
for(let x=0; x<worldSize; x+=800) {
    for(let y=0; y<worldSize; y+=800) {
        let type = "grass";
        if(x < 1600) type = "sand";
        if(y > 2400) type = "snow";
        biomas.push({x, y, type});
    }
}

// Inimigos Iniciais
for(let i=0; i<40; i++) spawnMob();

function spawnMob() {
    mobs.push({ x: Math.random()*worldSize, y: Math.random()*worldSize, hp: 50, maxHp: 50, s: 20, t: Math.random()*10 });
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

    // Sombra e Corpo
    ctx.fillStyle = "rgba(0,0,0,0.2)"; ctx.beginPath(); ctx.ellipse(0, 15, 15, 5, 0, 0, 7); ctx.fill();
    ctx.fillStyle = player.color; ctx.fillRect(-14, -15 + bounce, 28, 26);
    // Cabeça
    ctx.fillStyle = "#FFCCBC"; ctx.fillRect(-10, -32 + bounce, 20, 18);
    ctx.fillStyle = "#2c3e50"; ctx.fillRect(-12, -35 + bounce, 24, 8); // Elmo
    // Olhos
    ctx.fillStyle = "black"; ctx.fillRect(2, -26 + bounce, 3, 4); ctx.fillRect(8, -26 + bounce, 3, 4);
    
    // Efeito de Skill (Giro)
    if(player.skillCD > 180) { // Durante o uso
        ctx.strokeStyle = "rgba(255,255,255,0.8)"; ctx.lineWidth = 10;
        ctx.beginPath(); ctx.arc(0,0, 60, 0, 7); ctx.stroke();
    }
    ctx.restore();
}

function update() {
    // Física do Joystick
    if(joystick.active) {
        let dx = joystick.stickX - joystick.baseX, dy = joystick.stickY - joystick.baseY, dist = Math.hypot(dx, dy);
        if(dist > 5) {
            player.vx = (dx/dist) * player.speed; player.vy = (dy/dist) * player.speed;
            player.dir = player.vx > 0 ? 1 : -1;
        }
    } else { player.vx *= 0.8; player.vy *= 0.8; }

    player.x = Math.max(0, Math.min(worldSize, player.x + player.vx));
    player.y = Math.max(0, Math.min(worldSize, player.y + player.vy));
    cam.x += (player.x - canvas.width/2 - cam.x) * 0.1;
    cam.y += (player.y - canvas.height/2 - cam.y) * 0.1;

    // Skill Cooldown
    if(player.skillCD > 0) player.skillCD--;

    // Render Biomas
    biomas.forEach(b => {
        if(b.type === "grass") ctx.fillStyle = "#27ae60";
        else if(b.type === "sand") ctx.fillStyle = "#f1c40f";
        else ctx.fillStyle = "#ecf0f1";
        ctx.fillRect(b.x-cam.x, b.y-cam.y, 801, 801);
    });

    // Mobs e Combate
    mobs.forEach((m, i) => {
        let d = Math.hypot(player.x-m.x, player.y-m.y);
        m.t += 0.1;
        
        // Desenho Mob
        let gx = m.x-cam.x, gy = m.y-cam.y;
        ctx.fillStyle = "#e74c3c"; ctx.fillRect(gx-15, gy-15, 30, 30);
        ctx.fillStyle = "#c0392b"; ctx.fillRect(gx-15, gy-25, 30, 5); // Barra HP mob
        ctx.fillStyle = "#2ecc71"; ctx.fillRect(gx-15, gy-25, (m.hp/m.maxHp)*30, 5);

        // Auto Attack (Curse of Aros Style)
        if(d < 50) {
            m.hp -= 1;
            if(Math.random() > 0.9) addPopup(m.x, m.y, "-1", "white");
            if(m.hp <= 0) {
                addPopup(m.x, m.y, "+20 XP", "#3498db");
                player.xp += 20;
                loot.push({x: m.x, y: m.y});
                mobs.splice(i, 1);
                spawnMob();
            }
        }
    });

    // Loot e Popups
    loot.forEach((l, i) => {
        ctx.fillStyle = "#f1c40f"; ctx.beginPath(); ctx.arc(l.x-cam.x, l.y-cam.y, 6, 0, 7); ctx.fill();
        if(Math.hypot(player.x-l.x, player.y-l.y) < 30) { loot.splice(i, 1); player.gold += 10; addPopup(player.x, player.y, "+10 Gold", "yellow"); }
    });

    popups.forEach((p, i) => {
        p.y += p.vy; p.life -= 0.02;
        ctx.fillStyle = p.color; ctx.globalAlpha = p.life;
        ctx.font = "bold 16px Arial"; ctx.fillText(p.text, p.x-cam.x, p.y-cam.y);
        ctx.globalAlpha = 1;
        if(p.life <= 0) popups.splice(i, 1);
    });

    // Level Up Check
    if(player.xp >= player.maxXp) {
        player.lvl++; player.xp = 0; player.maxXp += 50; player.maxHp += 20; player.hp = player.maxHp;
        addPopup(player.x, player.y, "LEVEL UP!", "#2ecc71");
    }

    drawPlayer();

    // HUD
    ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(10, 10, 220, 80);
    ctx.fillStyle = "#e74c3c"; ctx.fillRect(15, 20, (player.hp/player.maxHp)*210, 15); // HP
    ctx.fillStyle = "#3498db"; ctx.fillRect(15, 40, (player.xp/player.maxXp)*210, 10); // XP
    ctx.fillStyle = "white"; ctx.font = "14px Arial";
    ctx.fillText(`LVL: ${player.lvl} | GOLD: ${player.gold}`, 15, 75);

    // Joystick
    if(joystick.active) {
        ctx.strokeStyle="white"; ctx.beginPath(); ctx.arc(joystick.baseX, joystick.baseY, 50, 0, 7); ctx.stroke();
        ctx.fillStyle="rgba(255,255,255,0.3)"; ctx.beginPath(); ctx.arc(joystick.stickX, joystick.stickY, 25, 0, 7); ctx.fill();
    }
    
    requestAnimationFrame(update);
}

// Botão de Especial (Toque Duplo ou Clique na Tela)
window.addEventListener('dblclick', () => {
    if(player.skillCD <= 0) {
        player.skillCD = 200;
        mobs.forEach(m => {
            if(Math.hypot(player.x-m.x, player.y-m.y) < 100) { m.hp -= 20; addPopup(m.x, m.y, "-20!", "orange"); }
        });
    }
});

// Eventos Mobile
window.addEventListener('touchstart', e => {
    let t = e.touches[0]; joystick.active = true;
    joystick.baseX = t.clientX; joystick.baseY = t.clientY;
    joystick.stickX = t.clientX; joystick.stickY = t.clientY;
});
window.addEventListener('touchmove', e => {
    if(joystick.active) {
        let t = e.touches[0];
        let dx = t.clientX - joystick.baseX, dy = t.clientY - joystick.baseY, dist = Math.hypot(dx, dy);
        if(dist > 50) { joystick.stickX = joystick.baseX+(dx/dist)*50; joystick.stickY = joystick.baseY+(dy/dist)*50; }
        else { joystick.stickX = t.clientX; joystick.stickY = t.clientY; }
    }
    e.preventDefault();
}, {passive:false});
window.addEventListener('touchend', () => { joystick.active = false; });

update();
