function Neuron(intercept, coeffs, f, transformation) {
  this.intercept = intercept;
  this.coeffs = coeffs;
  this.f = f;
  this.transformation = transformation
  return this;
}

Neuron.fs = [sum, prod];
Neuron.transformations = [identity, inverse, abs, square, sig];

Neuron.prototype.activate = function(inputs) {
  var logLikelihood = this.coeffs
      .map((coeff, i) => coeff * inputs[i])
      .filter(x => x !== undefined && !Number.isNaN(x))
      .reduce(this.f)
      + this.intercept;

  return this.transformation(logLikelihood);
}

Neuron.random = function(coeffCount, presets) {
  presets = presets || {};
  var coeffs = Array.from(new Array(coeffCount));
  var coeffs = coeffs.map((_) => rnorm());
  var f = Neuron.fs[runif(0, 1, true)];
  var transformation = presets.transformation || Neuron.transformations[runif(0, Neuron.transformations.length-1, true)];
  var intercept = rnorm()
  return new Neuron(intercept, coeffs, f, transformation);
}

Neuron.prototype.mutate = function(mutability) {
  var coeffI = runif(-2, this.coeffs.length, true);
  var mutable;

  switch (coeffI) {
    case -2:
      this.transformation = Neuron.transformations[runif(0, Neuron.transformations.length-1, true)];
      break;
    case -1:
      this.f = Neuron.fs[runif(0, Neuron.fs.length - 1, true)];
      break;
    case 0:
      this.intercept += rnorm(0, mutability);
      break;
    default:
      this.coeffs[coeffI-1] += rnorm(0, mutability);
  }

  return this;
}

Neuron.prototype.copy = function() {
  var neuron = new Neuron(this.intercept, this.coeffs, this.f, this.transformation);
  return neuron;
}

