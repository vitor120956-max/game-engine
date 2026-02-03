const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
document.body.appendChild(canvas);

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let player = { x: canvas.width / 2, y: canvas.height / 2, size: 20, color: '#00ffff' };
let enemies = [];
let score = 0;
let gameOver = false;

// Controle Touch
canvas.addEventListener('touchmove', (e) => {
    if(!gameOver) {
        player.x = e.touches[0].clientX;
        player.y = e.touches[0].clientY;
    }
    e.preventDefault();
}, { passive: false });

// IA: Criar inimigos em posições aleatórias
function spawnEnemy() {
    if(gameOver) return;
    const side = Math.floor(Math.random() * 4);
    let x, y;
    if(side === 0) { x = 0; y = Math.random() * canvas.height; }
    else if(side === 1) { x = canvas.width; y = Math.random() * canvas.height; }
    else if(side === 2) { x = Math.random() * canvas.width; y = 0; }
    else { x = Math.random() * canvas.width; y = canvas.height; }
    
    enemies.push({ x, y, size: 15, speed: 1.5 + (score / 10) });
}

setInterval(spawnEnemy, 1500); // Um novo inimigo a cada 1.5s

function update() {
    if(gameOver) {
        ctx.fillStyle = "white";
        ctx.font = "30px Arial";
        ctx.fillText("GAME OVER", canvas.width/2 - 80, canvas.height/2);
        ctx.fillText("Score: " + score, canvas.width/2 - 50, canvas.height/2 + 40);
        return;
    }

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Desenha Player
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
    ctx.fill();

    // IA de Movimentação dos Inimigos
    enemies.forEach((en, index) => {
        let dx = player.x - en.x;
        let dy = player.y - en.y;
        let dist = Math.hypot(dx, dy);
        
        // Move em direção ao player
        en.x += (dx / dist) * en.speed;
        en.y += (dy / dist) * en.speed;

        // Desenha inimigo (quadrado vermelho)
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(en.x - en.size/2, en.y - en.size/2, en.size, en.size);

        // Detecção de Colisão
        if(dist < player.size + en.size/2) {
            gameOver = true;
        }
    });

    score++;
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText("Score: " + score, 20, 40);

    requestAnimationFrame(update);
}
update();
