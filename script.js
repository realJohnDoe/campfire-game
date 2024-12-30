// Canvas setup
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d", { alpha: true });
ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = "high";

// Resize canvas to fill the window
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Constants
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
const circleRadius = 120; // Distance from campfire
const reactionDelay = 500; // Delay before starting to react to smoke (500ms)

// Game state
const state = {
  mouseX: centerX,
  mouseY: centerY,
  lastSmokeEmit: 0,
};

// Game entities
const people = [];
const smokeParticles = [];
const snowflakes = [];

// Configuration
const config = {
  numPeople: 9,
  smokeEmitInterval: 200,
  snowflakeCount: 100,
  movement: {
    randomStrength: 0.01,
    randomMagnitude: 10,
    damping: 0.9,
  },
};

// Sprite configuration
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

// Initialize people
for (let i = 0; i < config.numPeople; i++) {
  const angle = (i / config.numPeople) * Math.PI * 2;
  const x = centerX + Math.cos(angle) * circleRadius;
  const y = centerY + Math.sin(angle) * circleRadius;

  people.push({
    x,
    y,
    radius: 20,
    spriteIndex: Math.floor(
      Math.random() * (spriteConfig.columns * spriteConfig.rows)
    ),
    angle,
    speed: 0,
    targetAngle: angle,
    avoiding: false,
    vx: 0,
    vy: 0,
  });
}

function createSnowflake() {
  // Create snowflakes in a wider area above the screen
  const x = Math.random() * (canvas.width + 400) - 200;
  return {
    x,
    y: -20,
    size: Math.random() * 3 + 1,
    speed: Math.random() * 1 + 0.5,
    wobble: Math.random() * Math.PI * 2, // Random starting phase for wobble
    wobbleSpeed: Math.random() * 0.02 + 0.01, // How fast it wobbles side to side
  };
}

// Initialize snowflakes
for (let i = 0; i < config.snowflakeCount; i++) {
  snowflakes.push(createSnowflake());
}

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
canvas.addEventListener("mousemove", (event) => {
  const rect = canvas.getBoundingClientRect();
  state.mouseX = event.clientX - rect.left;
  state.mouseY = event.clientY - rect.top;
});

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
