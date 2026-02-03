const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
document.body.appendChild(canvas);

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// --- CONFIGURAÇÃO ---
let worldSize = 4000;
let player = { x: 2000, y: 2000, s: 20, speed: 5, vx: 0, vy: 0, color: '#00ffff' };
let camera = { x: 0, y: 0 };

// Joystick
let joystick = { active: false, baseX: 0, baseY: 0, stickX: 0, stickY: 0, size: 50 };

// Entidades (Monstros e Itens)
let mobs = [];
let items = [];
const SLIME_COLOR = "#32CD32";

// Inicializar Monstros (Slimes)
for(let i=0; i<30; i++) {
    mobs.push({
        x: Math.random() * worldSize,
        y: Math.random() * worldSize,
        s: 15,
        hp: 20
    });
}

// --- CONTROLES ---
window.addEventListener('touchstart', e => {
    let touch = e.touches[0];
    joystick.active = true;
    joystick.baseX = touch.clientX;
    joystick.baseY = touch.clientY;
    joystick.stickX = touch.clientX;
    joystick.stickY = touch.clientY;
});

window.addEventListener('touchmove', e => {
    if (joystick.active) {
        let touch = e.touches[0];
        let dx = touch.clientX - joystick.baseX;
        let dy = touch.clientY - joystick.baseY;
        let dist = Math.hypot(dx, dy);
        let maxLen = joystick.size;

        if (dist > maxLen) {
            joystick.stickX = joystick.baseX + (dx / dist) * maxLen;
            joystick.stickY = joystick.baseY + (dy / dist) * maxLen;
        } else {
            joystick.stickX = touch.clientX;
            joystick.stickY = touch.clientY;
        }

        // Calcular velocidade do player
        let moveX = (joystick.stickX - joystick.baseX) / maxLen;
        let moveY = (joystick.stickY - joystick.baseY) / maxLen;
        player.vx = moveX * player.speed;
        player.vy = moveY * player.speed;
    }
    e.preventDefault();
}, { passive: false });

window.addEventListener('touchend', () => {
    joystick.active = false;
    player.vx = 0;
    player.vy = 0;
});

// --- DESENHO ---

function drawJoystick() {
    if (!joystick.active) return;
    ctx.save();
    ctx.globalAlpha = 0.5;
    // Base
    ctx.beginPath();
    ctx.arc(joystick.baseX, joystick.baseY, joystick.size, 0, Math.PI*2);
    ctx.strokeStyle = "white";
    ctx.stroke();
    // Stick (A parte que mexe)
    ctx.beginPath();
    ctx.arc(joystick.stickX, joystick.stickY, 20, 0, Math.PI*2);
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.restore();
}

function drawCharacter(x, y, color, isSlime = false) {
    ctx.save();
    ctx.translate(x - camera.x, y - camera.y);
    if(isSlime) {
        // Desenho do Slime
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(0, 0, 15, Math.PI, 0);
        ctx.lineTo(15, 10);
        ctx.quadraticCurveTo(0, 15, -15, 10);
        ctx.fill();
        // Olhinhos
        ctx.fillStyle = "white";
        ctx.fillRect(-6, -5, 4, 4); ctx.fillRect(2, -5, 4, 4);
    } else {
        // Seu Player RPG
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.beginPath(); ctx.ellipse(0, 15, 12, 6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = color; ctx.fillRect(-12, -10, 24, 20); 
        ctx.fillStyle = "#eee"; ctx.fillRect(-10, -22, 20, 15);
        ctx.fillStyle = "#222"; ctx.fillRect(-8, -17, 16, 4);
    }
    ctx.restore();
}

function drawWorld() {
    // Biomas Simples (Chão Verde)
    ctx.fillStyle = "#1b4d1b"; 
    ctx.fillRect(0 - camera.x, 0 - camera.y, worldSize, worldSize);
    
    // Grade
    ctx.strokeStyle = "#256325";
    for (let i = 0; i <= worldSize; i += 100) {
        ctx.beginPath(); ctx.moveTo(i-camera.x, 0-camera.y); ctx.lineTo(i-camera.x, worldSize-camera.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0-camera.x, i-camera.y); ctx.lineTo(worldSize-camera.x, i-camera.y); ctx.stroke();
    }
}

function update() {
    player.x = Math.max(0, Math.min(worldSize, player.x + player.vx));
    player.y = Math.max(0, Math.min(worldSize, player.y + player.vy));

    camera.x = player.x - canvas.width / 2;
    camera.y = player.y - canvas.height / 2;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawWorld();

    // 1. Monstros (Slimes)
    mobs.forEach(m => drawCharacter(m.x, m.y, SLIME_COLOR, true));

    // Player
    drawCharacter(player.x, player.y, player.color);

    drawJoystick();

    requestAnimationFrame(update);
}
update();
