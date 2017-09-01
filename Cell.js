function Cell(color) {
  this.color   = color;
  this.angle   = runif(0, 1);
  this.offset  = runif(0, 1);
  this.radians = Math.PI * 2 * this.angle;
  this.xOffset = Math.sin(this.radians) * this.offset;
  this.yOffset = Math.cos(this.radians) * this.offset;

  return this;
}


Cell.prototype.draw = function(x, y, radius) {
  var colors = {
    blues: "#03A9F4",
    reds: "#E91E63",
    greens: "#0F9D58",
    yellows: "#F4B400",
    browns: "#795548"
  }

  fill(colors[this.color]);
  circle(x*20 + this.xOffset * radius, y*20 + this.yOffset * radius, 2)
}

// Adapt to radius (take board as argument)