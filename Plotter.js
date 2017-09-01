function Plotter(x, y, options) {
  this.x = x;
  if (!Array.isArray(y[0])) {
    this.y = [y]
  } else {
    this.y = y
  }
  this.title = options.title;
  this.scaleYMin = options.yMin;
  this.scaleYMax = options.yMax;
  this.colors = options.colors || Plotter.colors;
  Plotter.plotters.push(this);
  return this;
}

Plotter.min = (a, b) => a < b ? a : b;
Plotter.max = (a, b) => a > b ? a : b;
Plotter.colors = ["Blue", "Red", "Green", "Yellow", "Brown"];
Plotter.plotters = [];


Plotter.update = function() {
  Plotter.plotters.forEach(p => p.update());
}

Plotter.prototype.update  = function() {
  if (!this.y[0]) {return}
  var allYs = this.y.reduce((a,b) => a.concat(b));
  allYs = Array.isArray(allYs) ? allYs : [allYs];
  this.minX = this.x.reduce(Plotter.min);
  this.maxX = this.x.reduce(Plotter.max);
  this.minY = allYs.reduce(Plotter.min);
  this.maxY = allYs.reduce(Plotter.max);
  this.xRange = this.maxX - this.minX;
  this.yRange = this.maxY - this.minY;
  this.scaleYRange = this.scaleYMax - this.scaleYMin
  this.obs = this.x.length;


  function addRelativeCoordinates(x, i, data) {
    var ys = this.y.map(series => series[i]);
    var relYs = ys
        .map(y => y - this.minY, this)
        .map(offset => offset / (this.scaleYRange || this.yRange), this);

    return {
      x: x,
      y: ys,
      xRel: (x - this.minX) / this.xRange ,
      yRels: relYs
    }
  }

  this.points = this.x
      .map(addRelativeCoordinates, this)
      .sort((a, b) => a.x > b.x ? 1 : a.x < b.x ? -1 : 0);

  return this;
}

Plotter.prototype.line = function(x, y, width, height) {
  stroke("black")
  fill("#D6D6D6")
  rect(x, y, width, height); // background
  if (!(this.x && this.x.length > 1)) {return;}
  stroke("blue");

  function plotLines(p, i, s) {
    if (i < 1) {return;}
    var xStart  = x + s[i-1].xRel * width;
    var xEnd    = x + p.xRel * width;
    var yStarts = s[i-1].yRels.map(yRel => (y + height) - yRel*height, this);
    var yEnds   =      p.yRels.map(yRel => (y + height) - yRel*height, this);

    function plotLine(y, i) {
      stroke(this.colors[i]);
      line(xStart, yStarts[i], xEnd, yEnds[i]);
    }

    yStarts.forEach(plotLine, this);
    if (this.title) {
      noStroke()
      textSize(15)
      fill("black")
      text(this.title, x + width/2, y + 12)
    }
  }

  this.points.forEach(plotLines, this);
}





