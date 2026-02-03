const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
document.body.appendChild(canvas);

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let player = { x: canvas.width / 2, y: canvas.height / 2, size: 22, color: '#00ffff' };
let enemies = [];
let bullets = [];
let score = 0;
let gameOver = false;

// Controle Touch Suave
canvas.addEventListener('touchmove', (e) => {
    if(!gameOver) {
        player.x = e.touches[0].clientX;
        player.y = e.touches[0].clientY;
    }
    e.preventDefault();
}, { passive: false });

// IA: Gerador de Inimigos (Equilibrado)
function spawnEnemy() {
    if(gameOver) return;
    const side = Math.floor(Math.random() * 4);
    let x, y;
    if(side === 0) { x = 0; y = Math.random() * canvas.height; }
    else if(side === 1) { x = canvas.width; y = Math.random() * canvas.height; }
    else if(side === 2) { x = Math.random() * canvas.width; y = 0; }
    else { x = Math.random() * canvas.width; y = canvas.height; }
    
    // Velocidade justa: começa devagar e aumenta com o tempo
    enemies.push({ x, y, size: 18, speed: 1.2 + (score / 500) });
}

// Sistema de Tiro Automático (IA de Defesa)
setInterval(() => {
    if(!gameOver && enemies.length > 0) {
        // Atira no inimigo mais próximo
        let target = enemies[0];
        let dx = target.x - player.x;
        let dy = target.y - player.y;
        let angle = Math.atan2(dy, dx);
        
        bullets.push({
            x: player.x,
            y: player.y,
            velX: Math.cos(angle) * 5,
            velY: Math.sin(angle) * 5
        });
    }
}, 600); // Um tiro a cada 0.6 segundos

setInterval(spawnEnemy, 2000); 

function update() {
    if(gameOver) {
        ctx.fillStyle = "white";
        ctx.font = "bold 40px Arial";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", canvas.width/2, canvas.height/2);
        ctx.font = "20px Arial";
        ctx.fillText("Toque para reiniciar", canvas.width/2, canvas.height/2 + 50);
        return;
    }

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Desenha Player
    ctx.shadowBlur = 15;
    ctx.shadowColor = player.color;
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Processa Tiros
    bullets.forEach((b, bIdx) => {
        b.x += b.velX;
        b.y += b.velY;
        ctx.fillStyle = "yellow";
        ctx.beginPath();
        ctx.arc(b.x, b.y, 4, 0, Math.PI*2);
        ctx.fill();

        // Remove tiros fora da tela
        if(b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
            bullets.splice(bIdx, 1);
        }
    });

    // IA dos Inimigos e Colisões
    enemies.forEach((en, eIdx) => {
        let dx = player.x - en.x;
        let dy = player.y - en.y;
        let dist = Math.hypot(dx, dy);
        
        en.x += (dx / dist) * en.speed;
        en.y += (dy / dist) * en.speed;

        ctx.fillStyle = '#ff4444';
        ctx.fillRect(en.x - en.size/2, en.y - en.size/2, en.size, en.size);

        // Colisão Tiro -> Inimigo
        bullets.forEach((b, bIdx) => {
            let dBullet = Math.hypot(en.x - b.x, en.y - b.y);
            if(dBullet < en.size) {
                enemies.splice(eIdx, 1);
                bullets.splice(bIdx, 1);
                score += 10;
            }
        });

        // Colisão Inimigo -> Player
        if(dist < player.size) {
            gameOver = true;
        }
    });

    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.textAlign = "left";
    ctx.fillText("Score: " + score, 20, 40);

    requestAnimationFrame(update);
}

// Reiniciar ao tocar na tela após morrer
canvas.addEventListener('touchstart', () => {
    if(gameOver) {
        location.reload();
    }
});

update();
