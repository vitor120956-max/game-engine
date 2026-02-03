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

// --- ESTADO DO JOGO ---
let worldSize = 6000;
let player = { 
    x: 3000, y: 3000, s: 30, speed: 5, vx: 0, vy: 0, 
    color: '#3498db', hp: 100, maxHp: 100, xp: 0, maxXp: 100, lvl: 1, gold: 0,
    dir: 1, frame: 0, skillCD: 0, dmg: 3,
    equip: { weapon: false, shield: false }
};
let cam = { x: 3000, y: 3000 };
let mobs = [], loot = [], itemsOnGround = [], popups = [], particles = [];
let joystick = { active: false, baseX: 0, baseY: 0, stickX: 0, stickY: 0 };

// Gerar Mobs Iniciais
for(let i=0; i<60; i++) spawnMob();

function spawnMob() {
    let types = [
        { name: "Slime", color: "#2ecc71", hp: 40, dmg: 1 },
        { name: "Orc", color: "#e67e22", hp: 100, dmg: 3 }
    ];
    let t = types[Math.floor(Math.random()*types.length)];
    mobs.push({ 
        x: Math.random()*worldSize, y: Math.random()*worldSize, 
        hp: t.hp, maxHp: t.hp, s: 25, type: t, t: Math.random()*10 
    });
}

function addPopup(x, y, text, color) {
    popups.push({ x, y, text, color, life: 1, vy: -2 });
}

// --- DESENHO DOS SPRITES ---

function drawPlayer() {
    let gx = player.x - cam.x, gy = player.y - cam.y;
    player.frame += (Math.abs(player.vx) + Math.abs(player.vy) > 0.1) ? 0.2 : 0;
    let bounce = Math.sin(player.frame) * 4;

    ctx.save();
    ctx.translate(gx, gy);
    ctx.scale(player.dir, 1);
    
    // Sombra
    ctx.fillStyle = "rgba(0,0,0,0.2)"; ctx.beginPath(); ctx.ellipse(0, 15, 18, 6, 0, 0, 7); ctx.fill();
    
    // Equipamento: Escudo (Atrás do corpo)
    if(player.equip.shield) {
        ctx.fillStyle = "#95a5a6"; ctx.fillRect(-22, -10 + bounce, 8, 20);
        ctx.strokeStyle = "#7f8c8d"; ctx.strokeRect(-22, -10 + bounce, 8, 20);
    }

    // Corpo (Túnica)
    ctx.fillStyle = player.color; ctx.fillRect(-15, -15 + bounce, 30, 28);
    ctx.strokeStyle = "rgba(0,0,0,0.2)"; ctx.strokeRect(-15, -15 + bounce, 30, 28);

    // Equipamento: Espada (Frente)
    if(player.equip.weapon) {
        ctx.fillStyle = "#bdc3c7"; ctx.fillRect(15, -18 + bounce, 6, 25); // Lâmina
        ctx.fillStyle = "#f39c12"; ctx.fillRect(12, -5 + bounce, 12, 4); // Guarda
    }

    // Cabeça
    ctx.fillStyle = "#FFCCBC"; ctx.fillRect(-12, -34 + bounce, 24, 20);
    ctx.fillStyle = "#2c3e50"; ctx.fillRect(-14, -38 + bounce, 28, 10); // Capacete
    
    // Olhos Style Curse of Aros
    ctx.fillStyle = "black";
    ctx.fillRect(4, -28 + bounce, 4, 5); ctx.fillRect(12, -28 + bounce, 4, 5);
    
    // Efeito de Skill
    if(player.skillCD > 170) {
        ctx.strokeStyle = "rgba(255,255,255,0.8)"; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.arc(0, 0, 60, 0, 7); ctx.stroke();
    }
    ctx.restore();
}

function update() {
    // 1. Limpeza de Tela e Fundo
    ctx.fillStyle = "#1a1a1a"; ctx.fillRect(0, 0, canvas.width, canvas.height); // Vazio
    
    // Joystick Logic
    if(joystick.active) {
        let dx = joystick.stickX - joystick.baseX, dy = joystick.stickY - joystick.baseY, dist = Math.hypot(dx, dy);
        if(dist > 5) {
            player.vx = (dx/dist) * player.speed; player.vy = (dy/dist) * player.speed;
            player.dir = player.vx > 0 ? 1 : -1;
        }
    } else { player.vx *= 0.8; player.vy *= 0.8; }

    player.x = Math.max(50, Math.min(worldSize-50, player.x + player.vx));
    player.y = Math.max(50, Math.min(worldSize-50, player.y + player.vy));

    // Câmera Travada
    cam.x = player.x - canvas.width / 2;
    cam.y = player.y - canvas.height / 2;
    
    if(player.skillCD > 0) player.skillCD--;

    // 2. Desenhar Chão (Biomas)
    ctx.fillStyle = "#27ae60"; ctx.fillRect(0-cam.x, 0-cam.y, worldSize, worldSize); // Grama
    ctx.fillStyle = "#f1c40f"; ctx.fillRect(0-cam.x, 0-cam.y, 1500, worldSize); // Deserto Esq.
    
    // 3. Itens no Chão
    itemsOnGround.forEach((it, i) => {
        let gx = it.x - cam.x, gy = it.y - cam.y;
        ctx.fillStyle = it.type === "weapon" ? "#bdc3c7" : "#95a5a6";
        ctx.fillRect(gx-10, gy-10, 20, 20);
        ctx.strokeStyle = "white"; ctx.strokeRect(gx-10, gy-10, 20, 20);
        if(Math.hypot(player.x-it.x, player.y-it.y) < 40) {
            if(it.type === "weapon") { player.equip.weapon = true; player.dmg = 8; }
            else { player.equip.shield = true; player.maxHp = 200; player.hp = player.maxHp; }
            addPopup(player.x, player.y, "EQUIPADO!", "cyan");
            itemsOnGround.splice(i, 1);
        }
    });

    // 4. Mobs e Combate
    mobs.forEach((m, i) => {
        let gx = m.x-cam.x, gy = m.y-cam.y;
        let d = Math.hypot(player.x-m.x, player.y-m.y);
        
        // IA Simples
        if(d < 200) { m.x += (player.x-m.x)/d*2; m.y += (player.y-m.y)/d*2; }

        // Desenhar Mob
        ctx.fillStyle = "rgba(0,0,0,0.2)"; ctx.beginPath(); ctx.ellipse(gx, gy+15, 15, 5, 0, 0, 7); ctx.fill();
        ctx.fillStyle = m.type.color; ctx.fillRect(gx-15, gy-15, 30, 30);
        // HP Mob
        ctx.fillStyle = "#c0392b"; ctx.fillRect(gx-15, gy-25, 30, 5);
        ctx.fillStyle = "#2ecc71"; ctx.fillRect(gx-15, gy-25, (m.hp/m.maxHp)*30, 5);

        if(d < 50) {
            m.hp -= player.dmg;
            if(Math.random() > 0.8) addPopup(m.x, m.y, `-${player.dmg}`, "white");
            if(m.hp <= 0) {
                player.xp += 30;
                loot.push({x: m.x, y: m.y});
                if(Math.random() > 0.85) itemsOnGround.push({x: m.x, y: m.y, type: Math.random() > 0.5 ? "weapon" : "shield"});
                mobs.splice(i, 1); spawnMob();
            }
        }
    });

    // 5. Loot de Ouro
    loot.forEach((l, i) => {
        ctx.fillStyle = "#f1c40f"; ctx.beginPath(); ctx.arc(l.x-cam.x, l.y-cam.y, 8, 0, 7); ctx.fill();
        if(Math.hypot(player.x-l.x, player.y-l.y) < 30) { 
            loot.splice(i, 1); player.gold += 15; 
            addPopup(player.x, player.y, "+15G", "#f1c40f");
        }
    });

    // 6. Popups e Level Up
    popups.forEach((p, i) => {
        p.y += p.vy; p.life -= 0.02;
        ctx.fillStyle = p.color; ctx.globalAlpha = p.life;
        ctx.font = "bold 18px monospace"; ctx.fillText(p.text, p.x-cam.x, p.y-cam.y);
        ctx.globalAlpha = 1;
        if(p.life <= 0) popups.splice(i, 1);
    });

    if(player.xp >= player.maxXp) {
        player.lvl++; player.xp = 0; player.maxXp *= 1.5;
        addPopup(player.x, player.y, "LEVEL UP!", "#2ecc71");
    }

    drawPlayer();

    // --- INTERFACE (HUD) ---
    ctx.fillStyle = "rgba(0,0,0,0.7)"; ctx.fillRect(20, 20, 200, 70);
    ctx.fillStyle = "#e74c3c"; ctx.fillRect(25, 30, (player.hp/player.maxHp)*190, 12); // HP
    ctx.fillStyle = "#3498db"; ctx.fillRect(25, 45, (player.xp/player.maxXp)*190, 8); // XP
    ctx.fillStyle = "white"; ctx.font = "bold 14px Arial";
    ctx.fillText(`LVL ${player.lvl}  GOLD ${player.gold}`, 25, 75);

    // Joystick Visível
    if(joystick.active) {
        ctx.strokeStyle="white"; ctx.lineWidth=3;
        ctx.beginPath(); ctx.arc(joystick.baseX, joystick.baseY, 50, 0, 7); ctx.stroke();
        ctx.fillStyle="rgba(255,255,255,0.3)";
        ctx.beginPath(); ctx.arc(joystick.stickX, joystick.stickY, 25, 0, 7); ctx.fill();
    }
    
    requestAnimationFrame(update);
}

// Comandos Mobile / Desktop
window.addEventListener('dblclick', () => {
    if(player.skillCD <= 0) {
        player.skillCD = 180;
        mobs.forEach(m => {
            if(Math.hypot(player.x-m.x, player.y-m.y) < 130) { 
                m.hp -= 40; addPopup(m.x, m.y, "MEGA HIT!", "#e67e22"); 
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
