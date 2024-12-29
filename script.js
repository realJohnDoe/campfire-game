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

const people = [];
const numPeople = 10; // Number of people
const circleRadius = 150; // Distance from campfire

for (let i = 0; i < numPeople; i++) {
  const angle = (i / numPeople) * Math.PI * 2; // Angle in the circle
  const x = centerX + Math.cos(angle) * circleRadius;
  const y = centerY + Math.sin(angle) * circleRadius;

  people.push({
    x,
    y,
    radius: 10, // Size of the person
    angle, // Current angle around the campfire
    speed: 1, // Speed of movement
    avoiding: false, // Whether they are reacting to smoke
  });
}

function drawPeople() {
  for (const person of people) {
    ctx.beginPath();
    ctx.arc(person.x, person.y, person.radius, 0, Math.PI * 2);
    ctx.fillStyle = person.avoiding ? "red" : "white"; // Change color if avoiding
    ctx.fill();
  }
}

function checkSmokeProximity() {
  const smokeThreshold = 50; // Distance to trigger avoidance

  for (const person of people) {
    person.avoiding = false; // Reset avoidance state

    for (const particle of smokeParticles) {
      const dist = Math.hypot(person.x - particle.x, person.y - particle.y);

      if (dist < smokeThreshold) {
        person.avoiding = true;
        break;
      }
    }
  }
}

function movePeople() {
  for (const person of people) {
    if (person.avoiding) {
      // Move outward from the campfire
      const dx = person.x - centerX;
      const dy = person.y - centerY;
      const magnitude = Math.hypot(dx, dy);

      person.x += (dx / magnitude) * person.speed;
      person.y += (dy / magnitude) * person.speed;
    } else {
      // Return to original circular position
      person.angle += 0.01; // Slowly rotate around the fire
      person.x = centerX + Math.cos(person.angle) * circleRadius;
      person.y = centerY + Math.sin(person.angle) * circleRadius;
    }
  }
}

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

    p.x += p.vx; // Move particle horizontally
    p.y += p.vy; // Move particle vertically
    p.size += 0.2; // Gradually increase size
    p.opacity -= 0.01; // Gradually fade out

    // Remove particle if it's too faint
    if (p.opacity <= 0) {
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

  checkSmokeProximity(); // Check if people are near smoke
  movePeople(); // Move people based on proximity
  drawPeople(); // Draw people around the fire

  requestAnimationFrame(gameLoop); // Repeat
}
gameLoop(); // Start the loop
