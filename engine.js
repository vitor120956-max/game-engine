const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
document.body.appendChild(canvas);
canvas.width = window.innerWidth; canvas.height = window.innerHeight;

// --- CONFIGURAÇÃO ---
let worldSize = 4000;
let player = { x: 2000, y: 2000, s: 20, speed: 5, vx: 0, vy: 0, color: '#00ffff', hp: 100, gold: 0, xp: 0, lvl: 1, atkDmg: 5 };
let camera = { x: 0, y: 0 };
let joystick = { active: false, baseX: 0, baseY: 0, stickX: 0, stickY: 0, size: 50 };

let mobs = [], coins = [], trees = [];
let npc = { x: 2100, y: 1900, name: "Mestre Ryu" };

// Gerar Mundo
for(let i=0; i<40; i++) mobs.push({ x: Math.random()*worldSize, y: Math.random()*worldSize, hp: 20, maxHp: 20 });
for(let i=0; i<60; i++) coins.push({ x: Math.random()*worldSize, y: Math.random()*worldSize });
for(let i=0; i<30; i++) trees.push({ x: Math.random()*worldSize, y: Math.random()*worldSize, s: 40 });

// --- CONTROLES ---
window.addEventListener('touchstart', e => {
    let t = e.touches[0]; joystick.active = true;
    joystick.baseX = t.clientX; joystick.baseY = t.clientY;
    joystick.stickX = t.clientX; joystick.stickY = t.clientY;
});
window.addEventListener('touchmove', e => {
    if (joystick.active) {
        let t = e.touches[0];
        let dx = t.clientX - joystick.baseX, dy = t.clientY - joystick.baseY;
        let dist = Math.hypot(dx, dy);
        let max = joystick.size;
        if (dist > max) {
            joystick.stickX = joystick.baseX + (dx/dist)*max;
            joystick.stickY = joystick.baseY + (dy/dist)*max;
        } else {
            joystick.stickX = t.clientX; joystick.stickY = t.clientY;
        }
        player.vx = ((joystick.stickX - joystick.baseX)/max) * player.speed;
        player.vy = ((joystick.stickY - joystick.baseY)/max) * player.speed;
    }
    e.preventDefault();
}, { passive: false });
window.addEventListener('touchend', () => { joystick.active=false; player.vx=0; player.vy=0; });

// --- LÓGICA DE JOGO ---
function checkCollision(obj1, obj2, dist) {
    return Math.hypot(obj1.x - obj2.x, obj1.y - obj2.y) < dist;
}

function update() {
    // Tenta mover em X
    let nextX = player.x + player.vx;
    let canMoveX = true;
    trees.forEach(t => { if(checkCollision({x: nextX, y: player.y}, t, 50)) canMoveX = false; });
    if(canMoveX) player.x = Math.max(0, Math.min(worldSize, nextX));

    // Tenta mover em Y
    let nextY = player.y + player.vy;
    let canMoveY = true;
    trees.forEach(t => { if(checkCollision({x: player.x, y: nextY}, t, 50)) canMoveY = false; });
    if(canMoveY) player.y = Math.max(0, Math.min(worldSize, nextY));

    camera.x = player.x - canvas.width/2;
    camera.y = player.y - canvas.height/2;

    // Renderizar Fundo
    ctx.fillStyle = "#1b4d1b"; ctx.fillRect(0,0,canvas.width,canvas.height);

    // Árvores
    trees.forEach(t => {
        ctx.fillStyle = "#3e2723"; ctx.fillRect(t.x-camera.x-10, t.y-camera.y, 20, 30);
        ctx.fillStyle = "#2e7d32"; ctx.beginPath(); ctx.arc(t.x-camera.x, t.y-camera.y-10, 30, 0, 7); ctx.fill();
    });

    // Moedas
    coins.forEach((c, i) => {
        ctx.fillStyle = "#ffd700"; ctx.beginPath(); ctx.arc(c.x-camera.x, c.y-camera.y, 8, 0, 7); ctx.fill();
        if(checkCollision(player, c, 30)) { coins.splice(i, 1); player.gold += 10; }
    });

    // Monstros e Combate
    mobs.forEach((m, i) => {
        ctx.fillStyle = "#32CD32"; ctx.beginPath(); ctx.arc(m.x-camera.x, m.y-camera.y, 15, 0, 7); ctx.fill();
        // Barra de Vida do Mob
        ctx.fillStyle = "red"; ctx.fillRect(m.x-camera.x-15, m.y-camera.y-25, 30, 4);
        ctx.fillStyle = "lime"; ctx.fillRect(m.x-camera.x-15, m.y-camera.y-25, (m.hp/m.maxHp)*30, 4);

        if(checkCollision(player, m, 60)) {
            // Ataque automático
            m.hp -= 0.5;
            ctx.strokeStyle = "white"; ctx.lineWidth = 3; ctx.beginPath();
            ctx.moveTo(m.x-camera.x-20, m.y-camera.y); ctx.lineTo(m.x-camera.x+20, m.y-camera.y); ctx.stroke();
            if(m.hp <= 0) {
                mobs.splice(i, 1); player.xp += 20;
                if(player.xp >= 100) { player.lvl++; player.xp = 0; player.atkDmg += 2; }
            }
        }
    });

    // NPC e Loja Automática
    ctx.fillStyle = "#ff00ff"; ctx.fillRect(npc.x-camera.x-15, npc.y-camera.y-15, 30, 30);
    if(checkCollision(player, npc, 60)) {
        ctx.fillStyle = "white"; ctx.textAlign="center"; 
        let txt = player.gold >= 50 ? "Você agora é um Guerreiro Dourado!" : "Traga 50 de ouro para uma nova skin!";
        ctx.fillText(txt, canvas.width/2, canvas.height-50);
        if(player.gold >= 50) player.color = "#ffd700";
    }

    // Player
    ctx.fillStyle = player.color; ctx.fillRect(player.x-camera.x-15, player.y-camera.y-15, 30, 30);
    
    // HUD
    ctx.fillStyle = "white"; ctx.textAlign="left"; ctx.font = "bold 16px Arial";
    ctx.fillText(`Nível: ${player.lvl} | Gold: ${player.gold}`, 20, 30);
    ctx.fillStyle = "#555"; ctx.fillRect(20, 45, 100, 10);
    ctx.fillStyle = "#0ff"; ctx.fillRect(20, 45, (player.xp/100)*100, 10);

    // Joystick
    if(joystick.active) {
        ctx.globalAlpha=0.5;
        ctx.beginPath(); ctx.arc(joystick.baseX, joystick.baseY, 50, 0, 7); ctx.strokeStyle="white"; ctx.stroke();
        ctx.beginPath(); ctx.arc(joystick.stickX, joystick.stickY, 20, 0, 7); ctx.fillStyle="white"; ctx.fill();
        ctx.globalAlpha=1;
    }
    requestAnimationFrame(update);
}
update();
