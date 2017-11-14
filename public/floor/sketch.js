var quotes;
var compass;
function preload() {
  quotes = loadStrings('../data/brew_quotes.txt');
  compass = loadImage("../data/compass.png");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB);
  rectMode(CENTER);
  imageMode(CENTER);
}
var t = 0;
// var w = 0;

var is = 10;

function draw() {
  // background(h, s, l);
  background(0);

  console.log(mcount, pmcount);
  
  if (mcount != pmcount) {  
    is = 10; 
    // w++
    // console.log("BAANNGGG", w)
    pmcount = mcount;
  } 

  if(mcount == pmcount){
    is+=8 
  }

  // is = map(mouseX, 0, windowWidth, 0, 5000)
  fill(h, s, l);
  ellipse(x, y, is);
  image(compass, x, y, is, is);

}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}