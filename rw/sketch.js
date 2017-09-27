var roster = new Roster(2, 2)
var battle = new Battle([roster.robots[0], roster.robots[1]]);


function setup() {
  createCanvas(1000, 1000);
  battle.next();
}

function draw() {
  battle.draw();
  battle.next();
}

/**
process actions
make array fo entities
handle thinking and brains
-> do brain generation in roster
reproduce
deazone to incentivize pushing
velocity - accelleration, decelleration
*/