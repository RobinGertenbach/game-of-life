function Entity(proto) {
  this.proto = proto;
  this.proto.mutability = {mutability: "Mutable", min: 0.1, max: 2};
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
  this.generateRepresentation();
  return this;
}

Entity.prototype.mutate = function() {
  if (runif(0, 2) < 0.1) { 
    var currentValue = this[featureName];
    var featureName = this.mutables[runif(0, this.mutables.length, true)];
    var proposedValue = currentValue + rnorm(0, this.mutability);
    if (this.proto[featureName].type === "discrete") {
      proposedValue = Math.round(proposedValue);
    }

    var featureValue = Math.min(
      Math.max(
        proposedValue, 
        this.proto[featureName].min), 
      this.proto[featureName].max);

    currentValue = featureValue;
  } else { // brain
    var layers = this.brain.layers;
    var layer = layers[runif(0, layers.length, true)];
    var neuron = layer[runif(0, layer.length, true)];
    neuron.mutate(this.mutability);
  }
  return this;
}

Entity.prototype.copy = function() {
  var entity = new Entity(this.proto);
  this.keys.map(key => entity[key] = this[key]);
  entity.energy = entity.proto.energy.start;
  return entity;
}


Entity.prototype.reproduce = function() {
  return this.copy().mutate();
}

Entity.prototype.evaluate = function(evaluator) {
  var result = evaluator(this);
  this.result = result;
  return result;
}

Entity.prototype.knn = function(pool, k) {
  var x = this.x;
  var y = this.y;
  var xys = pool.entities.map(e => ({x: e.x, y: e.y}));

  if (xys) {
    var knnI = xys
      .map((xy, i) => ({i: i, d: euclidean(x, y, xy.x, xy.y)}))
      .sort((d1, d2) => d1.d > d2.d ? 1 : d1.d < d2.d ? -1 : 0)
      .filter((d, i) => 0 < i && i <= k)
      .map(d => d.i);
    var output = pool.entities.filter((e, i) => knnI.indexOf(i) > -1);
  } else {
    var output = [];
  }
  // pad output

  return output;
}

Entity.prototype.knVeggies = function(board, k) {
  var x = this.x;
  var y = this.y;
  var xy = {x: x, y: y};
  var veggies = board.veggies;

  if (veggies) {
    var knVeggiesI = veggies
        .map((xy, i) => ({i: i, d: euclidean(x, y, xy.x, xy.y)}))
        .sort((d1, d2) => d1.d > d2.d ? 1 : d1.d < d2.d ? -1 : 0)
        .filter((d, i) => i <= k)
        .map(d => d.i);
    veggies = veggies.filter((e, i) => knVeggiesI.indexOf(i) > -1);
  } else {
    veggies = [];
  }
  
  while (veggies.length < k) {
    veggies.push({x: 99999, y: 99999});
  }

  return veggies;
}

Entity.prototype.knMeat = function(board, k) {
  var x = this.x;
  var y = this.y;
  var xy = {x: x, y: y};
  var meat = board.meat;

  if (meat) {
    var knMeatI = meat
        .map((xy, i) => ({i: i, d: euclidean(x, y, xy.x, xy.y)}))
        .sort((d1, d2) => d1.d > d2.d ? 1 : d1.d < d2.d ? -1 : 0)
        .filter((d, i) => i <= k)
        .map(d => d.i);
    meat = meat.filter((e, i) => knMeatI.indexOf(i) > -1);
  } else {
    meat = [];
  }
  
  while (meat.length < k) {
    meat.push({x: 99999, y: 99999});
  }
  return meat
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


function Cell(color) {
  this.color   = color;
  this.angle   = runif(0, 1);
  this.offset  = runif(0, 1);
  this.radians = Math.PI * 2 * this.angle;
  this.xOffset = Math.sin(this.radians) * this.offset;
  this.yOffset = Math.cos(this.radians) * this.offset;

  return this;
}






function Pool(size, proto) {
  this.size = size;
  this.proto = proto;

  function createEntityFromProto() {
    return new Entity(this.proto).randomize()
  }

  this.entities = Array.from(Array(size)).map(createEntityFromProto, this);
  return this;
}


Pool.prototype.evaluate = function(evaluator) {
  // Instead if an evaluation is per individual it can just say 
  // this.entities.forEach(entity => entity.evaluate(simpleEvaluator), this)
  evaluator(this);
}

Pool.prototype.sort = function(desc) {
  desc = desc || false;
  function comp(a, b) {
    if (a.energy > b.energy) return desc ? -1 : 1;
    if (a.energy < b.energy) return desc ? 1 : -1;
    return 0;
  }

  this.entities = this.entities.sort(comp);
}


Pool.prototype.cull = function(keep) {
  // Todo
  // Need gradient that kills
  // Some sigmoid with noise
  this.sort(keep === "high", "desc", "asc");
  this.entities = this.entities.filter((e, i) => i < Math.ceil(this.size) / 2);
}

Pool.prototype.reproduce = function () {
  this.entities.forEach(entity => this.entities.push(entity.reproduce()))
  return this;
}


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
  var required_specs = ["objective", "goal", "size", "proto"];

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
  this.pool.evaluate(this.objective);
  return this;
}

Experiment.prototype.sort = function() {
  this.pool.sort(this.goal === "high", "desc", "asc");
  return this;
}

Experiment.prototype.cull = function() {
  this.pool.cull(this.goal);
  return this;
}

Experiment.prototype.reproduce = function() {
  this.pool.reproduce();
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


function rnorm(mu, sd) {
  mu = mu || 0;
  sd = sd || 1;

  var u = Math.random();
  var v = Math.random();
  var r = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return r * sd + mu;
}

function runif(start, end, discrete) {
  start = start || 0;
  end = end || 1;
  discrete = discrete || false;
  var r = Math.random() * (end - start) + start;
  if (discrete) {
    return Math.floor(r);
  } 
  return r;
}


function sig(x) {
  return 1 / (1 + Math.pow(Math.E, -x));
} 

function sum(a, b) {
  return a+b;
}

function prod(a, b) {
  return a*b;
}

function euclidean(x1, y1, x2, y2) {
  return Math.sqrt(Math.abs(x1 - x2) + Math.abs(y1 - y2))
}


var proto = {
  x:       {mutability: "Immutable", min: 0, max: 100, type: "discrete"},
  y:       {mutability: "Immutable", min: 0, max: 100, type: "discrete"},
  energy:  {mutability: "Immutable", min: 0, max: 10000, type: "continuous", start: 200},
  blues:   {mutability: "Mutable", min: 1, max: 4, type: "discrete"}, // Movement
  reds:    {mutability: "Mutable", min: 1, max: 4, type: "discrete"}, // Attack
  greens:  {mutability: "Mutable", min: 1, max: 4, type: "discrete"}, // Defense
  yellows: {mutability: "Mutable", min: 1, max: 4, type: "discrete"}, // Eat Platns
  browns:  {mutability: "Mutable", min: 1, max: 4, type: "discrete"}, // Eat Enemies
  senses:  {mutability: "Immutable", names: [
    "x", "y", "energy", "blues", "reds", "greens", "yellows", "browns", 
    "closest:x", "closest:y", "closest:energy", "closest:blues", "closest:reds", "closest:greens", "closest:yellows", "closest:browns",
    "closest2:x", "closest2:y", "closest2:energy", "closest2:blues", "closest2:reds", "closest2:greens", "closest2:yellows", "closest2:browns",
    "closest3:x", "closest3:y", "closest3:energy", "closest3:blues", "closest3:reds", "closest3:greens", "closest3:yellows", "closest3:browns",
    "veggie:x", "veggie:y",
    "veggie2:x", "veggie2:y",
    "veggie4:x", "veggie3:y",
    "meat:x", "meat:y",
    "meat2:x", "meat2:y",
    "meat4:x", "meat3:y",]},
  actions: {mutability: "immutable", names: [
    "Up", "Down", "Left", "Right", "Attack", "Eat"]}
}





function Neuron(intercept, coeffs) {
  this.intercept = intercept;
  this.coeffs = coeffs;
  return this;    
}

Neuron.prototype.activate = function(inputs) {
  var logLikelihood = this.coeffs
      .map((coeff, i) => coeff * inputs[i])   
      .reduce(sum) 
      + this.intercept;

  return sig(logLikelihood);
}

Neuron.random = function(coeffCount) {
  var coeffs = Array.from(new Array(coeffCount));
  var coeffs = coeffs.map((_) => rnorm());
  var intercept = rnorm()
  return new Neuron(intercept, coeffs);
}

Neuron.prototype.mutate = function(mutability) {
  var coeffI = runif(0, this.coeffs.length + 1, true);
  var coeff = coeffI === 0 ? this.intercept : this.coeffs[coeffI-1];
  coeffI === 0 
  ? this.intercept += rnorm(0, mutability) 
  : this.coeffs[coeffI - 1] += rnorm(0, mutability);
}



function Brain(inputs, hidden, outputs) {
  this.inputs = inputs;
  this.outputs = outputs;

  var inputLayer  = Array.from(Array(hidden)).map(_ => new Neuron.random(this.inputs), this);
  var hidden1     = Array.from(Array(hidden)).map(_ => new Neuron.random(this.hidden), this);
  var hidden2     = Array.from(Array(hidden)).map(_ => new Neuron.random(this.hidden), this);
  var hidden3     = Array.from(Array(hidden)).map(_ => new Neuron.random(this.hidden), this);
  var outputLayer = outputs.map(_ => new Neuron.random(hidden), this);  

  this.layers = [inputLayer, hidden1, hidden2, hidden3, outputLayer];

  return this;
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
}


function Board(pool, width, height) {
  if (width * height < pool.entities.length) {
    throw "Board size too small";
  }
  this.pool = pool;
  this.height = height;
  this.width = width;
  return this;
}

Board.prototype.placeEntities = function() {
  var x, y;
  var xys = [];
  for (entityI = 0; entityI < this.pool.entities.length; entityI += 1) {
    var entity = this.pool.entities[entityI];
    do {
      x = runif(0, this.width, true);
      y = runif(0, this.height, true);
    } while (xys.filter(e => e.x === x && e.y === y).length)
    entity.x = x;
    entity.y = y;
    xys.push({x: x, y: y});
  }
  return this;
}

Board.prototype.placeVeggies = function(n) {
  var x, y, xy;
  var xys = this.pool.entities.map(e => ({x: e.x, y: e.y}));
  var veggies = [];
  for (var veggieI = 0; veggieI < n; veggieI += 1) {
    do {
      x = runif(0, this.width, true);
      y = runif(0, this.height, true);
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





function testEvaluator(that) {
  var entities = that.entities;
  var frames = 20;
  var boardWidth = 100
  var boardHeight = 100;
  var board = new Board(that, boardWidth, boardHeight);

  function sense(entity) {
    var senses = [];
    var knn = entity.knn(that, 3);
    var knv = entity.knVeggies(board, 3);
    var knm = entity.knMeat(board, 3);

    function getSenses(e) {
      var output = [];
      output.push(e.x);
      output.push(e.y);
      output.push(e.energy);
      output.push(e.blues);
      output.push(e.reds);
      output.push(e.greens);
      output.push(e.yellows);
      output.push(e.browns);
      return output;
    }

    var senses = getSenses(entity)
        .concat(knn.map(getSenses).reduce((x, y) => x.concat(y), []))
        .concat(knv.map(e => [e.x, e.y]).reduce((x, y) => x.concat(y), []))
        .concat(knm.map(e => [e.x, e.y]).reduce((x, y) => x.concat(y), []));
    return senses;
  }


  for (var frame = 0; frame < frames; frame += 1) {
    board.placeEntities();
    board.placeVeggies(5000);
    var entitySenses = entities.map(sense);
    var instructions = entities
        .map((e, i) => e.brain.activate(entitySenses[i]));
    
    // process attacks
    instructions
        .forEach(function (instruction, i) {if (instruction === "Attack") {
          var entity = entities[i];
          entities
              .filter(e => Math.abs(e.x - entity.x) <= 1 && Math.abs(e.y - entity.y) <= 1)
              .forEach(e => e.energy -= entity.reds * 10)
          entity.energy -= entity.reds * 5;
        }});

    // process movement
    instructions
        .forEach(function(instruction, i) {
          if (["Up", "Down", "Left", "Right"].indexOf(instruction) > -1
               && entities[i].energy > 0
               && entities[i].blues > 0) {
            var entity = entities[i];
            switch (instruction) {
              case "Up": 
                if (entity.y > 0) {entity.y -= 1;}
                break;
              case "Down":
                if (entity.y < boardHeight - 1) {entity.y += 1;}
                  break;
              case "Left":
                if (entity.x > 0) {entity.x -= 1;}
                break;
              case "Right":
                if (entity.x < boardWidth - 1) {entity.x += 1;}
                break;
              }
              entity.energy -= 10 / entity.blues
            }
        });
    // process eating
    for (var veggieI = 0; veggieI <= board.veggies.length; veggieI += 1) {
      var veggie = board.veggies[veggieI];
      if (!veggie) {break;}
      var neighbours = entities
          .filter(e => euclidean(this.x, this.y, e.x, e.y) <= Math.sqrt(2), veggie);
      var neighbourCount = neighbours.length;
      if (neighbourCount) {
        neighbours.forEach(function(e) {
          var totalYellows = neighbours.map(e => e.yellows).reduce(sum);
          if (e.yellows) {
            e.energy += 100 * e.yellows / totalYellows
          }
        });
        board.veggies.splice(veggieI, 1);
        veggieI -= 1;
      }
    }

    if (board.meat !== undefined) {
      for (var meatI = 0; meatI <= board.meat.length; meatI += 1) {
        var meat = board.meat[meatI];
        if (!meat) {break;}
        var neighbours = entities
            .filter(e => euclidean(meat.x, meat.y, e.x, e.y) <= Math.sqrt(2));
        var neighbourCount = neighbours.length;
        if (neighbourCount) {
          var totalBrowns = neighbours.map(e => e.browns).reduce(sum);
          neighbours.forEach(function(e) {
            if (e.browns) {
              e.energy += 500 * e.browns / totalBrowns
            }
          });
          board.meat.splice(meatI, 1);
          meatI -= 1;
        }
      }
    }
    
    // process standby (1 for each level)
    entities.forEach(e => e.energy -= e.blues + e.reds + e.greens + e.yellows + e.browns);

    // kill
    for (var i = 0; i < entities.length; i += 1) {
      if (entities[i].energy <= 0) {
        board.placeMeat(entities[i].x, entities[i].y);
        entities.splice(i, 1);
        i -= 1;
      }
    }
  }

  if (entities.length === 0) {
    throw "Everyone ded";
  }
  // reproduce
  that.sort(true);
  var newGeneration = that.entities.map(e => e.copy());
  var reproduceI = 0;
  while (newGeneration.length < that.size) {
    newGeneration.push(that.entities[reproduceI].mutate());
    reproduceI = reproduceI === entities.length - 1 ? 0 : reproduceI + 1; 
  }
  that.entities = newGeneration;
}


/**
todo:
copy -> adjust energy
copy -> mutate

 - adjust knn for missing
 - do graphics
 - add experiment to evaluator
 - add generationt racking to exp
 - do quantiles

*/
var exp = new Experiment({
  objective: testEvaluator,
  proto: proto,
  goal: "high",
  size: 100
});

exp.makePool();

/*for (var i = 0; i < 10; i++ ) {
  exp.evaluate();
}*/

//console.log(exp.pool.entities.map(e => e.energy))

// rmoeve and add on mutation
