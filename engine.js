const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
document.body.appendChild(canvas);
canvas.width = window.innerWidth; canvas.height = window.innerHeight;

let worldSize = 4000;
let player = { x: 2000, y: 2000, s: 24, speed: 5, vx: 0, vy: 0, color: '#00ffff', hp: 100, lvl: 1, gold: 0, frame: 0, attacking: 0 };
let cam = { x: 2000, y: 2000 };
let joystick = { active: false, baseX: 0, baseY: 0, stickX: 0, stickY: 0 };
let mobs = [], trees = [], shards = [];

// Gerador de mundo melhorado
for(let i=0; i<40; i++) mobs.push({ x: Math.random()*worldSize, y: Math.random()*worldSize, hp: 40, s: 18, t: Math.random()*10 });
for(let i=0; i<50; i++) trees.push({ x: Math.random()*worldSize, y: Math.random()*worldSize, s: 40 + Math.random()*20 });

// --- SISTEMA DE DESENHO AVANÇADO ---

function drawTree(t) {
    let gx = t.x - cam.x; let gy = t.y - cam.y;
    // Sombra projetada
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.beginPath(); ctx.ellipse(gx, gy+20, 30, 10, 0, 0, 7); ctx.fill();
    // Tronco com textura
    ctx.fillStyle = "#5D4037"; ctx.fillRect(gx-10, gy, 20, 40);
    ctx.fillStyle = "#3E2723"; ctx.fillRect(gx+2, gy, 4, 40);
    // Copa em camadas (Zelda Style)
    let colors = ["#2E7D32", "#388E3C", "#4CAF50"];
    colors.forEach((c, i) => {
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.arc(gx, gy - (i*15), t.s - (i*8), 0, 7);
        ctx.fill();
        // Detalhe de folha
        ctx.fillStyle = "rgba(255,255,255,0.1)";
        ctx.beginPath(); ctx.arc(gx-5, gy-(i*15)-5, 5, 0, 7); ctx.fill();
    });
}

function drawPlayer() {
    let gx = player.x - cam.x; let gy = player.y - cam.y;
    player.frame += 0.15;
    let walkY = Math.sin(player.frame) * 3;
    let isMoving = Math.abs(player.vx) + Math.abs(player.vy) > 0;

    // Sombra
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath(); ctx.ellipse(gx, gy+15, 15, 5, 0, 0, 7); ctx.fill();

    // Braços (Animados)
    ctx.fillStyle = player.color;
    let armX = isMoving ? Math.sin(player.frame)*8 : 0;
    ctx.fillRect(gx-20, gy-5 + armX, 8, 8); // Esq
    ctx.fillRect(gx+12, gy-5 - armX, 8, 8); // Dir

    // Ataque (Efeito de Espada)
    if(player.attacking > 0) {
        player.attacking -= 0.1;
        ctx.strokeStyle = "white"; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(gx, gy, 40, -1, 1); ctx.stroke();
    }

    // Corpo e Cabeça
    ctx.fillStyle = player.color; ctx.fillRect(gx-12, gy-10 + walkY, 24, 25); 
    ctx.fillStyle = "#FFCCBC"; ctx.fillRect(gx-10, gy-25 + walkY, 20, 18); // Rosto
    
    // Olhos que seguem o movimento
    ctx.fillStyle = "#000";
    let eyeX = (player.vx/player.speed)*2;
    ctx.fillRect(gx-6 + eyeX, gy-20 + walkY, 3, 5);
    ctx.fillRect(gx+3 + eyeX, gy-20 + walkY, 3, 5);
}

function drawMob(m) {
    let gx = m.x - cam.x; let gy = m.y - cam.y;
    m.t += 0.1;
    let sq = Math.sin(m.t) * 4;
    
    // Corpo Slime Detalhado
    let grad = ctx.createRadialGradient(gx, gy, 2, gx, gy, 20);
    grad.addColorStop(0, "#81C784"); grad.addColorStop(1, "#2E7D32");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(gx, gy+sq, 18+sq, 15-sq, 0, 0, 7);
    ctx.fill();

    // Olhos Bravos
    ctx.fillStyle = "white";
    ctx.beginPath(); ctx.arc(gx-7, gy+sq-2, 4, 0, 7); ctx.arc(gx+7, gy+sq-2, 4, 0, 7); ctx.fill();
    ctx.fillStyle = "black";
    ctx.beginPath(); ctx.arc(gx-7, gy+sq-2, 2, 0, 7); ctx.arc(gx+7, gy+sq-2, 2, 0, 7); ctx.fill();
}

function update() {
    // Câmera Lerp
    cam.x += (player.x - canvas.width/2 - cam.x) * 0.1;
    cam.y += (player.y - canvas.height/2 - cam.y) * 0.1;

    // Movimento com Colisão Simples
    let nx = player.x + player.vx, ny = player.y + player.vy;
    let col = false;
    trees.forEach(t => { if(Math.hypot(nx-t.x, ny-t.y) < 40) col = true; });
    if(!col) { player.x = nx; player.y = ny; }

    // Fundo
    ctx.fillStyle = "#1B5E20"; ctx.fillRect(0,0,canvas.width,canvas.height);

    trees.forEach(drawTree);

    mobs.forEach((m, i) => {
        let d = Math.hypot(player.x-m.x, player.y-m.y);
        if(d < 250) { m.x += (player.x-m.x)/d*2; m.y += (player.y-m.y)/d*2; }
        drawMob(m);
        if(d < 50) {
            player.attacking = 1; m.hp -= 2;
            if(m.hp <= 0) {
                for(let j=0; j<8; j++) shards.push({x:m.x, y:m.y, vx:(Math.random()-0.5)*10, vy:(Math.random()-0.5)*10, v:1});
                mobs.splice(i,1); player.gold += 10;
            }
        }
    });

    // Partículas de Morte (Desintegração)
    shards.forEach((s, i) => {
        s.x += s.vx; s.y += s.vy; s.v -= 0.02;
        ctx.fillStyle = `rgba(46, 125, 50, ${s.v})`;
        ctx.fillRect(s.x-cam.x, s.y-cam.y, 6, 6);
        if(s.v <= 0) shards.splice(i, 1);
    });

    drawPlayer();

    // Joystick HUD
    if(joystick.active) {
        ctx.beginPath(); ctx.arc(joystick.baseX, joystick.baseY, 50, 0, 7); ctx.strokeStyle="white"; ctx.stroke();
        ctx.beginPath(); ctx.arc(joystick.stickX, joystick.stickY, 25, 0, 7); ctx.fillStyle="rgba(255,255,255,0.5)"; ctx.fill();
    }

    requestAnimationFrame(update);
}

// Eventos Touch
window.addEventListener('touchstart', e => {
    let t = e.touches[0]; joystick.active = true;
    joystick.baseX = t.clientX; joystick.baseY = t.clientY;
    joystick.stickX = t.clientX; joystick.stickY = t.clientY;
});
window.addEventListener('touchmove', e => {
    if(joystick.active) {
        let t = e.touches[0];
        let dx = t.clientX-joystick.baseX, dy = t.clientY-joystick.baseY, dist = Math.hypot(dx, dy);
        if(dist > 50) { joystick.stickX = joystick.baseX+(dx/dist)*50; joystick.stickY = joystick.baseY+(dy/dist)*50; }
        else { joystick.stickX = t.clientX; joystick.stickY = t.clientY; }
        player.vx = ((joystick.stickX-joystick.baseX)/50)*player.speed;
        player.vy = ((joystick.stickY-joystick.baseY)/50)*player.speed;
    }
    e.preventDefault();
}, {passive:false});
window.addEventListener('touchend', () => { joystick.active=false; player.vx=0; player.vy=0; });

update();
