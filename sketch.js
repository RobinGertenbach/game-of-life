var exp;
var eval;
var generation = 1;
var log;
var fpsForm, fpsConfirm;
var ffwdButton;
var ffwd = true;


// Main menu buttons
var testButton;

// plotters
var survivorPlot, meanEnergyPlot, meanCellsPlot, attacksPlot, mutabilityPlot;



var proto = {
  x:       {mutability: "Immutable", min: 0, max: 100, type: "discrete"},
  y:       {mutability: "Immutable", min: 0, max: 100, type: "discrete"},
  energy:  {mutability: "Immutable", min: 0, max: 100000, type: "continuous", start: 500},
  blues:   {mutability: "Mutable", min: 1, max: 4, type: "discrete"}, // Movement
  reds:    {mutability: "Mutable", min: 1, max: 4, type: "discrete"}, // Attack
  greens:  {mutability: "Mutable", min: 1, max: 4, type: "discrete"}, // Defense
  yellows: {mutability: "Mutable", min: 1, max: 4, type: "discrete"}, // Eat Platns
  browns:  {mutability: "Mutable", min: 1, max: 4, type: "discrete"}, // Eat Enemies
  senses:  {mutability: "Immutable", names: [
    "x", "y", "energy", "blues",// "reds", "greens", "yellows", "browns",
    //"closest:x", "closest:y", "closest:energy", "closest:blues", "closest:reds", "closest:greens", "closest:yellows", "closest:browns",
    //"closest2:x", "closest2:y", "closest2:energy", "closest2:blues", "closest2:reds", "closest2:greens", "closest2:yellows", "closest2:browns",
    //"closest3:x", "closest3:y", "closest3:energy", "closest3:blues", "closest3:reds", "closest3:greens", "closest3:yellows", "closest3:browns",
    "veggie:x", "veggie:y",
    //"veggie2:x", "veggie2:y",
    //"veggie3:x", "veggie3:y",
    "meat:x", "meat:y",
    //"meat2:x", "meat2:y",
    //"meat3:x", "meat3:y",
  ]},
  actions: {mutability: "immutable", names: [
    "Up", "Down", "Left", "Right", "Attack", "Eat", "Wait"]}
}

var evaluationSettings = {
  frames: 100,
  width: 50,
  height: 50,
  veggieCount: 500,
  mutations: 2
}

function setup() {
  exp = new Experiment({
    proto: proto,
    evaluationSettings: evaluationSettings,
    goal: "high",
    size: 100
  });

  frameRate(999);
  exp.makePool();
  createCanvas(exp.evaluationSettings.width*20, exp.evaluationSettings.height*20);
  eval = new Evaluator(exp);
  log = new Log(exp, eval, [
    "generation",
    "survivors",
    "deaths",
    "attacks",
    "survivorEnergy",
    "meanEnergy",
    "meanBlues",
    "meanReds",
    "meanGreens",
    "meanYellows",
    "meanBrowns",
    "veggiesEaten",
    "meatEaten",
    "meanMutability",
    "moves"]);
  eval.newEvaluation(log);

  survivorPlot = new Plotter(
    log.generation,
    [log.survivors, log.deaths],
    {yMin: 0, yMax: exp.size, title: "Survivors and Deaths"});
  meanEnergyPlot = new Plotter(
    log.generation,
    [log.survivorEnergy, log.meanEnergy],
    {yMin: 0, title: "Energy"});
  meanCellsPlot = new Plotter(
    log.generation,
    [
      log.meanBlues,
      log.meanReds,
      log.meanGreens,
      log.meanYellows,
      log.meanBrowns
    ],
    {yMin: 1, yMax: 4, colors: ["Blue", "Red", "Green", "Yellow", "Brown"],
     title: "Mean Cell Counts"});
  attacksPlot = new Plotter(
    log.generation,
    [log.moves, log.attacks, log.veggiesEaten, log.meatEaten],
    {yMin: 0, colors: ["Blue", "Red", "Green", "Brown"], title: "Attacks and Eating"});
  mutabilityPlot = new Plotter(
    log.generation,
    log.meanMutability,
    {yMin:0, yMax:2, title: "Mutability"})

  fpsForm = createInput();
  fpsForm.position(0, 0);
  fpsConfirm = createButton("Set FPS");
  fpsConfirm.position(fpsForm.width + 10, 0);
  fpsConfirm.mousePressed(_ => frameRate(Number(fpsForm.value())));
  ffwdButton = createButton("Fast Forward").position(500,0);
  ffwdButton.mousePressed(_=> ffwd = !ffwd);
}

function draw() {
  background("#F6F6F6");
  if (!ffwd) {
    exp.draw(eval);
    if (eval.isDone) {
        eval.finalize();
        eval.newEvaluation(log);
        generation += 1;
        Plotter.update();
      } else {
        eval.next()
      }
  } else {
    while(!eval.isDone) {
      eval.next();
    }
    eval.finalize();
    eval.newEvaluation(log);
    generation += 1;
    Plotter.update();
  }
  text(generation, 900, 10)
  if (mouseY < 50) {
    fpsForm.show();
    fpsConfirm.show();
  } else if (mouseY > 950) {
    survivorPlot.line(0, 795, 1000, 200);
    meanEnergyPlot.line(0, 590, 1000, 200);
    meanCellsPlot.line(0, 385, 1000, 200);
    attacksPlot.line(0, 180, 498, 200);
    mutabilityPlot.line(502, 180, 500, 200)
  } else {
    fpsForm.hide()
    fpsConfirm.hide()
  }
}


function circle(x, y, radius) {
  var diameter = radius * 2;
  ellipse(x, y, diameter, diameter)
}

// add quantiles

// lo gmoves and move complexity

// check every step
// why is almost every action "wait"
