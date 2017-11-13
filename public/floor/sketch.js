var result;
var compass;
function preload() {
  result = loadStrings('../data/brew_quotes.txt');
  compass = loadImage("../data/compass.png");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB);
  rectMode(CENTER);
  imageMode(CENTER);
  smooth();
}

function draw() {
  background(h, s, l);  
  image(compass, x, y);

}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}