function Log(experiment, evaluator, fields) {
  this.experiment = experiment;
  this.evaluator = evaluator;
  if (fields && fields.length) {
    fields.forEach(field => this[field] = [], this)
  }
  return this;
}


Log.prototype.log = function(stat, value) {
  var currentGeneration = this.evaluator.generation;

  if (!this[stat]) {
    this[stat] = new Array(currentGeneration);
  }
  this[stat][currentGeneration - 1] = value;
  return this;
}

