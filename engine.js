// ================================
// GameGen-Core Engine
// ================================

class GameGenEngine {
  constructor(config) {
    this.config = config;
    this.canvas = document.getElementById("game");
    this.ctx = this.canvas.getContext("2d");

    this.lastTime = 0;
    this.entities = [];
    this.mode = config.game.startMode;

    this.player = {
      x: config.display.width / 2,
      y: config.display.height / 2,
      hp: config.player.hp,
      speed: config.player.speed,
      damage: config.player.damage,
      size: 12
    };

    this.enemies = [];
    this.xp = 0;
    this.level = 1;

    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  resize() {
    this.canvas.width = this.config.display.width;
    this.canvas.height = this.config.display.height;
  }

  start() {
    requestAnimationFrame((t) => this.loop(t));
  }

  loop(time) {
    const delta = (time - this.lastTime) / 1000;
    this.lastTime = time;

    this.update(delta);
    this.render();

    requestAnimationFrame((t) => this.loop(t));
  }

  update(delta) {
    if (this.mode === "idle") {
      this.xp += this.config.idle.gainPerSecond * delta;
    }

    if (this.config.enemies.enabled) {
      this.spawnEnemies(delta);
      this.updateEnemies(delta);
    }

    this.checkLevelUp();
  }

  spawnEnemies(delta) {
    if (!this.lastSpawn) this.lastSpawn = 0;
    this.lastSpawn += delta;

    if (
      this.lastSpawn > 1 / this.config.enemies.spawnRate &&
      this.enemies.length < this.config.enemies.maxOnScreen
    ) {
      this.lastSpawn = 0;
      this.enemies.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        hp: this.config.enemies.baseHp,
        size: 10
      });
    }
  }

  updateEnemies(delta) {
    this.enemies.forEach((e) => {
      const dx = this.player.x - e.x;
      const dy = this.player.y - e.y;
      const dist = Math.hypot(dx, dy) || 1;

      e.x += (dx / dist) * 40 * delta;
      e.y += (dy / dist) * 40 * delta;
    });
  }

  checkLevelUp() {
    const needed = eval(this.config.progression.levelUpFormula);
    if (this.xp >= needed) {
      this.xp -= needed;
      this.level++;
      this.player.hp += this.config.progression.rewardPerLevel.hp;
      this.player.damage += this.config.progression.rewardPerLevel.damage;
      this.player.speed += this.config.progression.rewardPerLevel.speed;
    }
  }

  render() {
    this.ctx.fillStyle = this.config.display.backgroundColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Player
    this.ctx.fillStyle = "#00ffcc";
    this.ctx.beginPath();
    this.ctx.arc(this.player.x, this.player.y, this.player.size, 0, Math.PI * 2);
    this.ctx.fill();

    // Enemies
    this.ctx.fillStyle = "#ff4444";
    this.enemies.forEach((e) => {
      this.ctx.beginPath();
      this.ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
      this.ctx.fill();
    });

    // UI
    this.ctx.fillStyle = "#ffffff";
    this.ctx.fillText(`Modo: ${this.mode}`, 10, 20);
    this.ctx.fillText(`HP: ${this.player.hp}`, 10, 40);
    this.ctx.fillText(`XP: ${Math.floor(this.xp)}`, 10, 60);
    this.ctx.fillText(`Level: ${this.level}`, 10, 80);
  }
}

// ================================
// Bootloader
// ================================

fetch("game.config.json")
  .then((r) => r.json())
  .then((config) => {
    window.Game = new GameGenEngine(config);
    Game.start();
  })
  .catch((err) => {
    console.error("Erro ao carregar configuração:", err);
  });