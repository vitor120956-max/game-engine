
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
document.body.appendChild(canvas);

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let player = { x: canvas.width / 2, y: canvas.height / 2, size: 25, color: '#00ffff' };

// Controlar com o dedo
canvas.addEventListener('touchmove', (e) => {
    player.x = e.touches[0].clientX;
    player.y = e.touches[0].clientY;
    e.preventDefault(); 
}, { passive: false });

function draw() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Desenha o Player (Círculo Ciano)
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
    ctx.fill();

    requestAnimationFrame(draw);
}
draw();
