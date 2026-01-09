const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// ===== RESIZE =====
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

// ===== GAME STATE =====
let speed;
let roadOffset;
let gameOver;

// ===== PLAYER =====
const player = {
  offset: 0,      // влево / вправо
  forward: 0,     // вперёд / назад
  width: 40,
  height: 70
};

// ===== INPUT =====
const keys = {
  left: false,
  right: false,
  up: false,
  down: false
};

window.addEventListener("keydown", e => {
  if (e.key === "ArrowLeft" || e.key === "a") keys.left = true;
  if (e.key === "ArrowRight" || e.key === "d") keys.right = true;
  if (e.key === "ArrowUp" || e.key === "w") keys.up = true;
  if (e.key === "ArrowDown" || e.key === "s") keys.down = true;

  if ((e.key === "r" || e.key === "Enter") && gameOver) resetGame();
});

window.addEventListener("keyup", e => {
  if (e.key === "ArrowLeft" || e.key === "a") keys.left = false;
  if (e.key === "ArrowRight" || e.key === "d") keys.right = false;
  if (e.key === "ArrowUp" || e.key === "w") keys.up = false;
  if (e.key === "ArrowDown" || e.key === "s") keys.down = false;
});

// ===== MOBILE BUTTONS (LEFT / RIGHT остаются как есть) =====
const btnLeft = document.querySelector(".btn.left");
const btnRight = document.querySelector(".btn.right");

function bindButton(btn, key) {
  btn.addEventListener("touchstart", e => {
    e.preventDefault();
    keys[key] = true;
  });
  btn.addEventListener("touchend", e => {
    e.preventDefault();
    keys[key] = false;
  });
  btn.addEventListener("touchcancel", () => keys[key] = false);
}

bindButton(btnLeft, "left");
bindButton(btnRight, "right");

// ===== OBSTACLES =====
let obstacles;
let spawnTimer;

// ===== RESET =====
function resetGame() {
  speed = 0.004;
  roadOffset = 0;
  gameOver = false;
  obstacles = [];
  spawnTimer = 0;
  player.offset = 0;
  player.forward = 0;
}

// ===== COLLISION =====
function rectsIntersect(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

// ===== UPDATE =====
function update() {
  if (gameOver) return;

  roadOffset += speed;

  // влево / вправо
  if (keys.left) player.offset -= 0.02;
  if (keys.right) player.offset += 0.02;
  player.offset = Math.max(-0.6, Math.min(0.6, player.offset));

  // вперёд / назад (ограниченно)
  if (keys.up) player.forward -= 2;
  if (keys.down) player.forward += 2;
  player.forward = Math.max(-40, Math.min(40, player.forward));

  // спавн препятствий
  spawnTimer++;
  if (spawnTimer > 80) {
    obstacles.push({
      offset: (Math.random() - 0.5) * 0.6,
      z: 1
    });
    spawnTimer = 0;
  }

  // координаты игрока
  const px =
    canvas.width / 2 +
    player.offset * canvas.width * 0.35 -
    player.width / 2;

  const py =
    canvas.height * 0.75 +
    player.forward;

  const playerRect = {
    x: px,
    y: py,
    w: player.width,
    h: player.height
  };

  // препятствия + столкновения
  for (let o of obstacles) {
    o.z -= speed * 2;

    const scale = 1 - o.z;
    if (scale <= 0) continue;

    const roadWidth = canvas.width * (0.1 + scale * 0.6);

    const ox =
      canvas.width / 2 +
      o.offset * roadWidth -
      (30 * scale) / 2;

    const oy =
      canvas.height * (0.2 + scale * 0.8);

    const size = 30 * scale;

    const obstacleRect = {
      x: ox,
      y: oy,
      w: size,
      h: size
    };

    if (rectsIntersect(playerRect, obstacleRect)) {
      gameOver = true;
    }
  }

  obstacles = obstacles.filter(o => o.z > -0.2);
}

// ===== DRAW ROAD =====
function drawRoad() {
  const horizon = canvas.height * 0.2;
  const segments = 200;
  const h = canvas.height / segments;

  for (let i = 0; i < segments; i++) {
    const p = i / segments;
    const y = horizon + p * canvas.height;
    const roadWidth = canvas.width * (0.1 + p * 0.6);
    const x = (canvas.width - roadWidth) / 2;

    ctx.fillStyle = i % 2 === 0 ? "#444" : "#555";
    ctx.fillRect(x, y, roadWidth, h);
  }
}

// ===== RENDER =====
function render() {
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawRoad();

  // препятствия
  ctx.fillStyle = "#00ccff";
  for (let o of obstacles) {
    const scale = 1 - o.z;
    if (scale <= 0) continue;

    const roadWidth = canvas.width * (0.1 + scale * 0.6);

    const x =
      canvas.width / 2 +
      o.offset * roadWidth -
      (30 * scale) / 2;

    const y =
      canvas.height * (0.2 + scale * 0.8);

    const size = 30 * scale;

    ctx.fillRect(x, y, size, size);
  }

  // игрок
  const px =
    canvas.width / 2 +
    player.offset * canvas.width * 0.35 -
    player.width / 2;

  const py =
    canvas.height * 0.75 +
    player.forward;

  ctx.fillStyle = "#ff3333";
  ctx.fillRect(px, py, player.width, player.height);

  // GAME OVER
  if (gameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 42px Arial";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 20);

    ctx.font = "20px Arial";
    ctx.fillText(
      "Tap / Click / R / Enter to restart",
      canvas.width / 2,
      canvas.height / 2 + 20
    );
  }
}

// ===== LOOP =====
function loop() {
  update();
  render();
  requestAnimationFrame(loop);
}

// ===== RESTART =====
canvas.addEventListener("click", () => {
  if (gameOver) resetGame();
});
canvas.addEventListener("touchstart", () => {
  if (gameOver) resetGame();
});

// START
resetGame();
loop();