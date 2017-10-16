var roster = new Roster(100, 2);
var ffwdButton;
var ffwd = true;


function setup() {
  createCanvas(1000, 1000);
  roster.createBattle();
  ffwdButton = createButton("Fast Forward").position(500,0);
  ffwdButton.mousePressed(_=> ffwd = !ffwd);
}

function draw() {
  if (ffwd) {
    try {
      roster.quickgen();
    } catch(e) {}

  } else {
    roster.battle.draw();
    if (roster.battle.isDone) {
      if (roster.allBattlesDone()) {
        roster.learn();
        roster.reset();
      }
      roster.createBattle()
    }
    roster.battle.next();
  } 
  stroke("black")
  strokeWeight(1);
  text(roster.round,900, 10)
  console.log(roster.round)

  
}

/**

Body mutation

fast forward
reduce health on contact



*/