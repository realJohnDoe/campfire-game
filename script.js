const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Resize canvas to fill the window
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Get canvas center
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;

const flames = []; // Array to hold flame properties
const flameCount = 10; // Number of flames
let lastFlameUpdate = 0; // Tracks the last time flames were updated

// Initialize flame data
for (let i = 0; i < flameCount; i++) {
  flames.push({
    offsetX: Math.random() * 20 - 10, // Horizontal flicker
    offsetY: Math.random() * 20 - 10, // Vertical flicker
    radius: Math.random() * 30 + 20, // Size of flame
    color: [
      "rgba(255, 100, 0, 0.8)",
      "rgba(255, 165, 0, 0.6)",
      "rgba(255, 69, 0, 0.4)",
    ][Math.floor(Math.random() * 3)],
  });
}

let mouseX = centerX; // Default to center
let mouseY = centerY; // Default to center

const smokeParticles = [];

let lastSmokeEmit = 0;
const smokeEmitInterval = 50; // Emit a particle every 50ms

function emitSmokeParticles() {
  const now = Date.now();
  if (now - lastSmokeEmit > smokeEmitInterval) {
    createSmokeParticle();
    lastSmokeEmit = now;
  }
}

function createSmokeParticle() {
  const angle = Math.atan2(mouseY - centerY, mouseX - centerX); // Direction to mouse
  const speed = Math.random() * 1.5 + 0.5; // Random speed

  smokeParticles.push({
    x: centerX,
    y: centerY,
    vx: Math.cos(angle) * speed, // Horizontal velocity
    vy: Math.sin(angle) * speed, // Vertical velocity
    size: Math.random() * 8 + 4, // Random size
    opacity: 1, // Full opacity
  });
}

function updateSmokeParticles() {
  for (let i = smokeParticles.length - 1; i >= 0; i--) {
    const p = smokeParticles[i];

    p.x += p.vx;
    p.y += p.vy;
    p.size *= 0.98; // Gradually shrink
    p.opacity -= 0.01; // Gradually fade

    // Remove particle if it's too small or invisible
    if (p.size < 0.5 || p.opacity <= 0) {
      smokeParticles.splice(i, 1);
    }
  }
}

function drawSmokeParticles() {
  for (const p of smokeParticles) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(128, 128, 128, ${p.opacity})`; // Gray color with opacity
    ctx.fill();
  }
}

canvas.addEventListener("mousemove", (event) => {
  const rect = canvas.getBoundingClientRect();
  mouseX = event.clientX - rect.left;
  mouseY = event.clientY - rect.top;
});

function updateFlames() {
  const flameUpdateInterval = 400; // Time between flame updates (in ms)
  const now = Date.now();
  if (now - lastFlameUpdate > flameUpdateInterval) {
    // Update each flame's properties
    for (let flame of flames) {
      flame.offsetX = Math.random() * 20 - 10;
      flame.offsetY = Math.random() * 20 - 10;
      flame.radius = Math.random() * 30 + 20;
      flame.color = [
        "rgba(255, 100, 0, 0.8)",
        "rgba(255, 165, 0, 0.6)",
        "rgba(255, 69, 0, 0.4)",
      ][Math.floor(Math.random() * 3)];
    }
    lastFlameUpdate = now; // Reset the timer
  }
}

function drawCampfire() {
  for (let flame of flames) {
    ctx.beginPath();
    ctx.arc(
      centerX + flame.offsetX,
      centerY + flame.offsetY,
      flame.radius,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = flame.color;
    ctx.fill();
  }
}

function drawGlow() {
  const gradient = ctx.createRadialGradient(
    centerX,
    centerY,
    20,
    centerX,
    centerY,
    100
  );
  gradient.addColorStop(0, "rgba(255, 165, 0, 0.6)");
  gradient.addColorStop(1, "rgba(255, 69, 0, 0)");

  ctx.beginPath();
  ctx.arc(centerX, centerY, 100, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
}

function drawLogs() {
  ctx.fillStyle = "#6B2503"; // Brown color for logs

  // Draw two logs crossing each other
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(Math.PI / 4); // Rotate for crossing effect
  ctx.fillRect(-60, -10, 120, 20); // Horizontal log
  ctx.restore();

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(-Math.PI / 4); // Rotate for crossing effect
  ctx.fillRect(-60, -10, 120, 20); // Vertical log
  ctx.restore();
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the screen

  drawLogs(); // Draw logs
  drawGlow(); // Draw glowing effect
  updateFlames(); // Update flame properties
  drawCampfire(); // Draw flickering flames
  emitSmokeParticles(); // Emit new smoke particles
  updateSmokeParticles(); // Update smoke particles
  drawSmokeParticles(); // Draw smoke particles

  requestAnimationFrame(gameLoop); // Repeat
}
gameLoop(); // Start the loop
