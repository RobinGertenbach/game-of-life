function Evaluator(experiment) {
  this.frames = experiment.evaluationSettings.frames || 20;
  this.width  = experiment.evaluationSettings.width  || 100;
  this.height = experiment.evaluationSettings.height || 100;
  this.experiment = experiment;
  this.mutations = experiment.mutations || 1;
  this.generation = 0;
  this.isSetUp = false;
  this.isRunning = false;
  this.isDone = false;
  return this;
}

Evaluator.prototype.newEvaluation = function(log) {
  var experiment = this.experiment;
  experiment.resetEntities().reproduce(experiment.mutations);
  this.board = new Board(experiment, this.width, this.height);
  this.board.placeEntities();
  this.board.placeVeggies(experiment.evaluationSettings.veggieCount);
  this.log = log;
  this.tolog = {};
  this.generation = this.generation += 1;
  this.isSetUp = true;
  this.isDone = false;
  this.nextStep = 0;

  var entities = experiment.pool.entities;
  function meanOf(field) {
    var values = entities.map(e => e[field]);
    try {return values.reduce(sum) / values.length;} catch(e) {return 0}
  }
  log.log("meanBlues", meanOf("blues"));
  log.log("meanReds", meanOf("reds"));
  log.log("meanGreens", meanOf("greens"));
  log.log("meanYellows", meanOf("yellows"));
  log.log("meanBrowns", meanOf("browns"));
  log.log("meanMutability", meanOf("mutability"))
  return this;
}

Evaluator.prototype.next = function() {
  var entities = this.experiment.pool.entities;
  if (this.isDone || entities.length === 0) {
    this.isDone = true;
    return this;
  }
  this.isRunning = true;
  this.nextStep += 1;
  if (this.nextStep === this.experiment.evaluationSettings.frames) {
    this.isDone = true;
  }

  var senses = entities.map(this.sense, this);
  var instructions = entities.map((e, i) => e.brain.activate(senses[i]));
  this.processInstructions(instructions);
  return this;
}

Evaluator.prototype.sense = function(entity) {
  var senses = [];

  var nn = 1;
  var knn = entity.knn(this.experiment.pool.entities, nn);
  var knv = entity.knn(this.board.veggies, nn) || [];
  var knm = entity.knn(this.board.meat, nn) || [];

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

  var union = (x, y) => x.concat(y);

  var entSenses = getSenses(entity);
  //var knnSenses = pad(knn.map(getSenses).reduce(union, []), nn * 8, 99999);
  var knvSenses = pad(knv.map(e => [e.x, e.y]).reduce(union, []), nn*2, undefined);
  var knmSenses = pad(knm.map(e => [e.x, e.y]).reduce(union, []), nn*2, undefined);
  var senses = entSenses
      //.concat(knnSenses)
      .concat(knvSenses)
      .concat(knmSenses);

  return senses;
}


Evaluator.prototype.processInstructions = function(instructions) {
  var entities = this.experiment.pool.entities;
  function getIndicesFor(type) {
    return instructions
        .map((instruction, i) => ({i: i, instruction: instruction}))
        .filter(i => i.instruction === type)
        .map(i => i.i);
  }
  this.processAttacks(getIndicesFor("Attack"));
  this.processMoves(instructions);
  this.processEating(getIndicesFor("Eat"), instructions);
  this.processStandby();
  this.cull();
  if (entities.length === 0) {
    console.log("Everyone died")
  }

  return this;
}


Evaluator.prototype.processAttacks = function(entityIs) {
  var entities = this.experiment.pool.entities;

  function processAttack(entityI) {
    safeAdd(this.tolog, "attacks", 1);
    var entity = entities[entityI];
    entities
        .filter(function(e) {return euclidean(this.x, this.y, e.x, e.y) <= 1}, entity)
        .forEach(e => e.energy -= entity.reds * 10 / e.greens)
    entity.energy -= entity.reds * 2;
  }

  if (entityIs) entityIs.forEach(processAttack, this);
  return this;
}

Evaluator.prototype.processMoves = function(instructions) {
  var entities = this.experiment.pool.entities;
  if (entities.length === 0 || !instructions || instructions.length === 0) {return;}
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
              if (entity.y < this.height - 1) {entity.y += 1;}
                break;
            case "Left":
              if (entity.x > 0) {entity.x -= 1;}
              break;
            case "Right":
              if (entity.x < this.width - 1) {entity.x += 1;}
              break;
            }
            entity.energy -= 10 / entity.blues
            safeAdd(this.tolog, "moves", 1);
          }
      }, this);
  return this;
}

Evaluator.prototype.processEating = function(entityIs, instructions) {
  if (!entityIs) {return this;}
  var entities = this.experiment.pool.entities;
  var board = this.board;
  for (var veggieI = 0; veggieI <= board.veggies.length; veggieI += 1) {
    var veggie = board.veggies[veggieI];
    if (!veggie) {break;}
    var neighbours = entities
        .filter(function(e) {return euclidean(this.x, this.y, e.x, e.y) <= 1}, veggie);
    var neighbourCount = neighbours.length;
    if (neighbourCount) {
      var isEaten = false;
      neighbours.forEach(function(e, i) {
        var totalYellows = neighbours.map(e => e.yellows).reduce(sum);
        if (e.yellows && instructions[i] === "Eat") {
          isEaten = true;
          e.energy += 100 * e.yellows / totalYellows
        }
      });
      if (isEaten) {
        board.veggies.splice(veggieI, 1);
        veggieI -= 1;
        safeAdd(this.tolog, "veggiesEaten", 1);
      }
    }
  }

  if (board.meat !== undefined) {
    for (var meatI = 0; meatI <= board.meat.length; meatI += 1) {
      var meat = board.meat[meatI];
      if (!meat) {break;}
      var neighbours = entities
          .filter(function(e) {return euclidean(this.x, this.y, e.x, e.y) <= 1}, meat);
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
        safeAdd(this.tolog, "meatEaten", 1);
      }
    }
  }
  return this;
}

Evaluator.prototype.processStandby = function() {
  var entities = this.experiment.pool.entities;
  if (entities.length > 0) {
    this.experiment.pool.entities.forEach(e => e.energy -= e.blues + e.reds + e.greens + e.yellows + e.browns);
  }
  return this;
}


Evaluator.prototype.cull = function() {
  this.experiment.cull(this.board);
  return this;
}

Evaluator.prototype.finalize = function() {
  function meanOf(field) {
    var values = entities.map(e => e[field]);
    try {return values.reduce(sum) / values.length;} catch(e) {return 0}
  }

  var entities = this.experiment.pool.entities;
  var log = this.log;
  var tolog = this.tolog
  log.log("generation", this.generation);
  log.log("survivors", entities.length);
  log.log("deaths", this.experiment.size - entities.length)
  log.log("attacks", (tolog["attacks"] || 0));
  log.log("survivorEnergy", meanOf("energy"));
  log.log("meanEnergy", meanOf("energy") * (entities.length / this.experiment.size));
  log.log("meatEaten", (tolog["meatEaten"] || 0));
  log.log("veggiesEaten", (tolog["veggiesEaten"] || 0));
  log.log("moves", tolog["moves"] || 0)
  return this;
}