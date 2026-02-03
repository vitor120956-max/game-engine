// ... (mantenha as variáveis iniciais, vamos focar nas mudanças de itens)
let player = { 
    x: 2500, y: 2500, s: 30, speed: 5, vx: 0, vy: 0, 
    color: '#3498db', hp: 100, maxHp: 100, xp: 0, maxXp: 100, lvl: 1, gold: 0,
    dir: 1, frame: 0, skillCD: 0,
    equipment: { weapon: false, shield: false }, // Itens equipados
    dmg: 2
};

let itemsOnGround = []; // Lista para espadas/escudos no chão

function drawPlayer() {
    let gx = player.x - cam.x, gy = player.y - cam.y;
    player.frame += (Math.abs(player.vx) + Math.abs(player.vy) > 0.1) ? 0.2 : 0;
    let bounce = Math.sin(player.frame) * 4;

    ctx.save();
    ctx.translate(gx, gy);
    ctx.scale(player.dir, 1);
    
    // Sombra e Corpo
    ctx.fillStyle = "rgba(0,0,0,0.2)"; ctx.beginPath(); ctx.ellipse(0, 15, 15, 5, 0, 0, 7); ctx.fill();
    ctx.fillStyle = player.color; ctx.fillRect(-14, -15 + bounce, 28, 26);
    
    // --- DESENHAR EQUIPAMENTOS (ESTILO RUCOY) ---
    if(player.equipment.weapon) {
        ctx.fillStyle = "#bdc3c7"; ctx.fillRect(14, -10 + bounce, 6, 20); // Espada na mão
        ctx.fillStyle = "#7f8c8d"; ctx.fillRect(12, -2, 10, 3); // Guarda da espada
    }
    if(player.equipment.shield) {
        ctx.fillStyle = "#95a5a6"; ctx.fillRect(-20, -10 + bounce, 6, 15); // Escudo
    }

    // Cabeça e Rosto
    ctx.fillStyle = "#FFCCBC"; ctx.fillRect(-10, -32 + bounce, 20, 18);
    ctx.fillStyle = "#2c3e50"; ctx.fillRect(-12, -35 + bounce, 24, 8);
    ctx.fillStyle = "black"; ctx.fillRect(2, -26 + bounce, 3, 4); ctx.fillRect(8, -26 + bounce, 3, 4);
    
    ctx.restore();
}

function update() {
    // ... (mantenha a lógica de movimento e limpeza de tela anterior)

    // Lógica de Drops de Itens
    itemsOnGround.forEach((it, i) => {
        let gx = it.x - cam.x, gy = it.y - cam.y;
        ctx.fillStyle = it.type === "weapon" ? "#bdc3c7" : "#95a5a6";
        ctx.fillRect(gx-8, gy-8, 16, 16); // Ícone do item no chão
        ctx.strokeStyle = "white"; ctx.strokeRect(gx-8, gy-8, 16, 16);

        if(Math.hypot(player.x - it.x, player.y - it.y) < 30) {
            if(it.type === "weapon") { player.equipment.weapon = true; player.dmg = 5; }
            if(it.type === "shield") { player.equipment.shield = true; player.maxHp = 150; }
            addPopup(player.x, player.y, "EQUIPADO!", "cyan");
            itemsOnGround.splice(i, 1);
        }
    });

    mobs.forEach((m, i) => {
        // ... (lógica de combate)
        if(d < 50) {
            m.hp -= player.dmg; // Agora usa o dano do item!
            if(m.hp <= 0) {
                // Chance de dropar item (10%)
                if(Math.random() > 0.9) {
                    itemsOnGround.push({ x: m.x, y: m.y, type: Math.random() > 0.5 ? "weapon" : "shield" });
                }
                // ... (resto da lógica de morte)
            }
        }
    });
    // ... (mantenha o resto do código)
}
