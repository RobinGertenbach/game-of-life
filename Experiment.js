/**
 *
 * @param {Spec}
 *   objective: An objective function that returns a value
 *   goal: "high" to maximize the objective or "low"
 *   size: Population size
 *   proto: Dictionary of specs
 *     mutability: "Mutable", or "Immutable" (Immutables cannot be changed by the entity)
 *     min: Minimum value for control purposes
 *     max: max value for control purposes
 *     type: continuous, discrete
 *     start: (optional) starting value
 */
function Experiment(specs) {
  var spec_names = Object.keys(specs);
  var required_specs = ["goal", "size", "proto"];

  function specIsProvided(requiredSpec) {
    if (spec_names.indexOf(requiredSpec) === -1) {
      throw "Missing " + requiredSpec;
    }
  }

  required_specs.forEach(specIsProvided);

  function assignSpecToThis(specName) {
    this[specName] = specs[specName];
  }

  spec_names.forEach(assignSpecToThis, this)
  return this;
}


Experiment.prototype.makePool = function() {
  this.pool = new Pool(this.size, this.proto);
  return this;
}

Experiment.prototype.evaluate = function() {
  this.pool.evaluate(this);
  return this;
}

Experiment.prototype.sort = function() {
  this.pool.sort(this.goal === "high", "desc", "asc");
  return this;
}

Experiment.prototype.cull = function(board) {
  var entities = this.pool.entities;
  for (var i = 0; i < entities.length; i += 1) {
    if (entities[i].energy <= 0) {
      board.placeMeat(entities[i].x, entities[i].y);
      entities.splice(i, 1);
      i -= 1;
    }
  }
  return this;
}

Experiment.prototype.reproduce = function() {
  var entities = this.pool.entities;
  var originalEntityCount = entities.length;
  if (entities.length) {
    for (
        var ei = 0;
        ei < originalEntityCount && this.pool.entities.length < this.size;
        ei += 1) {
      var newEntitiy = entities[ei].reproduce();
      this.pool.entities.push(newEntitiy);
    }
  }

  while (this.pool.entities.length < this.size) {
    var newEntitiy = new Entity(this.proto).randomize();
    this.pool.entities.push(newEntitiy);
  }
  return this;
}

Experiment.prototype.cycleGeneration = function(n) {
  n = n || 1;

  while (n > 0) {
    this.evaluate();
    this.cull();
    this.reproduce();
  }
}

Experiment.prototype.draw = function(eval) {
  eval.board.draw();
  this.pool.entities.forEach(e => e.draw(), this)
}

Experiment.prototype.resetEntities = function() {
  this.pool.entities.forEach(e => e.reset());
  return this;
}