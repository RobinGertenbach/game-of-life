/**
 * Creates a fully connected brain of layers
 */
function Brain(layers) {
  this.layers = layers;
  return this;
};

/**
 * inputs {String} List of names of inputs
 * layers {Int[]} List of layer depth
 */
Brain.random = function(inputs, hiddenLayers) {
  function createLayer(neuronCount, i, hiddenLayers) {
    var weightConfig = i === 0 ? inputs : hiddenLayers[i-1];
    return Array
        .from(Array(neuronCount))
        .map((_) => new Neuron.random(weightConfig));
  }

  var layers = hiddenLayers.map(createLayer)
  return new Brain(layers);
};

Brain.prototype.activate = function(inputs) {
  return this
      .layers
      .reduce(
        (input, layer) => layer.map(
          (neuron) => neuron.activate(input)),
        inputs);
};

Brain.prototype.mutate = function(r) {
  var layer = this.layers[Math.floor(Math.random() * this.layers.length)];
  var neuron = layer[Math.floor(Math.random() * layer.length)];
  neuron.mutate(r);
  return this;
}

Brain.prototype.copy = function() {
  var b = new Brain();
  b.layers = this.layers.map(layer => layer.map(neuron => neuron.copy()));
  return b;
}

Brain.prototype.reproduce = function() {
  return this.copy().mutate();
}