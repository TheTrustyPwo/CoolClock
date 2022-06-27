const cvs = document.querySelector('canvas');
const c = cvs.getContext('2d');

cvs.width = window.innerWidth;
cvs.height = window.innerHeight;

window.addEventListener('resize', () => {
  cvs.width = window.innerWidth;
  cvs.height = window.innerHeight;
});

let mouse = { x: 0, y: 0 };

window.addEventListener('mousemove', e => {
  mouse.x = e.x;
  mouse.y = e.y;
});

let mouseDown = 0;

document.body.onmousedown = function() { ++mouseDown; }
document.body.onmouseup = function() { --mouseDown; }

document.addEventListener('keyup', event => {
  // Applies the next image to all entities
  if (event.code === 'Space') {
    imageNumber += 1;
    if (imageNumber >= imageArr.length) imageNumber = 0;
  }

  // Teleport all entities to random positions
  else if (event.key === 'r') {
    entityArray.forEach(entity => {
      entity.x = Math.random() * (cvs.width + 1) << 0;
      entity.y = Math.random() * (cvs.height + 1) << 0;
    })
  }
})

// Initializing Variables
let time = "";
let imageNumber = 0;

// Constant modifier variables
const speed = 5;
const friction = 85;
const scale = 50;
const pad = 20;
const radius = 20;

// Preloading each character's position relative to canvas size
const unit = cvs.width / 3;
const left = (unit - scale * 6 - pad) / 2 + scale * 3 / 2;
const right = left + scale * 3 + pad;
const centerY = cvs.height / 2;
const chrCoor =
    [[left, centerY], [right, centerY], // HOURS
    [unit, centerY], // Separator
    [left + unit, centerY], [right + unit, centerY], // MINUTES
    [unit * 2, centerY], // Separator
    [left + unit * 2, centerY], [right + unit * 2, centerY]]; // SECONDS

// Relative coordinate of each dot for all displayable numbers or symbols on a 3 by 5 grid
const relCoor =
  { '0': [[1, 2], [1, -2], [1, 0], [0, 2], [1, 1], [-1, 1], [-1, -1], [1, -1], [0, -2], [-1, 2], [-1, 0], [-1, -2]],
    '1': [[1, 2], [1, -2], [1, 0], [1, 1], [1, -1]],
    '2': [[1, 2], [1, -2], [1, 0], [0, -2], [1, -1], [0, 0], [-1, 1], [0, 2], [-1, -2], [-1, 0], [-1, 2]],
    '3': [[1, 2], [1, -2], [1, 0], [0, -2], [1, -1], [0, 0], [1, 1], [0, 2], [-1, -2], [-1, 0], [-1, 2]],
    '4': [[1, 2], [1, -2], [1, 0], [-1, -1], [1, -1], [0, 0], [1, 1], [-1, -2], [-1, 0]],
    '5': [[1, 2], [1, -2], [1, 0], [0, 2], [1, 1], [0, 0], [-1, -1], [0, -2], [-1, 2], [-1, 0], [-1, -2]],
    '6': [[1, 2], [1, -2], [1, 0], [0, -2], [-1, -1], [0, 0], [-1, 1], [1, 1], [0, 2], [-1, -2], [-1, 0], [-1, 2]],
    '7': [[1, 2], [1, -2], [1, 0], [0, -2], [1, -1], [1, 1], [-1, -2]],
    '8': [[1, 2], [1, -2], [1, 0], [0, -2], [1, -1], [-1, 1], [0, 0], [-1, -1], [1, 1], [0, 2], [-1, -2], [-1, 0], [-1, 2]],
    '9': [[1, 2], [1, -2], [1, 0], [0, 2], [1, 1], [0, 0], [-1, -1], [1, -1], [0, -2], [-1, 2], [-1, 0], [-1, -2]],
    ':': [[0, -1], [0, 1]] };

// Shuffles the list of segment coordinates to be unique everytime
for (const chr in relCoor) {
  relCoor[chr] = relCoor[chr]
    .map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}

// Array of image patterns for the entity
const imageArr = [];

(async() => {
  for (const file of ["img/default.png", "img/gold.png", "img/rainbow.png", "img/block.png", "img/ladybug.png", "img/minecraft.png", "img/pikachu.png"]) {
    const image = await loadImage(file);
    imageArr.push(image)
  }
})();

/*
  Calculates the distance between any 2 points using Pythagoras Theorem
 */
function distance(x1, y1, x2, y2) {
  let xDistance = x2 - x1;
  let yDistance = y2 - y1;
  return Math.sqrt(Math.pow(xDistance, 2) + Math.pow(yDistance, 2));
}

/*
  Represents an entity used to display the time and separators
 */
class Entity {
  constructor(digit, segment) {
    this.chr = digit;
    this.segment = segment;
    this.x = Math.random() * (cvs.width + 1) << 0;
    this.y = Math.random() * (cvs.height + 1) << 0;
    this.tx = 0;
    this.ty = 0;
    this.xv = 0;
    this.yv = 0;
    this.rotation = 0;
    this.visible = true;
  }

  /*
    Renders the entity
   */
  draw = () => {
    if (this.visible) {
      c.beginPath();
      c.arc(this.x, this.y, radius, 0, 2 * Math.PI, false);
      c.drawImage(imageArr[imageNumber], this.x - radius, this.y - radius, 2 * radius, 2 * radius)
    }

    this.update();
  }

  /*
    Updates the position of the entity
   */
  update = () => {
    this.visible = true;

    // Determines the default position (Relative position [0, 0]) of the character which this entity is assigned to
    this.tx = chrCoor[this.chr][0]
    this.ty = chrCoor[this.chr][1]

    // Retrieves character from time string
    const chr = time.charAt(this.chr);

    // If this entity is not needed to display the character, it is hidden
    if (this.segment >= relCoor[chr].length) {
      this.visible = false;
      return;
    }

    this.tx += relCoor[chr][this.segment][0] * scale;
    this.ty += relCoor[chr][this.segment][1] * scale;

    // If mouse is being held, the entity will point and travel towards the mouse, else to its designated position
    // This is calculates the angle of the endpoint relative the starting point in the clockwise direction using inverse tangent
    if (mouseDown) this.rotation = (Math.atan((mouse.y - this.y) / (mouse.x - this.x)) * 180 / Math.PI) + ((mouse.x - this.x) < 0) * 180;
    else this.rotation = (Math.atan((this.ty - this.y) / (this.tx - this.x)) * 180 / Math.PI) + ((this.tx - this.x) < 0) * 180;

    // Slightly randomness for visual effects
    this.rotation += Math.random() * 10;

    // Calculates the distance to move using trigonometric functions with a fixed speed
    this.xv += Math.sin((90 - this.rotation) * Math.PI / 180) * speed;
    this.yv += Math.cos((90 - this.rotation) * Math.PI / 180) * speed;

    // Applies friction to prevent the entity from overshooting the designated position too much
    this.xv *= friction / 100;
    this.yv *= friction / 100;

    // Finally, apply positional changes to the entity
    this.x += this.xv;
    this.y += this.yv;

    // Teleport the entity to a random position if it's touching the mouse pointer
    if (distance(this.x, this.y, mouse.x, mouse.y) < radius) {
      this.x = Math.random() * (cvs.width + 1) << 0;
      this.y = Math.random() * (cvs.height + 1) << 0;
    }
  }
}

const entityArray = [];

// For every character (8 of them), they use up a maximum of 13 out of 15 segments of the 3 by 5 grid
// Hence the following values
for (let chr = 0; chr < 8; chr++) {
  for (let segment = 0; segment < 13; segment++) {
    entityArray.push(new Entity(chr, segment))
  }
}

/*
  Loads an image asynchronously
 */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  })
}

/*
  Updates the time string with the format: HH:MM:SS
 */
function updateTime() {
  time = new Date().toTimeString().split(' ')[0];
}

/*
  Renders all text displays
 */
function renderText() {
  c.font = "30px Quantum"
  c.fillStyle = "white"
  c.textAlign = "center"
  c.fillText("The Coolest Clock On The Internet", cvs.width / 2, cvs.height / 6)
  c.fillText("Made By: ThePwo", cvs.width / 2, cvs.height * 5 / 6);
}

/*
  Runs animation at 60 FPS
 */
function animate() {
  updateTime()
  requestAnimationFrame(animate);
  c.clearRect(0, 0, window.innerWidth, window.innerHeight);
  entityArray.forEach(entity => entity.draw());
  renderText();
}

animate();
