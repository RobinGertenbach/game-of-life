var Collision = {};
Collision.Circle = function (x, y, radius) {
  this.x = x;
  this.y = y;
  this.radius = radius;
  this.xy = {x, y}

  return this;
}

Collision.Circle.prototype.points = function() {
  var x = this.x;
  var y = this.y;
  var radius = this.radius;
  var output = [];
  var yOffset
  for (var xOffset = 0; xOffset <= radius; xOffset += 1) {
    yOffset = Math.cos(Math.PI * (xOffset / radius) / 2) * radius;
    output.push({x: x - xOffset, y: y - yOffset});
    output.push({x: x - xOffset, y: y + yOffset});
    output.push({x: x + xOffset, y: y - yOffset});
    output.push({x: x + xOffset, y: y + yOffset});
  }
  return output;
}

Collision.Circle.prototype.contains = function(xy) {
  return Collision.euclidean(this.xy, xy) <= this.radius;
}

Collision.euclidean = function(xy1, xy2) {
  return Math.sqrt(Math.abs(xy1.x - xy2.x) + Math.abs(xy1.y - xy2.y));
}

Collision.Circle.collidesWithCircle = function(c2) {
  var c1 = this;
  var smallerCircle = c1.radius < c2.radius ? c1 : c2;
  var largerCircle = smallerCircle === c1 ? c2 : c1;
  var smallerPoints = smallerCircle.points();
  for (var pointI = 0; pointI < smallerPoints.length; pointI += 1) {
    if (largerCircle.contains(smallerPoints[pointI])) {
      return true;
    }
  }
  return false;
}


// simple collisoin, just looks at end points because robots are slow
Collision.collide = function(r1, r2) {

  // Need to get targetxys
  var c1 = new Circle(r1.x, r1.y, r1.radius());
  var c2 = new Circle(r2.x, r2.y, r2.radius());

  if (c1.collidesWithCircle(c2)) {
    var v1 = [r1.xVel, r1.yVel]// vector
    var v2 = [r1.xVel, r1.yVel]
    var m1 = r1.totalWeight();
    var m2 = r2.totalWeight();

  }
}


/*
if collision look at vectors
look at weight



// gotta round that shit in the battle

console.log(Collision.euclidean({x:1, y:1}, {x:-1, y:2}))*/