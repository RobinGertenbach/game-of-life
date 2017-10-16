/**
 * Handles robot creation, culling, battle order, sesnes
 *
 */
function Roster(size, battleSize) {
  this.size = size;
  this.battleSize = battleSize;
  this.round = 1;
  this.robots = Array.from(Array(size)).map(_ => new Robot.random());
  this.matchScores = this.robots.map((_, i) => ({
    index: i, fought: false, score: undefined, robot: this.robots[i]}));
  return this;
}

Roster.prototype.createBattle = function() {
	var unfought = this.matchScores.filter(s => !s.fought);
	if (unfought.length < this.battleSize) {return false}
	var robotsToBattle = unfought
      .filter((u, i) => i < this.battleSize)
      .map(u => u.robot);
	var battle = new Battle(robotsToBattle);
	robotsToBattle
    .forEach(r => this.matchScores
        .filter(ms => ms.robot === r)
        .forEach(ms => ms.fought = true),
      this);
  this.battle = battle;
  return battle;
}

Roster.prototype.finishBattles = function() {
  this.battle.finish();
  while (!this.allBattlesDone()) {
    this.createBattle().finish();
  }
}


Roster.prototype.learn = function() {
  var scores = this.robots.map(r => r.health);
  this.robots.sort((a,b) => 
    a.health > b.health ? 1 : 
    a.health < b.health ? -1 : 
    0);
  this.robots
      .filter((_, i) => i < this.battleSize / 2, this)
      .forEach(r => r.mutate()) 
}


Roster.prototype.allBattlesDone = function() {
  var processes = this.matchScores.map(ms => ms.fought);
  return processes.map(p => !p * 1).reduce((a,b)=>a+b) < this.battleSize;
}

Roster.prototype.reset = function() {
  this.shuffle();
  this.round += 1;
  this.matchScores = this.robots.map((_, i) => ({
    index: i, fought: false, score: undefined, robot: this.robots[i]}));
  return this;
}

Roster.prototype.shuffle = function() {
  var rands = this.robots.map(_ => Math.random());
  this.robots = this.robots
      .map((r, i) => ({r:r, i:i}))
      .sort((a, b) => 
        rands[a.i] > rands[b.i] ? 1 : 
        rands[a.i] < rands[b.i] ? -1 : 
        0)
      .map(x => x.r);

  return this;
}

Roster.prototype.quickgen = function() {
  this.finishBattles();
  this.learn();
  this.reset();
}