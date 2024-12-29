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
    radius: 30, // Size of the person
    angle, // Current angle around the campfire
    speed: 1, // Speed of movement
    avoiding: false, // Whether they are reacting to smoke
    vx: 0, // Horizontal velocity
    vy: 0, // Vertical velocity
  });
}

function drawPeople() {
  for (const person of people) {
    ctx.beginPath();
    ctx.arc(person.x, person.y, person.radius, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
  }
}

// Reaction delay in milliseconds
const reactionDelay = 500; // Delay before starting to react to smoke (500ms)

// Random movement parameters
const randomMovementStrength = 0.01; // Controls how often the random movement happens
const randomMovementMagnitude = 10; // Controls how large each random step is

function movePeople() {
  const damping = 0.9; // Reduce velocity slightly each frame for smoother movement

  for (const person of people) {
    // Apply a random movement step with a larger magnitude
    const randomX =
      (Math.random() - 0.5) * randomMovementStrength * randomMovementMagnitude;
    const randomY =
      (Math.random() - 0.5) * randomMovementStrength * randomMovementMagnitude;

    // Apply random movement
    person.vx += randomX;
    person.vy += randomY;

    if (person.avoiding) {
      // Move outward from the campfire (away from smoke) and rotate along the circle
      let dx = person.x - centerX;
      let dy = person.y - centerY;

      const angleToMouse = Math.atan2(dy, dx);
      const targetAngle = angleToMouse + Math.sign(mouseX - centerX) * 0.1;

      // Calculate movement based on angle
      const radius = Math.hypot(dx, dy);
      const targetX = centerX + Math.cos(targetAngle) * (radius + person.speed);
      const targetY = centerY + Math.sin(targetAngle) * (radius + person.speed);

      // Adjust velocity toward the target position
      person.vx += (targetX - person.x) * 0.05;
      person.vy += (targetY - person.y) * 0.05;
    } else {
      // Calculate position on the circle (return to the circle)
      const angle = Math.atan2(person.y - centerY, person.x - centerX);
      const targetX = centerX + Math.cos(angle) * circleRadius;
      const targetY = centerY + Math.sin(angle) * circleRadius;

      // Adjust velocity toward the circle position
      person.vx += (targetX - person.x) * 0.05;
      person.vy += (targetY - person.y) * 0.05;
    }

    // Apply velocities to update positions
    person.x += person.vx;
    person.y += person.vy;

    // Apply damping to smooth movement
    person.vx *= damping;
    person.vy *= damping;

    // Manage reaction delay if close to smoke
    if (person.avoiding) {
      person.reactionTime = person.reactionTime || Date.now(); // Set reaction time if not set
    }

    // If within the reaction delay and close to smoke, don't react yet
    if (
      !person.avoiding &&
      person.reactionTime &&
      Date.now() - person.reactionTime < reactionDelay
    ) {
      person.avoiding = true; // Start avoiding after the delay
    }
  }
}

function checkSmokeProximity() {
  const smokeThreshold = 50; // Distance to trigger avoidance

  for (const person of people) {
    let smokeNearby = false;
    for (const particle of smokeParticles) {
      const dist = Math.hypot(person.x - particle.x, person.y - particle.y);

      if (dist < smokeThreshold) {
        smokeNearby = true;
        break;
      }
    }

    // Only set avoiding state if close to smoke
    if (smokeNearby && !person.reactionTime) {
      person.reactionTime = Date.now(); // Track the time they first get close to the smoke
    }

    // Change avoiding state to true if enough time has passed after initial detection
    if (!smokeNearby && person.reactionTime) {
      // Reset reaction time if smoke is no longer nearby
      person.reactionTime = null;
    }

    person.avoiding =
      smokeNearby && Date.now() - person.reactionTime >= reactionDelay;
  }
}

function avoidCollisions() {
  const collisionThreshold = 80; // Minimum distance between people
  const separationForce = 0.1; // Strength of separation force

  for (let i = 0; i < people.length; i++) {
    for (let j = i + 1; j < people.length; j++) {
      const personA = people[i];
      const personB = people[j];

      const dx = personB.x - personA.x;
      const dy = personB.y - personA.y;
      const dist = Math.hypot(dx, dy);

      if (dist < collisionThreshold) {
        // Apply a force to separate the two people
        const overlap = collisionThreshold - dist;
        const separationX = (dx / dist) * overlap * separationForce;
        const separationY = (dy / dist) * overlap * separationForce;

        // Adjust velocities instead of positions
        personA.vx -= separationX / 2;
        personA.vy -= separationY / 2;
        personB.vx += separationX / 2;
        personB.vy += separationY / 2;
      }
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

// Function to create a new smoke particle with random characteristics
function createSmokeParticle() {
  const angle = Math.atan2(mouseY - centerY, mouseX - centerX); // Direction to mouse

  // Randomize speed within a range (this makes the particles move at different speeds)
  const speed = Math.random() * 1.5 + 0.5;

  // Introduce a slight variation to the direction (deviates up to 30 degrees)
  const directionVariance = (Math.random() - 0.5) * 1.0; // Small random variance
  const variedAngle = angle + directionVariance;

  // Add the smoke particle to the array with random size, opacity, and speed
  smokeParticles.push({
    x: centerX,
    y: centerY,
    vx: Math.cos(variedAngle) * speed, // Randomized horizontal velocity
    vy: Math.sin(variedAngle) * speed, // Randomized vertical velocity
    size: Math.random() * 8 + 4, // Random initial size between 4 and 12
    opacity: 0.5, // Full opacity at the start
    opacityDecay: Math.random() * 0.005 + 0.002, // Random decay rate for opacity
    growthRate: Math.random() * 0.5 + 0.5, // Random growth rate for the particle size
  });
}

// Function to update smoke particles (random size and opacity decay)
function updateSmokeParticles() {
  for (let i = smokeParticles.length - 1; i >= 0; i--) {
    const p = smokeParticles[i];

    // Apply velocity to move the particle
    p.x += p.vx;
    p.y += p.vy;

    // Gradually increase size at a random rate
    p.size += p.growthRate;

    // Gradually fade out the opacity at a random rate
    p.opacity -= p.opacityDecay;

    // Remove particle if it's too faint (opacity becomes too low)
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
  avoidCollisions(); // Adjust positions to avoid crowding
  drawPeople(); // Draw people around the fire

  requestAnimationFrame(gameLoop); // Repeat
}
gameLoop(); // Start the loop
