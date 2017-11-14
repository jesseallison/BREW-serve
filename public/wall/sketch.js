//pull upvoted quotes here

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

var n = 0;

function draw() {
  background(h, s, l);
  
  var nstr = quotes[quoteNumber].replace("—", "<br /><br />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;—");
  document.getElementById("quote").innerHTML=nstr;  
  // console.log("WHYYY", document.getElementById("quote").innerHTML)

  // console.log(quotes[quoteNumber])
  
  n = n + 0.1;
  translate(width, 0);
  rotate(radians(n));
  image(compass, 0, 0, windowHeight*1.5, windowHeight*1.5);

}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}