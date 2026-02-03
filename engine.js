const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
document.body.appendChild(canvas);
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// --- ESTADO DO JOGO ---
let worldSize = 4000;
let player = { x: 2000, y: 2000, s: 20, speed: 5, vx: 0, vy: 0, color: '#00ffff', hp: 100, gold: 0 };
let camera = { x: 0, y: 0 };
let joystick = { active: false, baseX: 0, baseY: 0, stickX: 0, stickY: 0, size: 50 };

// Entidades
let mobs = [];
let coins = [];
let npc = { x: 2050, y: 1950, name: "Mestre Ryu", msg: "Bem-vindo ao Mundo Aberto! Explore e colete ouro." };

// Gerar Slimes e Moedas inicial
for(let i=0; i<40; i++) {
    mobs.push({ x: Math.random()*worldSize, y: Math.random()*worldSize, s: 15 });
    coins.push({ x: Math.random()*worldSize, y: Math.random()*worldSize, s: 8 });
}

// --- CONTROLES (Touch) ---
window.addEventListener('touchstart', e => {
    let t = e.touches[0];
    joystick.active = true;
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

// --- FUNÇÕES DE DESENHO ---

function drawHUD() {
    // Barra de Vida
    ctx.fillStyle = "#333"; ctx.fillRect(20, 20, 150, 20);
    ctx.fillStyle = "#f00"; ctx.fillRect(20, 20, (player.hp/100)*150, 20);
    // Gold
    ctx.fillStyle = "#ffd700"; ctx.font = "bold 18px Arial";
    ctx.fillText("💰 Gold: " + player.gold, 20, 65);
}

function drawEntity(x, y, color, type) {
    ctx.save();
    ctx.translate(x - camera.x, y - camera.y);
    if(type === 'coin') {
        ctx.fillStyle = "#ffd700"; ctx.beginPath(); ctx.arc(0,0,8,0,7); ctx.fill();
        ctx.strokeStyle = "#b8860b"; ctx.stroke();
    } else if(type === 'npc') {
        ctx.fillStyle = "#ff00ff"; ctx.fillRect(-15, -15, 30, 30); // NPC Roxo
        ctx.fillStyle = "white"; ctx.textAlign="center"; ctx.fillText(npc.name, 0, -25);
    } else if(type === 'slime') {
        ctx.fillStyle = "#32CD32"; ctx.beginPath(); ctx.arc(0,0,15,Math.PI,0); ctx.fill();
    }
    ctx.restore();
}

function update() {
    player.x = Math.max(0, Math.min(worldSize, player.x + player.vx));
    player.y = Math.max(0, Math.min(worldSize, player.y + player.vy));
    camera.x = player.x - canvas.width/2; camera.y = player.y - canvas.height/2;

    ctx.fillStyle = "#1b4d1b"; ctx.fillRect(0,0,canvas.width,canvas.height); // Grama

    // Desenhar Moedas e Coletar
    coins.forEach((c, i) => {
        drawEntity(c.x, c.y, null, 'coin');
        if(Math.hypot(player.x-c.x, player.y-c.y) < 25) { coins.splice(i, 1); player.gold += 10; }
    });

    // Desenhar NPC e Diálogo
    drawEntity(npc.x, npc.y, null, 'npc');
    if(Math.hypot(player.x-npc.x, player.y-npc.y) < 60) {
        ctx.fillStyle = "white"; ctx.textAlign="center";
        ctx.fillText(npc.msg, canvas.width/2, canvas.height - 100);
    }

    // Desenhar Mobs
    mobs.forEach(m => drawEntity(m.x, m.y, null, 'slime'));

    // Player
    ctx.fillStyle = player.color; ctx.fillRect(player.x-camera.x-12, player.y-camera.y-12, 24, 24);

    // Joystick
    if(joystick.active) {
        ctx.globalAlpha=0.5;
        ctx.beginPath(); ctx.arc(joystick.baseX, joystick.baseY, joystick.size, 0, 7); ctx.strokeStyle="white"; ctx.stroke();
        ctx.beginPath(); ctx.arc(joystick.stickX, joystick.stickY, 20, 0, 7); ctx.fillStyle="white"; ctx.fill();
        ctx.globalAlpha=1;
    }

    drawHUD();
    requestAnimationFrame(update);
}
update();
