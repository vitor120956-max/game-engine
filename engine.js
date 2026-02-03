const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
document.body.appendChild(canvas);
document.body.style.background = "#000";
document.body.style.margin = "0";
document.body.style.overflow = "hidden";

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.imageSmoothingEnabled = false;
}
window.addEventListener('resize', resize);
resize();

// --- SISTEMA DE DADOS DO RUCOY ---
const TILE = 48;
const player = {
    tileX: 100, tileY: 100,
    pixelX: 100 * TILE, pixelY: 100 * TILE,
    targetX: 100, targetY: 100,
    speed: 3.5,
    stats: { hp: 500, maxHp: 500, mp: 200, maxMp: 200, lvl: 50 },
    skills: { melee: 75, magic: 10, distance: 10, defense: 70 },
    class: 'Knight', // Knight, Mage, Archer
    targetId: null,
    dir: 1, anim: 0,
    inventory: [],
    logs: ["Welcome to Rucoy Online."]
};

let mobs = [];
for(let i=0; i<40; i++) spawnMob();

function spawnMob() {
    mobs.push({
        id: Math.random(),
        name: "Lvl 45 Assassin",
        tileX: 90 + Math.floor(Math.random()*20),
        tileY: 90 + Math.floor(Math.random()*20),
        hp: 1000, maxHp: 1000, // HP alto para treino
        type: 'assassin',
        lastAtk: 0
    });
}

let cam = { x: 0, y: 0 };
let animations = [];

// --- LÓGICA DE JOGO ---
function update() {
    // Movimento por Grade
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
        player.tileX = player.targetX;
        player.tileY = player.targetY;
    }

    cam.x = player.pixelX - canvas.width / 2;
    cam.y = player.pixelY - canvas.height / 2;

    // Sistema de Combate e Treino
    if(player.targetId) {
        let target = mobs.find(m => m.id === player.targetId);
        if(target) {
            let dist = Math.abs(player.tileX - target.tileX) + Math.abs(player.tileY - target.tileY);
            if(dist <= 1 && Date.now() - player.lastAtk > 1000) {
                // Ataque e ganho de Skill
                let dmg = Math.floor(player.skills.melee / 2 + Math.random() * 10);
                target.hp -= dmg;
                player.skills.melee += 0.1;
                player.skills.defense += 0.05;
                addLog(`You hitted ${target.name} for ${dmg}`);
                player.lastAtk = Date.now();
                if(target.hp <= 0) { player.targetId = null; mobs = mobs.filter(m => m.id !== target.id); spawnMob(); }
            }
        }
    }
}

function addLog(msg) {
    player.logs.push(msg);
    if(player.logs.length > 5) player.logs.shift();
}

// --- RENDERIZAÇÃO COMPLETA ---
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 1. Chão Tile-Map
    ctx.fillStyle = "#2d5a27"; ctx.fillRect(0,0, canvas.width, canvas.height);
    ctx.strokeStyle = "rgba(0,0,0,0.1)";
    const startX = Math.floor(cam.x / TILE) * TILE;
    const startY = Math.floor(cam.y / TILE) * TILE;
    for(let x = startX; x < startX + canvas.width + TILE; x += TILE) {
        for(let y = startY; y < startY + canvas.height + TILE; y += TILE) {
            ctx.strokeRect(x - cam.x, y - cam.y, TILE, TILE);
        }
    }

    // 2. Desenhar Mobs
    mobs.forEach(m => {
        let mx = m.tileX * TILE - cam.x;
        let my = m.tileY * TILE - cam.y;
        
        if(player.targetId === m.id) {
            ctx.strokeStyle = "#ff0000"; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(mx + TILE/2, my + TILE/2, TILE/1.5, 0, 7); ctx.stroke();
        }

        ctx.fillStyle = "#34495e"; ctx.fillRect(mx+8, my+8, TILE-16, TILE-16);
        ctx.fillStyle = "#000"; ctx.fillRect(mx, my-12, TILE, 6);
        ctx.fillStyle = "#2ecc71"; ctx.fillRect(mx, my-12, (m.hp/m.maxHp)*TILE, 6);
    });

    // 3. Desenhar Player (Rucoy Layers)
    let px = player.pixelX - cam.x;
    let py = player.pixelY - cam.y;
    let b = Math.sin(player.anim) * 4;

    ctx.save();
    ctx.translate(px + TILE/2, py + TILE/2);
    ctx.scale(player.dir, 1);
    ctx.fillStyle = "#3498db"; ctx.fillRect(-16, -16+b, 32, 32); // Body
    ctx.fillStyle = "#f3e0d2"; ctx.fillRect(-12, -36+b, 24, 22); // Face
    ctx.fillStyle = "#2c3e50"; ctx.fillRect(-14, -40+b, 28, 10); // Hair
    ctx.fillStyle = "#000"; ctx.fillRect(4, -30+b, 4, 6); ctx.fillRect(12, -30+b, 4, 6); // Eyes
    ctx.restore();

    drawInterface();
}

function drawInterface() {
    // Status Superior Esq.
    ctx.fillStyle = "rgba(0,0,0,0.8)"; ctx.fillRect(10, 10, 180, 65);
    ctx.fillStyle = "#e74c3c"; ctx.fillRect(15, 18, (player.stats.hp/player.stats.maxHp)*170, 15);
    ctx.fillStyle = "#3498db"; ctx.fillRect(15, 38, (player.stats.mp/player.stats.maxMp)*170, 12);
    ctx.fillStyle = "#fff"; ctx.font = "bold 12px Arial";
    ctx.fillText(`Lvl ${player.stats.lvl} - ${player.class}`, 15, 65);

    // Mini-mapa Dir. Sup.
    ctx.fillStyle = "rgba(0,0,0,0.8)"; ctx.fillRect(canvas.width - 110, 10, 100, 100);
    ctx.fillStyle = "#fff"; ctx.fillRect(canvas.width - 110 + (player.tileX/200)*100, 10 + (player.tileY/200)*100, 3, 3);

    // Chat Log Inferior Esq.
    ctx.fillStyle = "rgba(0,0,0,0.4)"; ctx.fillRect(10, canvas.height - 120, 250, 110);
    player.logs.forEach((log, i) => {
        ctx.fillStyle = "#fff"; ctx.fillText(log, 20, canvas.height - 100 + (i*20));
    });

    // Botões de Troca de Classe (Dir. Inf.)
    const btnSize = 50;
    ['K', 'A', 'M'].forEach((c, i) => {
        ctx.fillStyle = player.class[0] === c ? "#e67e22" : "rgba(0,0,0,0.8)";
        ctx.fillRect(canvas.width - 60, canvas.height - 70 - (i*60), btnSize, btnSize);
        ctx.fillStyle = "#fff"; ctx.fillText(c, canvas.width - 40, canvas.height - 40 - (i*60));
    });
}

// --- CONTROLES ---
canvas.addEventListener('touchstart', (e) => {
    let t = e.touches[0];
    let tx = Math.floor((t.clientX + cam.x) / TILE);
    let ty = Math.floor((t.clientY + cam.y) / TILE);

    // Clique em Botões de Classe
    if(t.clientX > canvas.width - 70) {
        if(t.clientY > canvas.height - 70) player.class = 'Knight';
        else if(t.clientY > canvas.height - 130) player.class = 'Archer';
        else if(t.clientY > canvas.height - 190) player.class = 'Mage';
        return;
    }

    let hitMob = mobs.find(m => m.tileX === tx && m.tileY === ty);
    if(hitMob) {
        player.targetId = hitMob.id;
        player.targetX = tx; player.targetY = ty;
    } else {
        player.targetX = tx; player.targetY = ty;
        player.targetId = null;
    }
});

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}
loop();
