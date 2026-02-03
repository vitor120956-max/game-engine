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

// Controle Touch
canvas.addEventListener('touchmove', (e) => {
    if(!gameOver) {
        player.x = e.touches[0].clientX;
        player.y = e.touches[0].clientY;
    }
    e.preventDefault();
}, { passive: false });

// IA: Gerador de Inimigos LENTOS (Ajustado)
function spawnEnemy() {
    if(gameOver) return;
    const side = Math.floor(Math.random() * 4);
    let x, y;
    if(side === 0) { x = 0; y = Math.random() * canvas.height; }
    else if(side === 1) { x = canvas.width; y = Math.random() * canvas.height; }
    else if(side === 2) { x = Math.random() * canvas.width; y = 0; }
    else { x = Math.random() * canvas.width; y = canvas.height; }
    
    // Velocidade 0.6 (metade da anterior) para você conseguir desviar
    enemies.push({ x, y, size: 18, speed: 0.6 + (score / 2000) });
}

// IA de Defesa: Tiro Automático
setInterval(() => {
    if(!gameOver && enemies.length > 0) {
        // Encontra o inimigo mais próximo para atirar
        let nearest = enemies[0];
        let minDist = Math.hypot(nearest.x - player.x, nearest.y - player.y);
        
        enemies.forEach(en => {
            let d = Math.hypot(en.x - player.x, en.y - player.y);
            if(d < minDist) {
                minDist = d;
                nearest = en;
            }
        });

        let dx = nearest.x - player.x;
        let dy = nearest.y - player.y;
        let angle = Math.atan2(dy, dx);
        
        bullets.push({
            x: player.x,
            y: player.y,
            vx: Math.cos(angle) * 7,
            vy: Math.sin(angle) * 7
        });
    }
}, 500); // Atira 2 vezes por segundo

setInterval(spawnEnemy, 2000); 

function update() {
    if(gameOver) {
        ctx.fillStyle = "white";
        ctx.font = "30px Arial";
        ctx.textAlign = "center";
        ctx.fillText("FIM DE JOGO", canvas.width/2, canvas.height/2);
        ctx.fillText("Score: " + score, canvas.width/2, canvas.height/2 + 50);
        return;
    }

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Desenha Player (Com brilho)
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#00ffff";
    ctx.fillStyle = player.color;
