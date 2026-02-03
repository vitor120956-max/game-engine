const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
document.body.appendChild(canvas);
canvas.width = window.innerWidth; canvas.height = window.innerHeight;

// --- SISTEMA DE CONFIGURAÇÃO ---
let worldSize = 4000;
let player = { x: 2000, y: 2000, s: 20, speed: 5, vx: 0, vy: 0, color: '#00ffff', hp: 100, gold: 0, xp: 0, lvl: 1, anim: 0 };
let cam = { x: 2000, y: 2000, lerp: 0.1 };
let joystick = { active: false, baseX: 0, baseY: 0, stickX: 0, stickY: 0, size: 55 };

let mobs = [], trees = [], particles = [];

// Gerar Mundo com Variedade
for(let i=0; i<35; i++) mobs.push({ x: Math.random()*worldSize, y: Math.random()*worldSize, hp: 30, s: 15, vx: 0, vy: 0, t: Math.random()*100 });
for(let i=0; i<40; i++) trees.push({ x: Math.random()*worldSize, y: Math.random()*worldSize, s: 35 + Math.random()*20, offset: Math.random()*5 });

// --- CONTROLES ---
window.addEventListener('touchstart', e => {
    let t = e.touches[0]; joystick.active = true;
    joystick.baseX = t.clientX; joystick.baseY = t.clientY;
    joystick.stickX = t.clientX; joystick.stickY = t.clientY;
}, {passive: false});

window.addEventListener('touchmove', e => {
    if (joystick.active) {
        let t = e.touches[0];
        let dx = t.clientX - joystick.baseX, dy = t.clientY - joystick.baseY;
        let dist = Math.hypot(dx, dy);
        let max = joystick.size;
        if (dist > max) {
            joystick.stickX = joystick.baseX + (dx/dist)*max;
            joystick.stickY = joystick.baseY + (dy/dist)*max;
        } else { joystick.stickX = t.clientX; joystick.stickY = t.clientY; }
        player.vx = ((joystick.stickX - joystick.baseX)/max) * player.speed;
        player.vy = ((joystick.stickY - joystick.baseY)/max) * player.speed;
    }
}, {passive: false});

window.addEventListener('touchend', () => { joystick.active=false; player.vx=0; player.vy=0; });

// --- FUNÇÕES GRÁFICAS ---

function spawnPart(x, y, color) {
    for(let i=0; i<5; i++) particles.push({x, y, vx:(Math.random()-0.5)*4, vy:(Math.random()-0.5)*4, life: 1, color});
}

function drawTree(t) {
    let wind = Math.sin(Date.now()/1000 + t.offset) * 3;
    ctx.fillStyle = "#3e2723"; ctx.fillRect(t.x-cam.x-8, t.y-cam.y, 16, 25); // Tronco
    ctx.fillStyle = "#2e7d32"; 
    ctx.beginPath(); 
    ctx.arc(t.x-cam.x + wind, t.y-cam.y-15, t.s, 0, 7); // Copa balançando
    ctx.fill();
}

function drawMob(m) {
    m.t += 0.1;
    let wobble = Math.sin(m.t) * 3;
    ctx.fillStyle = "rgba(0,0,0,0.2)"; // Sombra
    ctx.beginPath(); ctx.ellipse(m.x-cam.x, m.y-cam.y+12, 12, 5, 0, 0, 7); ctx.fill();
    
    ctx.fillStyle = "#32CD32";
    ctx.beginPath(); 
    ctx.ellipse(m.x-cam.x, m.y-cam.y + wobble, 15 + wobble/2, 15 - wobble/2, 0, 0, 7); 
    ctx.fill();
}

function update() {
    // Câmera Suave (Lerp)
    cam.x += (player.x - canvas.width/2 - cam.x) * cam.lerp;
    cam.y += (player.y - canvas.height/2 - cam.y) * cam.lerp;

    // Movimentação e Colisão
    let nx = player.x + player.vx, ny = player.y + player.vy;
    let collision = false;
    trees.forEach(t => { if(Math.hypot(nx-t.x, ny-t.y) < 45) collision = true; });
    if(!collision) { player.x = nx; player.y = ny; }

    // Render
    ctx.fillStyle = "#143314"; ctx.fillRect(0,0,canvas.width,canvas.height); // Solo Escuro

    // Partículas
    particles.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy; p.life -= 0.02;
        ctx.globalAlpha = p.life; ctx.fillStyle = p.color;
        ctx.fillRect(p.x-cam.x, p.y-cam.y, 4, 4);
        if(p.life <= 0) particles.splice(i, 1);
    });
    ctx.globalAlpha = 1;

    trees.forEach(drawTree);

    mobs.forEach((m, i) => {
        // IA: Vagar ou Perseguir
        let dist = Math.hypot(player.x-m.x, player.y-m.y);
        if(dist < 200) { // Persegue
            m.x += (player.x-m.x)/dist * 1.5;
            m.y += (player.y-m.y)/dist * 1.5;
        } else { // Vaga
            m.x += Math.sin(m.t/2); m.y += Math.cos(m.t/2);
        }
        
        drawMob(m);

        // Combate Visual
        if(dist < 50) {
            m.hp -= 1;
            spawnPart(m.x, m.y, "#fff");
            if(m.hp <= 0) { mobs.splice(i, 1); player.gold += 5; player.xp += 10; }
        }
    });

    // Player com Animação de Quicar
    let pWobble = (player.vx !== 0 || player.vy !== 0) ? Math.sin(Date.now()/100)*4 : 0;
    ctx.fillStyle = player.color;
    ctx.shadowBlur = 15; ctx.shadowColor = player.color;
    ctx.fillRect(player.x-cam.x-12, player.y-cam.y-12 + pWobble, 24, 24 - pWobble);
    ctx.shadowBlur = 0;

    // Joystick Visível
    if(joystick.active) {
        ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(joystick.baseX, joystick.baseY, joystick.size, 0, 7); ctx.stroke();
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.beginPath(); ctx.arc(joystick.stickX, joystick.stickY, 20, 0, 7); ctx.fill();
    }

    requestAnimationFrame(update);
}
update();
