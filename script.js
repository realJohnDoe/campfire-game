// Canvas setup
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d", { alpha: true });
ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = "high";

// Variables that will be updated on resize
let centerX;
let centerY;

// Game state
const state = {
  mouseX: centerX,
  mouseY: centerY,
  lastSmokeEmit: 0,
  isTouching: false, // Track if user is currently touching
  lastTouchX: centerX,
  lastTouchY: centerY,
};

// Resize canvas to fill the window
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  centerX = canvas.width / 2;
  centerY = canvas.height / 2;

  // Update mouse position to center when resizing
  state.mouseX = centerX;
  state.mouseY = centerY;
}

// Initial setup
resizeCanvas();

// Constants
const circleRadius = 120; // Distance from campfire
const reactionDelay = 500; // Delay before starting to react to smoke (500ms)

// Load images
const peopleSprites = new Image();
peopleSprites.src = "people-sprites.png";

const spriteConfig = {
  width: 170,
  height: 256,
  columns: 6,
  rows: 4,
};

const campfireSprites = new Image();
campfireSprites.src = "campfire-sheet.png";

const campfireConfig = {
  width: 32,
  height: 64,
  frames: 8,
  currentFrame: 0,
  lastFrameUpdate: 0,
  frameInterval: 100, // Update frame every 100ms
};

const treeImage = new Image();
treeImage.src = "tree.png";

// Game entities
const people = [];
const smokeParticles = [];
const snowflakes = [];
const trees = [];

// Configuration
const config = {
  numPeople: 9,
  numTrees: 6,
  smokeEmitInterval: 200,
  snowflakeCount: 100,
  treeRadius: 350, // Trees will be placed further out than people
  movement: {
    randomStrength: 0.01,
    randomMagnitude: 10,
    damping: 0.9,
  },
};

// Initialize people
const totalSprites = spriteConfig.columns * spriteConfig.rows;
const availableSpriteIndices = Array.from(
  { length: totalSprites },
  (_, i) => i
);

// Shuffle the available indices
for (let i = availableSpriteIndices.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [availableSpriteIndices[i], availableSpriteIndices[j]] = [
    availableSpriteIndices[j],
    availableSpriteIndices[i],
  ];
}

for (let i = 0; i < config.numPeople; i++) {
  const angle = (i / config.numPeople) * Math.PI * 2;
  const x = centerX + Math.cos(angle) * circleRadius;
  const y = centerY + Math.sin(angle) * circleRadius;

  people.push({
    x,
    y,
    radius: 20,
    spriteIndex: availableSpriteIndices[i], // Use next available unique index
    angle,
    speed: 0,
    targetAngle: angle,
    avoiding: false,
    vx: 0,
    vy: 0,
  });
}

// Initialize snowflakes across the screen
for (let i = 0; i < config.snowflakeCount; i++) {
  snowflakes.push(createSnowflake(true));
}

// Initialize trees after image is loaded
treeImage.onload = () => {
  // Clear existing trees
  trees.length = 0;

  const margin = 100; // Fixed margin from edges
  const minDistance = 300; // Minimum distance from center
  const maxAttempts = 100; // Maximum attempts to place each tree

  while (trees.length < config.numTrees && maxAttempts > 0) {
    // Generate random position within screen bounds
    const scale = 0.8 + Math.random() * 0.2;
    const treeWidth = treeImage.width * scale;
    const treeHeight = treeImage.height * scale;

    const x =
      margin +
      treeWidth / 2 +
      Math.random() * (canvas.width - 2 * margin - treeWidth);
    const y =
      margin +
      treeHeight +
      Math.random() * (canvas.height - 2 * margin - treeHeight);

    // Check distance from center
    const distanceFromCenter = Math.hypot(x - centerX, y - centerY);
    if (distanceFromCenter < minDistance) continue;

    // Check distance from other trees
    let tooClose = false;
    for (const tree of trees) {
      const dist = Math.hypot(x - tree.x, y - tree.y);
      if (dist < 100) {
        // Minimum distance between trees
        tooClose = true;
        break;
      }
    }
    if (tooClose) continue;

    trees.push({
      x,
      y,
      scale,
    });
  }
};

// Drawing functions
function drawPeople() {
  for (const person of people) {
    const row = Math.floor(person.spriteIndex / spriteConfig.columns);
    const col = person.spriteIndex % spriteConfig.columns;

    ctx.save();
    ctx.translate(person.x, person.y);
    ctx.drawImage(
      peopleSprites,
      col * spriteConfig.width,
      row * spriteConfig.height,
      spriteConfig.width,
      spriteConfig.height,
      -person.radius,
      -person.radius * 2,
      person.radius * 2,
      person.radius * 4
    );
    ctx.restore();
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
  gradient.addColorStop(0, "rgba(255, 234, 0, 0.6)");
  gradient.addColorStop(1, "rgba(255, 69, 0, 0)");

  ctx.beginPath();
  ctx.arc(centerX, centerY, 100, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
}

function drawCampfire() {
  // Draw the current frame of the campfire sprite
  ctx.save();
  ctx.translate(centerX, centerY - campfireConfig.height * 1.5 - 40); // Added 40px upward offset
  ctx.drawImage(
    campfireSprites,
    campfireConfig.currentFrame * campfireConfig.width,
    0,
    campfireConfig.width,
    campfireConfig.height,
    -campfireConfig.width * 1.5,
    0,
    campfireConfig.width * 3,
    campfireConfig.height * 3
  );
  ctx.restore();
}

function drawSmokeParticles() {
  for (const p of smokeParticles) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(128, 128, 128, ${p.opacity})`; // Gray color with opacity
    ctx.fill();
  }
}

function drawSnowflakes() {
  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  for (const flake of snowflakes) {
    ctx.beginPath();
    ctx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawTrees() {
  for (const tree of trees) {
    ctx.save();
    ctx.translate(tree.x, tree.y);
    ctx.scale(tree.scale, tree.scale);
    ctx.drawImage(treeImage, -treeImage.width / 2, -treeImage.height);
    ctx.restore();
  }
}

// Update functions
function updateFlames() {
  const now = Date.now();
  if (now - campfireConfig.lastFrameUpdate > campfireConfig.frameInterval) {
    // Update to the next frame
    campfireConfig.currentFrame =
      (campfireConfig.currentFrame + 1) % campfireConfig.frames;
    campfireConfig.lastFrameUpdate = now;
  }
}

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

function updateSnowflakes() {
  const wind = calculateWind();
  const windRadius = 150; // How far from the fire the wind affects snowflakes

  for (let i = snowflakes.length - 1; i >= 0; i--) {
    const flake = snowflakes[i];

    // Update wobble
    flake.wobble += flake.wobbleSpeed;

    // Basic downward movement
    flake.y += flake.speed;

    // Calculate distance to fire
    const dx = flake.x - centerX;
    const dy = flake.y - centerY;
    const distanceToFire = Math.hypot(dx, dy);

    // Calculate wind influence (0 to 1) based on distance to fire
    const windInfluence = Math.max(0, 1 - distanceToFire / windRadius);

    // Add wind effect, scaled by distance to fire and cursor distance
    flake.x += Math.cos(wind.angle) * wind.strength * windInfluence;
    flake.y += Math.sin(wind.angle) * wind.strength * 0.5 * windInfluence;

    // Add wobble movement
    flake.x += Math.sin(flake.wobble) * 0.5;

    // Remove if out of bounds and create new one
    if (
      flake.y > canvas.height ||
      flake.x < -100 ||
      flake.x > canvas.width + 100
    ) {
      snowflakes[i] = createSnowflake();
    }
  }
}

function emitSmokeParticles() {
  const now = Date.now();
  if (now - state.lastSmokeEmit > config.smokeEmitInterval) {
    createSmokeParticle();
    state.lastSmokeEmit = now;
  }
}

function createSmokeParticle() {
  const wind = calculateWind();
  const speed = Math.random() * 1.5 + 0.2 * wind.strength; // Base speed plus wind contribution

  // Add the smoke particle to the array with random size, opacity, and speed
  smokeParticles.push({
    x: centerX,
    y: centerY,
    vx: Math.cos(wind.angle) * speed,
    vy: Math.sin(wind.angle) * speed,
    size: Math.random() * 8 + 4,
    opacity: 0.5,
    opacityDecay: Math.random() * 0.005 + 0.002,
    growthRate: Math.random() * 0.5 + 0.5,
  });
}

function calculateWind() {
  const windAngle = Math.atan2(state.mouseY - centerY, state.mouseX - centerX);
  const cursorDistance = Math.hypot(
    state.mouseX - centerX,
    state.mouseY - centerY
  );
  const maxWindDistance = 300; // Distance at which wind reaches maximum strength
  const maxWindStrength = 3;

  // Wind strength scales with cursor distance
  const windStrength =
    Math.min(cursorDistance / maxWindDistance, 1) * maxWindStrength;

  return {
    angle: windAngle,
    strength: windStrength,
  };
}

// Movement functions
function applyFireRepulsion() {
  const fireRepulsionRadius = 70; // Distance at which fire starts pushing people away
  const repulsionStrength = 0.8; // Strength of the repulsion force

  for (const person of people) {
    const dx = person.x - centerX;
    const dy = person.y - centerY;
    const distanceToFire = Math.hypot(dx, dy);

    if (distanceToFire < fireRepulsionRadius) {
      // Calculate repulsion force that increases as they get closer
      const repulsionFactor =
        (1 - distanceToFire / fireRepulsionRadius) * repulsionStrength;
      const angle = Math.atan2(dy, dx);

      // Apply strong outward force
      person.vx += Math.cos(angle) * repulsionFactor;
      person.vy += Math.sin(angle) * repulsionFactor;
    }
  }
}

function movePeople() {
  const damping = config.movement.damping;

  for (const person of people) {
    // Apply a random movement step with a larger magnitude
    const randomX =
      (Math.random() - 0.5) *
      config.movement.randomStrength *
      config.movement.randomMagnitude;
    const randomY =
      (Math.random() - 0.5) *
      config.movement.randomStrength *
      config.movement.randomMagnitude;

    // Apply random movement
    person.vx += randomX;
    person.vy += randomY;

    if (person.avoiding) {
      // Move outward from the campfire (away from smoke) and rotate along the circle
      let dx = person.x - centerX;
      let dy = person.y - centerY;

      const angleToMouse = Math.atan2(dy, dx);
      const targetAngle =
        angleToMouse + Math.sign(state.mouseX - centerX) * 0.1;

      // Calculate movement based on angle
      const radius = Math.hypot(dx, dy);
      const targetX = centerX + Math.cos(targetAngle) * (radius + person.speed);
      const targetY = centerY + Math.sin(targetAngle) * (radius + person.speed);

      // Adjust velocity toward the target position
      person.vx += (targetX - person.x) * 0.02;
      person.vy += (targetY - person.y) * 0.02;
    } else {
      // Calculate position on the circle (return to the circle)
      const angle = Math.atan2(person.y - centerY, person.x - centerX);
      const targetX = centerX + Math.cos(angle) * circleRadius;
      const targetY = centerY + Math.sin(angle) * circleRadius;

      // Adjust velocity toward the circle position
      person.vx += (targetX - person.x) * 0.02;
      person.vy += (targetY - person.y) * 0.02;
    }

    // Apply velocities to update positions
    person.x += person.vx;
    person.y += person.vy;

    // Apply damping to smooth movement
    person.vx *= damping;
    person.vy *= damping;

    // Manage reaction delay if close to smoke
    if (person.avoiding) {
      person.reactionTime = person.reactionTime || Date.now();
    }

    // If within the reaction delay and close to smoke, don't react yet
    if (
      !person.avoiding &&
      person.reactionTime &&
      Date.now() - person.reactionTime < reactionDelay
    ) {
      person.avoiding = true;
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
  const collisionThreshold = 70; // Minimum distance between people
  const separationForce = 0.05; // Strength of separation force

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

// Event listeners
window.addEventListener("resize", () => {
  resizeCanvas();
  // Re-center any entities that need to be centered
  for (const person of people) {
    person.x = centerX + Math.cos(person.angle) * circleRadius;
    person.y = centerY + Math.sin(person.angle) * circleRadius;
  }

  // Re-position trees
  for (const tree of trees) {
    const angle = Math.atan2(tree.y - centerY, tree.x - centerX);
    const distance = Math.hypot(tree.x - centerX, tree.y - centerY);
    tree.x = centerX + Math.cos(angle) * distance;
    tree.y = centerY + Math.sin(angle) * distance;
  }
});

// Mouse movement handler
function updateMousePosition(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  state.mouseX = clientX - rect.left;
  state.mouseY = clientY - rect.top;
}

// Mouse event
canvas.addEventListener("mousemove", (event) => {
  updateMousePosition(event.clientX, event.clientY);
});

// Touch events
canvas.addEventListener(
  "touchstart",
  (event) => {
    event.preventDefault();
    if (event.touches.length > 0) {
      updateMousePosition(event.touches[0].clientX, event.touches[0].clientY);
    }
  },
  { passive: false }
);

canvas.addEventListener(
  "touchmove",
  (event) => {
    event.preventDefault();
    if (event.touches.length > 0) {
      updateMousePosition(event.touches[0].clientX, event.touches[0].clientY);
    }
  },
  { passive: false }
);

canvas.addEventListener(
  "touchend",
  (event) => {
    event.preventDefault();
  },
  { passive: false }
);

// Add meta viewport tag for proper mobile scaling
const metaTag = document.createElement("meta");
metaTag.name = "viewport";
metaTag.content =
  "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no";
document.head.appendChild(metaTag);

// Game loop
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawGlow();
  updateFlames();
  drawCampfire();
  emitSmokeParticles();
  updateSmokeParticles();
  drawSmokeParticles();
  updateSnowflakes();
  drawSnowflakes();
  drawTrees();

  applyFireRepulsion();
  checkSmokeProximity();
  movePeople();
  avoidCollisions();
  drawPeople();

  requestAnimationFrame(gameLoop);
}

// Start game when sprites are loaded
peopleSprites.onload = () => {
  gameLoop();
};

function createSnowflake(initializing = false) {
  // If initializing, place anywhere on screen, otherwise above screen
  const x = Math.random() * (canvas.width + 400) - 200;
  const y = initializing ? Math.random() * canvas.height : -20;

  return {
    x,
    y,
    size: Math.random() * 3 + 1,
    speed: Math.random() * 1 + 0.5,
    wobble: Math.random() * Math.PI * 2,
    wobbleSpeed: Math.random() * 0.02 + 0.01,
  };
}
