const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Resize canvas to fill the window
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Get canvas center
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;

function drawCampfire() {
  const flameColors = [
    "rgba(255, 100, 0, 0.8)",
    "rgba(255, 165, 0, 0.6)",
    "rgba(255, 69, 0, 0.4)",
  ];

  // Randomize flame size and position for flickering
  for (let i = 0; i < 5; i++) {
    const radius = Math.random() * 30 + 20; // Circle size
    const offsetX = Math.random() * 20 - 10; // Flicker horizontally
    const offsetY = Math.random() * 20 - 10; // Flicker vertically
    const color = flameColors[Math.floor(Math.random() * flameColors.length)];

    ctx.beginPath();
    ctx.arc(centerX + offsetX, centerY + offsetY, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
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
  drawCampfire(); // Draw flickering flames

  requestAnimationFrame(gameLoop); // Repeat
}
gameLoop(); // Start the loop
