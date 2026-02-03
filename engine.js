/**
 * RUCOY ONLINE REPLICA - MASTER SCRIPT
 * Cole este código inteiro na aba JavaScript (JS)
 */

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
document.body.appendChild(canvas);

// Configuração de Estilo do Body via JS
document.body.style.margin = "0";
document.body.style.overflow = "hidden";
document.body.style.backgroundColor = "#000";

const TILE = 48;

// --- ESTADO DO JOGADOR ---
const player = {
    x: 100 * TILE, y: 100 * TILE, // Posição em pixels
    tx: 100, ty: 100,             // Destino em Tiles
    cx: 100, cy: 100,             // Tile atual
    speed: 4,
    hp: 500, maxHp: 500,
    mp: 200, maxMp: 200,
    lvl: 1, xp: 0, maxXp: 100,
    class: 'Knight',
    dir: 1, anim: 0,
    targetId: null,
    lastAtk: 0
};

// --- ENTIDADES E PARTÍCULAS ---
let mobs = [];
let damages = [];
let logs = ["Welcome to Rucoy Online!", "Tap a monster to attack."];

function spawnMob() {
    mobs.push({
        id: Math.random(),
        name: "Assassin",
        tx: player.tx + Math.floor(Math.random() * 20 - 10),
        ty: player.ty + Math.floor(Math.random() * 20 - 10),
        hp: 120, maxHp: 120,
        flash: 0, lvl: 45
    });
}

// Inicializa 20 monstros
for(let i=0; i<20; i++) spawnMob();

// --- SISTEMA DE LOGS ---
function addLog(text) {
    logs.push(text);
    if(logs.length > 5) logs.shift();
}

// --- LÓGICA PRINCIPAL (UPDATE) ---
function update() {
    // 1. Movimento Suave por Grade
    let targetPX = player.tx * TILE;
    let targetPY = player.ty * TILE;

    if (player.x !== targetPX || player.y !== targetPY) {
        if (player.x < targetPX) { player.x += player.speed; player.dir = 1; }
        else if (player.x > targetPX) { player.x -= player.speed; player.dir = -1; }
        else if (player.y < targetPY) { player.y += player.speed; }
        else if (player.y > targetPY) { player.y -= player.speed; }
        
        player.anim += 0.2;
        player.cx = Math.round(player.x / TILE);
        player.cy = Math.round(player.y / TILE);
    } else {
        player.anim = 0;
    }

    // 2. Combate Automático
    if (player.targetId) {
        let m = mobs.find(mob => mob.id === player.targetId);
        if (m) {
            let dist = Math.abs(player.cx - m.tx) + Math.abs(player.cy - m.ty);
            if (dist <= 1 && Date.now() - player.lastAtk > 1000) {
                let dmg = 25 + Math.floor(Math.random() * 15);
                m.hp -= dmg;
                m.flash = 5;
                damages.push({ x: m.tx * TILE, y: m.ty * TILE, val: dmg, life: 40 });
                player.lastAtk = Date.now();

                if (m.hp <= 0) {
                    addLog(`Killed ${m.name}! +50 XP`);
                    player.xp += 50;
                    checkLevelUp();
                    mobs = mobs.filter(mob => mob.id !== m.id);
                    spawnMob();
                    player.targetId = null;
                }
            }
        }
    }

    // 3. Partículas de Dano
    damages.forEach((d, i) => { d.y -= 1; d.life--; if(d.life <= 0) damages.splice(i, 1); });
}

function checkLevelUp() {
    if(player.xp >= player.maxXp) {
        player.lvl++;
        player.xp = 0;
        player.maxXp = Math.floor(player.maxXp * 1.5);
        player.maxHp += 50;
        player.hp = player.maxHp;
        addLog(`LEVEL UP! You are now level ${player.lvl}`);
    }
}

// --- RENDERIZAÇÃO (DRAW) ---
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const camX = player.x - canvas.width / 2;
    const camY = player.y - canvas.height / 2;

    // A. Chão (Grade Fiel)
    ctx.strokeStyle = "#1a1a1a";
    const startX = Math.floor(camX / TILE) * TILE;
    const startY = Math.floor(camY / TILE) * TILE;
    for(let x = startX; x < startX + canvas.width + TILE; x += TILE) {
        for(let y = startY; y < startY + canvas.height + TILE; y += TILE) {
            ctx.strokeRect(x - camX, y - camY, TILE, TILE);
        }
    }

    // B. Mobs
    mobs.forEach(m => {
        let mx = m.tx * TILE - camX;
        let my = m.ty * TILE - camY;
        
        if(player.targetId === m.id) {
            ctx.strokeStyle = "red"; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(mx + TILE/2, my + TILE/2, 28, 0, 7); ctx.stroke();
        }

        ctx.fillStyle = m.flash > 0 ? "white" : "#4b4b4b";
        if(m.flash > 0) m.flash--;
        ctx.fillRect(mx + 8, my + 8, TILE-16, TILE-16);
        
        // HP Bar Mob
        ctx.fillStyle = "#000"; ctx.fillRect(mx + 4, my - 10, TILE-8, 5);
        ctx.fillStyle = "#2ecc71"; ctx.fillRect(mx + 4, my - 10, (m.hp/m.maxHp)*(TILE-8), 5);
    });

    // C. Player (Animação e Camadas)
    let px = player.x - camX;
    let py = player.y - camY;
    let bounce = Math.sin(player.anim) * 4;
    
    ctx.save();
    ctx.translate(px + TILE/2, py + TILE/2);
    ctx.scale(player.dir, 1);
    ctx.fillStyle = "#3498db"; ctx.fillRect(-15, -15 + bounce, 30, 30); // Body
    ctx.fillStyle = "#f3e0d2"; ctx.fillRect(-12, -35 + bounce, 24, 22); // Face
    ctx.fillStyle = "#2c3e50"; ctx.fillRect(-14, -40 + bounce, 28, 10); // Hair
    ctx.restore();

    // D. Popups de Dano
    damages.forEach(d => {
        ctx.fillStyle = "white"; ctx.font = "bold 16px monospace";
        ctx.fillText(d.val, d.x - camX + 10, d.y - camY);
    });

    drawHUD();
}

function drawHUD() {
    // Barra Superior
    ctx.fillStyle = "rgba(0,0,0,0.8)"; ctx.fillRect(10, 10, 200, 60);
    ctx.fillStyle = "#e74c3c"; ctx.fillRect(15, 20, (player.hp/player.maxHp)*190, 15);
    ctx.fillStyle = "#3498db"; ctx.fillRect(15, 40, (player.xp/player.maxXp)*190, 8);
    ctx.fillStyle = "#fff"; ctx.font = "bold 12px Arial";
    ctx.fillText(`Lv ${player.lvl} ${player.class}`, 15, 62);

    // Chat Log
    ctx.fillStyle = "rgba(0,0,0,0.4)"; ctx.fillRect(10, canvas.height - 130, 250, 120);
    logs.forEach((log, i) => {
        ctx.fillStyle = "#fff"; ctx.fillText(log, 20, canvas.height - 110 + (i*20));
    });

    // Mini Mapa
    ctx.fillStyle = "rgba(0,0,0,0.8)"; ctx.fillRect(canvas.width - 110, 10, 100, 100);
    ctx.fillStyle = "white"; ctx.fillRect(canvas.width - 110 + (player.cx/2), 10 + (player.cy/2), 2, 2);
}

// --- INPUTS ---
canvas.addEventListener('touchstart', e => {
    let t = e.touches[0];
    const camX = player.x - canvas.width / 2;
    const camY = player.y - canvas.height / 2;
    let tx = Math.floor((t.clientX + camX) / TILE);
    let ty = Math.floor((t.clientY + camY) / TILE);

    let hit = mobs.find(m => m.tx === tx && m.ty === ty);
    if (hit) {
        player.targetId = hit.id;
