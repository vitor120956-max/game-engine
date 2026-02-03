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

// --- SISTEMA CORE ---
let worldSize = 6000;
let player = { 
    x: 3000, y: 3000, s: 30, speed: 5, vx: 0, vy: 0, 
    color: '#3498db', hp: 100, maxHp: 100, xp: 0, maxXp: 100, lvl: 1, gold: 0,
    dir: 1, frame: 0, skillCD: 0, dmg: 5, target: null,
    meleeLvl: 1, meleeXP: 0
};

let cam = { x: 3000, y: 3000 };
let mobs = [], loot = [], popups = [], joystick = { active: false, baseX: 0, baseY: 0, stickX: 0, stickY: 0 };

// Inimigos com IA de Distância
for(let i=0; i<60; i++) spawnMob();

function spawnMob() {
    let types = [{name:"Slime", col:"#2ecc71", hp:60}, {name:"Bat", col:"#9b59b6", hp:40}];
    let t = types[Math.floor(Math.random()*types.length)];
    mobs.push({ 
        x: Math.random()*worldSize, y: Math.random()*worldSize, 
        hp: t.hp, maxHp: t.hp, s: 25, col: t.col, t: Math.random()*10, id: Math.random()
    });
}

function addPopup(x, y, text, color) {
    popups.push({ x, y, text, color, life: 1, vy: -2 });
}

// --- RENDER ---

function drawHUD() {
    // Barra de Vida e XP (Kakele Style)
    ctx.fillStyle = "rgba(0,0,0,0.8)"; ctx.fillRect(10, 10, 200, 60);
    ctx.fillStyle = "#e74c3c"; ctx.fillRect(15, 20, (player.hp/player.maxHp)*190, 15);
    ctx.fillStyle = "#3498db"; ctx.fillRect(15, 40, (player.xp/player.maxXp)*190, 8);
    ctx.fillStyle = "white"; ctx.font = "bold 12px Arial";
    ctx.fillText(`LVL ${player.lvl} | Melee: ${player.meleeLvl}`, 15, 62);

    // Botão de Skill (Rucoy Style)
    ctx.fillStyle = player.skillCD > 0 ? "#7f8c8d" : "#e67e22";
    ctx.beginPath(); ctx.arc(canvas.width - 60, canvas.height - 60, 40, 0, 7); ctx.fill();
    ctx.fillStyle = "white"; ctx.fillText("SKILL", canvas.width - 80, canvas.height - 55);

    // Mini-Mapa
    ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(canvas.width - 110, 10, 100, 100);
    ctx.fillStyle = "white"; 
    let mx = (player.x / worldSize) * 100;
    let my = (player.y / worldSize) * 100;
    ctx.fillRect(canvas.width - 110 + mx, 10 + my, 4, 4);
}

function update() {
    ctx.fillStyle = "#111"; ctx.fillRect(0, 0, canvas.width, canvas.height); // Limpeza de tela

    // Movimento Joystick
    if(joystick.active) {
        let dx = joystick.stickX - joystick.baseX, dy = joystick.stickY - joystick.baseY, dist = Math.hypot(dx, dy);
        if(dist > 5) {
            player.vx = (dx/dist) * player.speed; player.vy = (dy/dist) * player.speed;
            player.dir = player.vx > 0 ? 1 : -1;
        }
    } else { player.vx *= 0.8; player.vy *= 0.8; }

    player.x = Math.max(0, Math.min(worldSize, player.x + player.vx));
    player.y = Math.max(0, Math.min(worldSize, player.y + player.vy));
    cam.x = player.x - canvas.width / 2;
    cam.y = player.y - canvas.height / 2;

    if(player.skillCD > 0) player.skillCD--;

    // Desenhar Chão
    ctx.fillStyle = "#27ae60"; ctx.fillRect(-cam.x, -cam.y, worldSize, worldSize);

    // Mobs e Target System
    mobs.forEach((m, i) => {
        let gx = m.x-cam.x, gy = m.y-cam.y;
        let d = Math.hypot(player.x-m.x, player.y-m.y);

        // Se for o alvo selecionado, desenha o círculo (Rucoy Style)
        if(player.target === m.id) {
            ctx.strokeStyle = "red"; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(gx, gy+10, 30, 0, 7); ctx.stroke();
            
            // Auto Attack no Target
            if(d < 60) {
                m.hp -= 0.5;
                player.meleeXP += 0.1;
                if(Math.random() > 0.95) addPopup(m.x, m.y, `-${player.dmg}`, "white");
            }
        }

        // Render Mob
        ctx.fillStyle = m.col; ctx.fillRect(gx-15, gy-15, 30, 30);
        ctx.fillStyle = "#2ecc71"; ctx.fillRect(gx-15, gy-25, (m.hp/m.maxHp)*30, 5);

        if(m.hp <= 0) {
            player.xp += 20; if(player.target === m.id) player.target = null;
            mobs.splice(i, 1); spawnMob();
        }
    });

    // Popups
    popups.forEach((p, i) => {
        p.y += p.vy; p.life -= 0.02;
        ctx.fillStyle = p.color; ctx.globalAlpha = p.life;
        ctx.fillText(p.text, p.x-cam.x, p.y-cam.y);
        if(p.life <= 0) popups.splice(i, 1);
    });

    // Leveling Melee
    if(player.meleeXP >= 100) {
        player.meleeLvl++; player.meleeXP = 0; player.dmg += 2;
        addPopup(player.x, player.y, "MELEE UP!", "#f1c40f");
    }

    // Desenhar Player
    let px = player.x-cam.x, py = player.y-cam.y;
    ctx.fillStyle = player.color; ctx.fillRect(px-15, py-15, 30, 30); // Simplificado para performance

    drawHUD();

    // Joystick Draw
    if(joystick.active) {
        ctx.strokeStyle="white"; ctx.beginPath(); ctx.arc(joystick.baseX, joystick.baseY, 50, 0, 7); ctx.stroke();
        ctx.fillStyle="rgba(255,255,255,0.3)"; ctx.beginPath(); ctx.arc(joystick.stickX, joystick.stickY, 25, 0, 7); ctx.fill();
    }
    
    requestAnimationFrame(update);
}

// Clique para selecionar Target (Rucoy/Kakele)
window.addEventListener('mousedown', e => {
    let tx = e.clientX + cam.x;
    let ty = e.clientY + cam.y;
    mobs.forEach(m => {
        if(Math.hypot(tx-m.x, ty-m.y) < 40) player.target = m.id;
    });
    // Clique no botão de Skill
    if(Math.hypot(e.clientX - (canvas.width-60), e.clientY - (canvas.height-60)) < 40) {
        if(player.skillCD <= 0) {
            player.skillCD = 100;
            addPopup(player.x, player.y, "POWER!", "#e67e22");
            mobs.forEach(m => { if(Math.hypot(player.x-m.x, player.y-m.y) < 150) m.hp -= 30; });
        }
    }
});

// Touch Events (Joystick)
window.addEventListener('touchstart', e => {
    let t = e.touches[0];
    if(t.clientX < canvas.width/2) {
        joystick.active = true;
        joystick.baseX = t.clientX; joystick.baseY = t.clientY;
        joystick.stickX = t.clientX; joystick.stickY = t.clientY;
    }
});
window.addEventListener('touchmove', e => {
    if(joystick.active) {
        let t = e.touches[0];
        let dx = t.clientX-joystick.baseX, dy = t.clientY-joystick.baseY, dist = Math.hypot(dx, dy);
        if(dist > 50) { joystick.stickX = joystick.baseX+(dx/dist)*50; joystick.stickY = joystick.baseY+(dy/dist)*50; }
        else { joystick.stickX = t.clientX; joystick.stickY = t.clientY; }
    }
}, {passive: false});
window.addEventListener('touchend', () => { joystick.active = false; });

update();
