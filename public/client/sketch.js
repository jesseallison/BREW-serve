var quotes;
function preload() {
  quotes = loadStrings('../data/brew_quotes.txt');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB);
  rectMode(CENTER);
  smooth();
}

var w = 0;
var h1 = 0;
var s1 = 0;
var l1 = 20;

function draw() {
  background(h1, s1, l1);

  var nstr = quotes[quoteNumber].replace("—", "<br /><br />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;—");
  document.getElementById("quote").innerHTML = nstr;

  console.log(mcount, pmcount);

  if (mcount != pmcount) {
    w++
    console.log("BAANNGGG", w)
    pmcount = mcount;
    h1 = h;
    s1 = s;
    l1 = l;
  }

  if (mcount = pmcount) {
    if (l1 > 0) { 
      l1-=0.05; 
    }
  }
  // console.log(l1);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}