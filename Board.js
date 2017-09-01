function Board(exp, width, height) {
  if (width * height < exp.pool.entities.length) {
    throw "Board size too small";
  }
  this.exp = exp;
  this.height = height;
  this.width = width;
  return this;
}

Board.prototype.placeEntities = function() {
  var x, y;
  var xys = [];
  for (entityI = 0; entityI < this.exp.pool.entities.length; entityI += 1) {
    var entity = this.exp.pool.entities[entityI];
    do {
      x = runif(0, this.width - 1, true);
      y = runif(0, this.height - 1, true);
    } while (xys.filter(e => e.x === x && e.y === y).length)
    entity.x = x;
    entity.y = y;
    xys.push({x: x, y: y});
  }
  return this;
}

Board.prototype.placeVeggies = function(n) {
  var x, y, xy;
  var xys = this.exp.pool.entities.map(e => ({x: e.x, y: e.y}));
  var veggies = [];
  for (var veggieI = 0; veggieI < n; veggieI += 1) {
    do {
      x = runif(0, this.width - 1, true);
      y = runif(0, this.height - 1, true);
    } while (xys.filter(e => e.x === x && e.y === y).length)
    xy = {x: x, y: y};
    xys.push(xy);
    veggies.push(xy);
  }
  this.veggies = veggies;
}

Board.prototype.placeMeat = function(x, y) {
  if (this.meat === undefined) {
    this.meat = [{x: x, y: y}];
  } else {
    this.meat.push({x: x, y: y});
  }
}


Board.prototype.draw = function() {
  fill("green");
  stroke("black")
  if (this.veggies) {
    this.veggies.forEach(v => circle(v.x * 20, v.y * 20, 5));
  }

  fill("brown");
  if (this.meat) {
    this.meat.forEach(m => circle(m.x * 20, m.y * 20, 5));
  }
  return this;
}