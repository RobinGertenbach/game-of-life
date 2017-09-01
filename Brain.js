function Brain(inputs, hidden, outputs) {
  this.inputs = inputs;
  this.hidden = hidden;
  this.outputs = outputs;
  var hidden1 = Array.from(Array(hidden))
      .map(function() {return new Neuron.random(inputs.length)}, this);
  var hidden2 = Array.from(Array(hidden))
      .map(function() {return new Neuron.random(hidden)}, this);
  var outputLayer = outputs
      .map(_ => new Neuron.random(hidden, {transformation: sig}), this);

  this.layers = [hidden1, hidden2, outputLayer];

  return this;
}

Brain.prototype.activate = function(inputs) {
  function activateLayer(inputs, layer) {
    return layer.map(neuron => neuron.activate(inputs), this);
  }
  var activations = this.layers.reduce(activateLayer, inputs);
  var output = {};
  this.outputs.forEach((key, i) => output[key] = activations[i]);
  return new Activation(output).instruction();
}

Brain.prototype.mutate = function(mutability) {
  var layer = this.layers[runif(0, this.layers.length, true)];
  var neuron = layer[runif(0, layer.length, true)];
  neuron.mutate(mutability);
  return this;
}

Brain.prototype.copy = function() {
  var brain = new Brain(this.inputs, this.hidden, this.outputs);
  brain.layers = this.layers.map(layer => layer.map(neuron => neuron.copy()));
  return brain;
}


function Activation(activations) {
  this.activations = activations;
  return this;
}

Activation.prototype.instruction = function() {
  var keys = Object.keys(this.activations);
  var values = keys.map(key => this.activations[key]);
  var highestIndex = values
      .map((_, i) => i)
      .reduce((a, b) => values[a] > values[b] ? a : b);
  return keys[highestIndex];
}

