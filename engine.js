const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
document.body.appendChild(canvas);

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Estado do Jogo
let worldSize = 4000;
let player = { x: 2000, y: 2000, s: 20, speed: 5, vx: 0, vy: 0, color: '#00ffff' };
let camera = { x: 0, y: 0 };
let touchStart = null;

// Sistema de Controle (Mobile)
window.addEventListener('touchstart', e => { 
    touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY }; 
});

window.addEventListener('touchmove', e => {
    if (touchStart) {
        let dx = e.touches[0].clientX - touchStart.x;
        let dy = e.touches[0].clientY - touchStart.y;
        let dist = Math.hypot(dx, dy);
        player.vx = (dx / dist) * player.speed;
        player.vy = (dy / dist) * player.speed;
    }
    e.preventDefault();
}, { passive: false });

window.addEventListener('touchend', () => { player.vx = 0; player.vy = 0; touchStart = null; });

// Função que desenha o Sprite Detalhado (Estilo RPG)
function drawCharacter(x, y, color) {
    ctx.save();
    ctx.translate(x - camera.x, y - camera.y);

    // Sombra
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.ellipse(0, 15, 12, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Capa/Corpo
    ctx.fillStyle = color;
    ctx.fillRect(-12, -10, 24, 20); 

    // Cabeça
    ctx.fillStyle = "#eee";
    ctx.fillRect(-10, -22, 20, 15);

    // Viseira (Olhos)
    ctx.fillStyle = "#222";
    ctx.fillRect(-8, -17, 16, 4);

    // Mãos Animadas (Procedural)
    ctx.fillStyle = color;
    let swing = Math.sin(Date.now() / 150) * 4;
    if(player.vx !== 0 || player.vy !== 0) {
        ctx.fillRect(-16, -5 + swing, 6, 6); // Mão Esq
        ctx.fillRect(10, -5 - swing, 6, 6);  // Mão Dir
    } else {
        ctx.fillRect(-15, -5, 5, 5);
        ctx.fillRect(10, -5, 5, 5);
    }

    ctx.restore();
}

function drawGrid() {
    ctx.strokeStyle = "#222";
    ctx.lineWidth = 1;
    let size = 100;
    for (let x = 0; x <= worldSize; x += size) {
        ctx.beginPath();
        ctx.moveTo(x - camera.x, 0 - camera.y);
        ctx.lineTo(x - camera.x, worldSize - camera.y);
        ctx.stroke();
    }
    for (let y = 0; y <= worldSize; y += size) {
        ctx.beginPath();
        ctx.moveTo(0 - camera.x, y - camera.y);
        ctx.lineTo(worldSize - camera.x, y - camera.y);
        ctx.stroke();
    }
}

function update() {
    // Física de Movimento
    player.x += player.vx;
    player.y += player.vy;

    // Limites do Mundo
    player.x = Math.max(0, Math.min(worldSize, player.x));
    player.y = Math.max(0, Math.min(worldSize, player.y));

    // Câmera Suave seguindo o Player
    camera.x = player.x - canvas.width / 2;
    camera.y = player.y - canvas.height / 2;

    // Renderização
    ctx.fillStyle = "#111"; // Fundo Escuro
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawGrid();
    drawCharacter(player.x, player.y, player.color);

    // Mini Interface de Posição
    ctx.fillStyle = "white";
    ctx.font = "14px Monospace";
    ctx.fillText(`COORDENADAS: X:${Math.floor(player.x)} Y:${Math.floor(player.y)}`, 20, 30);

    requestAnimationFrame(update);
}

update();
