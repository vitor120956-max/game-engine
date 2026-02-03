const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
document.body.appendChild(canvas);
document.body.style.margin = "0";
document.body.style.overflow = "hidden";
document.body.style.background = "#000";

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.imageSmoothingEnabled = false; // Pixel Art Sharp
}
window.addEventListener('resize', resize);
resize();

// --- CONFIGURAÇÃO DE TILESET ---
const TILE = 48;
const player = {
    tileX: 50, tileY: 50,
    pixelX: 50 * TILE, pixelY: 50 * TILE,
    targetX: 50, targetY: 50,
    speed: 3.5,
    hp: 450, maxHp: 500, mp: 100, maxMp: 200,
    lvl: 50, class: 'K', // K = Knight, A = Archer, M = Mage
    dir: 1, anim: 0,
    targetId: null, lastAtk: 0
};

// NPCs e Mobs fiéis
let mobs = [];
for(let i=0; i<30; i++) {
    mobs.push({
        id: i, tileX: 45 + Math.floor(Math.random()*10), tileY: 45 + Math.floor(Math.random()*10),
        hp: 300, maxHp: 300, name: "Vampire", color: "#4b4b4b"
    });
}

// Objetos de Cenário (Árvores/Pilares) para Profundidade
let scenery = [];
for(let i=0; i<40; i++) {
    scenery.push({ x: Math.random()*100, y: Math.random()*100, type: 'tree' });
}

function update() {
    // Lógica de Movimento por Célula (Grid Move)
    let dx = player.targetX * TILE - player.pixelX;
    let dy = player.targetY * TILE - player.pixelY;

    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
        if (Math.abs(dx) > 1) {
            player.pixelX += Math.sign(dx) * player.speed;
            player.dir = Math.sign(dx);
        } else {
            player.pixelY += Math.sign(dy) * player.speed;
        }
        player.anim += 0.2;
    } else {
        player.anim = 0;
        player.tileX = player.targetX; player.tileY = player.targetY;
    }

    // Auto-Attack adjacente
    if(player.targetId !== null) {
        let m = mobs.find(mob => mob.id === player.targetId);
        if(m) {
            let dist = Math.abs(player.tileX - m.tileX) + Math.abs(player.tileY - m.tileY);
            if(dist <= 1 && Date.now() - player.lastAtk > 1000) {
                m.hp -= 40; player.lastAtk = Date.now();
                if(m.hp <= 0) { mobs = mobs.filter(mob => mob.id !== m.id); player.targetId = null; }
            }
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let camX = player.pixelX - canvas.width / 2;
    let camY = player.pixelY - canvas.height / 2;

    // 1. Chão (Grid Verde Rucoy)
    ctx.fillStyle = "#1e3926"; ctx.fillRect(0,0, canvas.width, canvas.height);
    ctx.strokeStyle = "#274d34"; ctx.lineWidth = 1;
    for(let x = -TILE; x < canvas.width + TILE; x += TILE) {
        let offX = x - (camX % TILE);
        ctx.beginPath(); ctx.moveTo(offX, 0); ctx.lineTo(offX, canvas.height); ctx.stroke();
    }
    for(let y = -TILE; y < canvas.height + TILE; y += TILE) {
        let offY = y - (camY % TILE);
        ctx.beginPath(); ctx.moveTo(0, offY); ctx.lineTo(canvas.width, offY); ctx.stroke();
    }

    // 2. Renderização por Profundidade (Sorting Y)
    let drawList = [
        ...mobs.map(m => ({...m, type: 'mob', sortY: m.tileY * TILE})),
        ...scenery.map(s => ({...s, sortY: s.y * TILE})),
        {...player, type: 'player', sortY: player.pixelY}
    ];
    drawList.sort((a, b) => a.sortY - b.sortY);

    drawList.forEach(obj => {
        let gx, gy;
        if(obj.type === 'player') {
            gx = player.pixelX - camX; gy = player.pixelY - camY;
            drawPlayerSprite(gx, gy);
        } else if(obj.type === 'mob') {
            gx = obj.tileX * TILE - camX; gy = obj.tileY * TILE - camY;
            if(player.targetId === obj.id) {
                ctx.strokeStyle = "red"; ctx.lineWidth = 3;
                ctx.beginPath(); ctx.arc(gx + TILE/2, gy + TILE/2, TILE/1.5, 0, 7); ctx.stroke();
            }
            ctx.fillStyle = obj.color; ctx.fillRect(gx+8, gy+8, TILE-16, TILE-16);
            ctx.fillStyle = "#000"; ctx.fillRect(gx, gy-10, TILE, 5);
            ctx.fillStyle = "#2ecc71"; ctx.fillRect(gx, gy-10, (obj.hp/obj.maxHp)*TILE, 5);
        } else if(obj.type === 'tree') {
            gx = obj.x * TILE - camX; gy = obj.y * TILE - camY;
            ctx.fillStyle = "#3e2723"; ctx.fillRect(gx+18, gy-20, 12, 40);
            ctx.fillStyle = "#1b5e20"; ctx.beginPath(); ctx.arc(gx+24, gy-30, 35, 0, 7); ctx.fill();
        }
    });

    drawHUD();
}

function drawPlayerSprite(x, y) {
    let b = Math.sin(player.anim) * 4;
    ctx.save();
    ctx.translate(x + TILE/2, y + TILE/2);
    ctx.scale(player.dir, 1);
    
    // Outfit Rucoy (Body -> Face -> Hair)
    ctx.fillStyle = "#3498db"; ctx.fillRect(-16, -16+b, 32, 32); 
    ctx.fillStyle = "#f3e0d2"; ctx.fillRect(-12, -36+b, 24, 22);
    ctx.fillStyle = "#2c3e50"; ctx.fillRect(-14, -42+b, 28, 12); // Hair/Helm
    
    // Weapon visual based on class
    ctx.fillStyle = "#bdc3c7";
    if(player.class === 'K') ctx.fillRect(16, -10+b, 6, 25);
    else if(player.class === 'A') ctx.fillRect(16, -15+b, 4, 30);
    
    ctx.restore();
}

function drawHUD() {
    // Top Left Status
    ctx.fillStyle = "rgba(0,0,0,0.8)"; ctx.fillRect(10, 10, 180, 60);
    ctx.fillStyle = "#e74c3c"; ctx.fillRect(15, 20, (player.hp/player.maxHp)*170, 14);
    ctx.fillStyle = "#3498db"; ctx.fillRect(15, 38, (player.mp/player.maxMp)*170, 10);
    ctx.fillStyle = "#fff"; ctx.font = "bold 12px Arial";
    ctx.fillText(`Lvl ${player.lvl} - Knight`, 16, 62);

    // Mini Map (Top Right)
    ctx.fillStyle = "rgba(0,0,0,0.9)"; ctx.fillRect(canvas.width - 110, 10, 100, 100);
    ctx.fillStyle = "white"; ctx.fillRect(canvas.width - 110 + (player.tileX), 10 + (player.tileY), 3, 3);

    // Class Buttons (Bottom Right)
    ['K', 'A', 'M'].forEach((c, i) => {
        let bx = canvas.width - 60, by = canvas.height - 70 - (i*60);
        ctx.fillStyle = player.class === c ? "#e67e22" : "rgba(0,0,0,0.8)";
        ctx.fillRect(bx, by, 50, 50);
        ctx.fillStyle = "white"; ctx.fillText(c, bx+20, by+30);
    });

    // Chat Log
    ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.fillRect(10, canvas.height - 100, 200, 80);
    ctx.fillStyle = "white"; ctx.fillText("Welcome to Rucoy Online.", 20, canvas.height - 80);
}

// Input (Fiel ao toque no tile)
canvas.addEventListener('touchstart', (e) => {
    let t = e.touches[0];
    let camX = player.pixelX - canvas.width / 2;
    let camY = player.pixelY - canvas.height / 2;
    let tx = Math.floor((t.clientX + camX) / TILE);
    let ty = Math.floor((t.clientY + camY) / TILE);

    // Check Class Buttons
    if(t.clientX > canvas.width - 70) {
        if(t.clientY > canvas.height - 70) player.class = 'K';
        else if(t.clientY > canvas.height - 130) player.class = 'A';
        else if(t.clientY > canvas.height - 190) player.class = 'M';
        return;
    }

    let m = mobs.find(mob => mob.tileX === tx && mob.tileY === ty);
    if(m) { player.targetId = m.id; player.targetX = tx; player.targetY = ty; }
    else { player.targetX = tx; player.targetY = ty; player.targetId = null; }
});

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}
gameLoop();
