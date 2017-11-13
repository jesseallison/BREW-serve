var result;
function preload() {
  result = loadStrings('../data/brew_quotes.txt');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB);
  rectMode(CENTER);
  smooth();
}

function draw() {

  background(h, s, l);  

  textAlign(CENTER);
 
  textSize(24); 
  fill(200);
  text(result[q], windowWidth/2, windowHeight/2, windowWidth/2, windowHeight/2);

}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}