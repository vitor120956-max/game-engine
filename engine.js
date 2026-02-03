const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
document.body.appendChild(canvas);
canvas.width = window.innerWidth; canvas.height = window.innerHeight;

let worldSize = 4000;
let player = { x: 2000, y: 2000, s: 22, speed: 5, vx: 0, vy: 0, color: '#00ffff', hp: 100, frame: 0, atkFrame: 0, trails: [] };
let cam = { x: 2000, y: 2000 };
let mobs = [], trees = [], effects = [], joystick = { active: false, baseX: 0, baseY: 0, stickX: 0, stickY: 0 };

// Gerador de mundo
for(let i=0; i<40; i++) mobs.push({ x: Math.random()*worldSize, y: Math.random()*worldSize, hp: 60, s: 20, t: Math.random()*10, angry: false });
for(let i=0; i<45; i++) trees.push({ x: Math.random()*worldSize, y: Math.random()*worldSize, s: 50 });

function drawPlayer() {
    let gx = player.x - cam.x; let gy = player.y - cam.y;
    player.frame += 0.2;
    
    // Rastro de Movimento (Anime Ghosting)
    if(Math.hypot(player.vx, player.vy) > 2) {
        player.trails.push({x: gx, y: gy, alpha: 0.5});
        if(player.trails.length > 5) player.trails.shift();
    } else { player.trails = []; }

    player.trails.forEach((t, i) => {
        ctx.globalAlpha = t.alpha * (i/player.trails.length);
        ctx.fillStyle = player.color;
        ctx.fillRect(t.x-12, t.y-12, 24, 24);
    });
    ctx.globalAlpha = 1;

    // Corpo do Player
    ctx.save();
    ctx.translate(gx, gy);
    let bounce = Math.sin(player.frame) * 3;
    
    // Efeito de Ataque (Corte de Espada Anime)
    if(player.atkFrame > 0) {
        player.atkFrame -= 0.15;
        ctx.strokeStyle = "cyan"; ctx.lineWidth = 5;
        ctx.shadowBlur = 15; ctx.shadowColor = "cyan";
        ctx.beginPath(); ctx.arc(0, 0, 50, -1, 1); ctx.stroke();
        ctx.shadowBlur = 0;
    }

    // Design do Personagem
    ctx.fillStyle = player.color;
    ctx.fillRect(-12, -10 + bounce, 24, 24); // Corpo
    ctx.fillStyle = "#FFCCBC";
    ctx.fillRect(-10, -25 + bounce, 20, 18); // Rosto
    ctx.fillStyle = "#000"; 
    ctx.fillRect(-6, -20 + bounce, 4, 2); ctx.fillRect(2, -20 + bounce, 4, 2); // Olhos "Sérios"
    ctx.restore();
}

function drawMob(m) {
    let gx = m.x - cam.x; let gy = m.y - cam.y;
    m.t += 0.1;
    let s = Math.sin(m.t) * 5;
    
    // Alerta de Ataque (Mob brilha vermelho antes de agir)
    if(m.angry) {
        ctx.shadowBlur = 15; ctx.shadowColor = "red";
        ctx.fillStyle = "#ff4444";
    } else {
        ctx.fillStyle = "#2E7D32";
    }

    ctx.beginPath();
    ctx.ellipse(gx, gy + s, m.s + s/2, m.s - s, 0, 0, 7);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Olhos de Anime no Mob
    ctx.fillStyle = "white";
    ctx.beginPath(); ctx.moveTo(gx-10, gy+s-5); ctx.lineTo(gx-2, gy+s-2); ctx.lineTo(gx-10, gy+s+2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(gx+10, gy+s-5); ctx.lineTo(gx+2, gy+s-2); ctx.lineTo(gx+10, gy+s+2); ctx.fill();
}

function update() {
    cam.x += (player.x - canvas.width/2 - cam.x) * 0.1;
    cam.y += (player.y - canvas.height/2 - cam.y) * 0.1;

    // Solo com efeito de profundidade
    ctx.fillStyle = "#0f260f"; ctx.fillRect(0,0,canvas.width,canvas.height);

    trees.forEach(t => {
        let gx = t.x-cam.x, gy = t.y-cam.y;
        ctx.fillStyle = "#2e1a1a"; ctx.fillRect(gx-10, gy, 20, 40); // Tronco
        ctx.fillStyle = "#1b4d1b"; ctx.beginPath(); ctx.arc(gx, gy-20, 40, 0, 7); ctx.fill(); // Copa
    });

    mobs.forEach((m, i) => {
        let d = Math.hypot(player.x-m.x, player.y-m.y);
        
        // Comportamento: Antecipação e Pulo
        if(d < 200) {
            m.angry = true;
            m.x += (player.x-m.x)/d * 2.5; // Perseguição rápida
            m.y += (player.y-m.y)/d * 2.5;
        } else { m.angry = false; }

        drawMob(m);

        // Combate (Impacto de Anime)
        if(d < 60) {
            player.atkFrame = 1;
            m.hp -= 3;
            if(Math.random() > 0.8) { // Efeito de faísca
                effects.push({x: m.x, y: m.y, life: 1});
            }
            if(m.hp <= 0) {
                mobs.splice(i, 1);
                // Explosão de energia
                for(let j=0; j<15; j++) effects.push({x: m.x, y: m.y, vx: (Math.random()-0.5)*15, vy: (Math.random()-0.5)*15, life: 1});
            }
        }
    });

    // Partículas de Energia
    effects.forEach((e, i) => {
        if(e.vx) { e.x += e.vx; e.y += e.vy; }
        e.life -= 0.05;
        ctx.fillStyle = `rgba(0, 255, 255, ${e.life})`;
        ctx.fillRect(e.x-cam.x, e.y-cam.y, 4, 4);
        if(e.life <= 0) effects.splice(i, 1);
    });

    drawPlayer();

    // Joystick
    if(joystick.active) {
        ctx.strokeStyle="cyan"; ctx.beginPath(); ctx.arc(joystick.baseX, joystick.baseY, 50, 0, 7); ctx.stroke();
        ctx.fillStyle="rgba(0, 255, 255, 0.2)"; ctx.beginPath(); ctx.arc(joystick.stickX, joystick.stickY, 25, 0, 7); ctx.fill();
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
