function Neuron(weights, intercept) {
  this.type = Neuron.arrayOrDict(weights);
  this.weights = weights;
  this.intercept = intercept || 0;
  return this;
};

Neuron.random = function(weights, rand) {
  rand = rand || Neuron.rnorm;
  var constructorInput;
  if (Array.isArray(weights)) {
    constructorInput = {};
    weights.forEach((weight) => constructorInput[weight] = rand(), this);
  } else {
    constructorInput = Array.from(Array(weights)).map((weight) => rand());
  }
  var intercept = rand();
  return new Neuron(constructorInput, intercept);
};

Neuron.rnorm = function(mu, sd) {
  mu = mu || 0;
  sd = sd || 1;

  var u = Math.random();
  var v = Math.random();
  var r = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return r * sd + mu;
};

Neuron.arrayOrDict = function(x) {
  if (Array.isArray(x)) {
    return "Array";
  }
  if (typeof x === "object") {
    return "Dict";
  }
  throw "Unsupported type: " + x;
};

Neuron.sig = function(x) {
  return 1 / (1 + Math.pow(Math.E, -x));
};

Neuron.prototype.activate = function(inputs, ignoreMissing) {
  var inputType = Neuron.arrayOrDict(inputs);

  if (inputType !== this.type) {
    throw "Input of wrong type";
  }
  if (inputType === "Array") {
    return this.activateArray(inputs, ignoreMissing);
  }  else {
    return this.activateDict(inputs, ignoreMissing);
  }
};

Neuron.prototype.activateArray = function(inputs, ignoreMissing) {
  ignoreMissing = ignoreMissing || true;
  var logOdds = inputs
      .map((input, i) => ({input: input, i: i}))
      .filter((input) => !ignoreMissing
        || (input.input !== undefined && !Number.isNaN(input.input)))
      .map((input) => input.input * this.weights[input.i], this)
      .reduce((a, b) => a + b, 0) + this.intercept;

  return Neuron.sig(logOdds);
};

Neuron.prototype.activateDict = function(inputs, ignoreMissing) {
  ignoreMissing = ignoreMissing || true;

  var logOdds = Object
      .keys(this.weights)
      .map((key) => ({key: key, weight: this.weights[key]}), this)
      .map((weight) => weight.weight * inputs[weight.key])
      .filter((value) => !ignoreMissing || !Number.isNaN(value))
      .reduce((a, b) => a + b, 0) + this.intercept;

  return Neuron.sig(logOdds);
};

Neuron.prototype.mutate = function(r) {
  r = r || Neuron.rnorm;
  if (this.type == "Dict") {
    this.mutateDict(r);
  } else {
    this.mutateArray(r);
  }
  return this;
};

Neuron.prototype.mutateArray = function(r) {
  r = r || Neuron.rnorm;
  var index = Math.floor(Math.random() * (this.weights.length + 1));
  if (index === this.weights.length) {
    this.intercept += r();
  } else {
    this.weights[index] += r();
  }
};

Neuron.prototype.mutateDict = function(r) {
  r = r || Neuron.rnorm;
  var keys = Object.keys(this.weights);
  var index = Math.floor(Math.random() * (keys.length + 1));

  if (index === keys.length) {
    this.intercept += r();
  } else {
    this.weights[keys[index]] += r();
  }
  return this;
};

Neuron.prototype.copy = function() {
  var weights;
  if (this.type === "Array") {
    weights = this.weights.map(w => w);
  } else {
    var keys = Object.keys(this.weights);
    weights = {};
    keys.forEach(key => weights[key] = this.weights[key], this);
  }

  return new Neuron(weights, this.intercept);
};

// Tests

(function(){
  try {
    new Neuron();
    throw "Missing weights Should throw error";
  } catch(e) {
    return
  }
})();

(function(){
  var n  = new Neuron({"A": 3}, 4);
  if (n.weights.A !== 3 || n.intercept !== 4) {
    throw "Dictionary constructor does not assign weights correctly!\n" +
      "Has: " + n.weights + " Intercept: " + n.intercept + "\n" +
      "Should have: {A: 3} Intercept: 4";
  }
})();

(function(){
  var n  = new Neuron({"A": 3});
  if (n.intercept !== 0) {
    throw "Missing Intercept Should make 0";
  }
})();

(function(){
  var weights = [1, 2, 3]
  var n  = new Neuron(weights);
  if (!n.weights.map((w, i) => w === weights[i]).reduce((a, b) => a && b)) {
    throw "Array constructor does not assign weights correctly\n" +
      "Has: " + n.weights + " Intercept: 0\n" +
      "Should have: 1, 2, 3 Intercept: 0";
  }
})();

(function() {
  var weights = [2, 2, 2];
  var inputs = [1, 2, 3];
  var n = new Neuron(weights);
  var is = n.activate(inputs);
  var Should = Neuron.sig(
    weights
        .map((w, i) => w * inputs[i])
        .reduce((a, b) => a + b));

  if (is !== Should) {
    throw "Array activation does not return proper value\n" +
      "Has: " + is + "\nShhould have: " + Should;
  }
})();

(function() {
  var weights = [2, 2, 2];
  var inputs = [1, undefined, 3];
  var n = new Neuron(weights);
  var is = n.activate(inputs);
  var Should = Neuron.sig(2*1 + 2*3);

  if (is !== Should) {
    throw "Array activation does not return proper value when has undefined\n" +
      "Has: " + is + "\nShhould have: " + Should;
  }
})();

(function() {
  var weights = [2, 2, 2];
  var inputs = [1, , 3];
  var n = new Neuron(weights);
  var is = n.activate(inputs);
  var Should = Neuron.sig(2*1 + 2*3);

  if (is !== Should) {
    throw "Array activation does not return proper value when has empty\n" +
      "Has: " + is + "\nShhould have: " + Should;
  }
})();

(function() {
  var weights = [2, 2, 2];
  var inputs = [1, NaN, 3];
  var n = new Neuron(weights);
  var is = n.activate(inputs);
  var Should = Neuron.sig(2*1 + 2*3);

  if (is !== Should) {
    throw "Array activation does not return proper value when has NaN\n" +
      "Has: " + is + "\nShhould have: " + Should;
  }
})();

(function() {
  var weights = [2, 2, 2];
  var inputs = [undefined];
  var n = new Neuron(weights);
  var is = n.activate(inputs);
  var Should = Neuron.sig(0);
  if (is !== Should) {
    throw "Activation of input [undefined] Should be 0.5, was " + is;
  }
})();

(function() {
  var weights = {A: 2, B: 2, C: 2};
  var inputs = {A: 1, B: 2, C: 3};
  var n = new Neuron(weights);
  var is = n.activate(inputs);
  var Should = Neuron.sig([2*1 + 2*2 + 2*3].reduce((a, b) => a+b));
  if (is !== Should) {
    throw "Activation of proper dict input Should be " + Should + ", was " + is;
  }
})();

(function() {
  var weights = {A: 2, B: 2, C: 2};
  var inputs = {A: 1, C: 3};
  var n = new Neuron(weights);
  var is = n.activate(inputs);
  var Should = Neuron.sig([2*1 + 2*3].reduce((a, b) => a+b));
  if (is !== Should) {
    throw "Activation of dict input sans 1 Should be " + Should + ", was " + is;
  }
})();

(function() {
  var weights = {A: 2, B: 2, C: 2};
  var inputs = {A: 1, B: undefined, C: 3};
  var n = new Neuron(weights);
  var is = n.activate(inputs);
  var Should = Neuron.sig([2*1 + 2*3].reduce((a, b) => a+b));
  if (is !== Should) {
    throw "Activation of dict input with undefined Should be " + Should + ", was " + is;
  }
})();

(function() {
  var weights = {A: 2, B: 2, C: 2};
  var inputs = {A: 1, B: NaN, C: 3};
  var n = new Neuron(weights);
  var is = n.activate(inputs);
  var Should = Neuron.sig([2*1 + 2*3].reduce((a, b) => a+b));
  if (is !== Should) {
    throw "Activation of dict input with NaN Should be " + Should + ", was " + is;
  }
})();

(function() {
  var weights = {A: 2, B: 2, C: 2};
  var inputs = {A: 1, B: "B", C: 3};
  var n = new Neuron(weights);
  var is = n.activate(inputs);
  var Should = Neuron.sig([2*1 + 2*3].reduce((a, b) => a+b));
  if (is !== Should) {
    throw "Activation of dict input with String Should be " + Should + ", was " + is;
  }
})();

(function() {
  var weights = {A: 2, B: 2, C: 2};
  var inputs = {};
  var n = new Neuron(weights);
  var is = n.activate(inputs);
  var Should = Neuron.sig(0);
  if (is !== Should) {
    throw "Activation of dict input with String Should be " + Should + ", was " + is;
  }
})();

(function() {
  var n = new Neuron.random(2);
  var oldValues = n.weights.concat(n.intercept);
  n.mutate(_=>Neuron.rnorm(0, 0.1));
  var newValues = n.weights.concat(n.intercept);
  var differences = oldValues
      .map((o, i) => o !== newValues[i])
      .map((b) => b*1)
      .reduce((a, b) => a + b);

  if (differences !== 1) {
    throw "Threre must be one change in an Array mutation, had " + differences +
        ". Was: " + oldValues + " is now: " + newValues;
  }
})();

(function() {
  var keys = ["A", "B"];
  var n = new Neuron.random(keys);
  var oldValues = keys.map((key) => n.weights[key]).concat(n.intercept);
  n.mutate(Neuron.rnorm);
  var newValues = keys.map((key) => n.weights[key]).concat(n.intercept);
  var differences = oldValues
      .map((o, i) => o !== newValues[i])
      .map((b) => b*1)
      .reduce((a, b) => a + b);

  if (differences !== 1) {
    throw "Threre must be one change in a Dict Mutation, had " + differences +
        ". Was: " + oldValues + " is now: " + newValues;
  }
})();