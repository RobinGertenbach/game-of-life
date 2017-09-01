function Entity(proto) {
  this.proto = proto;
  this.proto.mutability = {mutability: "Mutable", min: 0.001, max: 2};
  this.keys = Object.keys(proto);
  this.mutability = 1;
  this.result = undefined;

  this.mutables = this.keys.filter(key => this.proto[key].mutability === "Mutable");
  this.immutables = this.keys.filter(key => this.proto[key].mutability === "Immutable");

  this.senses = proto.senses;
  this.instructions = proto.instructions;
  this.brain = new Brain(proto.senses.names, 20, proto.actions.names);

  this.keys.forEach(key => this[key] = undefined)
  return this;
}

Entity.prototype.randomize = function() {
  function assignRandom(key) {
    var spec = this.proto[key];
    var multiplier = spec.max - spec.min;
    var value;
    if (spec.hasOwnProperty("start")) {
      value = spec.start;
    } else {
      value = Math.min(
        Math.max(
          rnorm() * multiplier + spec.min,
          spec.min),
        spec.max);

      if (spec.type === "discrete") {
        value = Math.round(value);
      }
    }
    this[key] = value;
  }
  this.keys.forEach(assignRandom, this);
  // We want more granularity in the smaller areas
  this.mutability = Math.log(
    runif(
      Math.pow(Math.E, this.proto.mutability.min),
      Math.pow(Math.E, this.proto.mutability.max)
    )
  )

  this.generateRepresentation();
  return this;
}

Entity.prototype.mutateBody = function() {
  var featureName = this.mutables[runif(0, this.mutables.length - 1, true)];
  var featureSpec = this.proto[featureName];
  var currentValue = this[featureName];
  var proposedValue = currentValue + rnorm(0, this.mutability, true);
  var newValue = Math.min(
    Math.max(proposedValue, featureSpec.min),
    featureSpec.max);

  this[featureName] = newValue;
  this.generateRepresentation();
  return this;
}

Entity.prototype.mutateBrain = function() {
  var layers = this.brain.layers;
  var layer = layers[runif(0, layers.length -1, true)];
  var neuron = layer[runif(0, layer.length -1, true)];
  neuron.mutate(this.mutability);
  return this;
}

Entity.prototype.mutate = function(n) {
  n = n || 1;

  for (var i = 0; i < n; i+=1) {
    if (runif(0, 1) < 0.1) {
      this.mutateBody();
    } else {
      this.mutateBrain();
    }
  }
  return this;
}

Entity.prototype.copy = function() {
  var entity = new Entity(this.proto);
  entity.brain = this.brain.copy();
  this.keys.map(key => entity[key] = this[key]);
  entity.energy = entity.proto.energy.start;
  entity.mutability = this.mutability;
  entity.generateRepresentation();
  return entity;
}

Entity.prototype.reproduce = function(n) {
  return this.copy().mutate(n);
}

Entity.prototype.knn = function(neighbours, k) {
  var x = this.x;
  var y = this.y;

  if (neighbours) {
    var knn = neighbours
      .filter(n => n != this, this)
      .map((n, i) => ({i: i, d: euclidean(x, y, n.x, n.y)}))
      .sort((d1, d2) => d1.d > d2.d ? 1 : d1.d < d2.d ? -1 : 0)
      .filter((d, i) => i <= k)
      .map(d => neighbours[d.i]);
    return knn;
  }
  return [];
}

Entity.prototype.generateRepresentation = function() {
  var cells = [];
  function addCellsForColor(color, cell) {
    var colorCount = cell[color];
    for (var ci = 0; ci < colorCount; ci+=1) {
      var newCell = new Cell(color)
      cells.push(newCell);
    }
  }
  var toIterate = ["blues", "greens", "reds", "yellows", "browns"];

  for (var i=0; i < toIterate.length; i+=1) {
    addCellsForColor(toIterate[i], this);
  }
  this.cells = cells;
  return this;
}

Entity.prototype.draw = function() {
  stroke("black")
  var brightness = this.energy;
  fill(brightness, brightness, brightness);
  circle(this.x * 20, this.y * 20, 10);
  this.cells.forEach(c => c.draw(this.x, this.y, 10));
}

Entity.prototype.reset = function() {
  this.energy = this.proto.energy.start;
  return this;
}