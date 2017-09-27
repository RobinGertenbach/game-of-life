function Battle(robots) {
  this.robots = robots;
  this.resetRobots();
  this.resetPositions();

  this.time = 0;
  this.isDone = false;
  this.totalTime = 1000;

  return this;
}

Battle.prototype.next = function() {
  if (this.isDone || this.time === this.totalTime) {
    this.isDone = true;
    return this;
  }
  this.moment();
  return this;
}

Battle.prototype.finish = function() {
  while (!this.isDone) {
    this.next();
  }
  return this;
}

Battle.prototype.moment = function() {
  var thoughts = this.robots.map(r => r.think(this), this);
  this.processVelocities(thoughts);
  this.processMovement();

  // process actions
  return this;
}


Battle.prototype.processVelocities = function(thoughts) {
  function addVelocity(current, plus, torque, weight) {
    var adjustedPlus = plus * torque / weight;
    return Math.min(1, Math.max(adjustedPlus, -1));
  }

  var currentVels = this.robots.map(r => ({xVel: r.xVel, yVel: r.yVel}));
  var targetVels = this.robots.map((r, i) => ({
    xVel: addVelocity(r.xVel, thoughts[i][0]*2-1, r.torque, r.totalWeight()),
    yVel: addVelocity(r.yVel, thoughts[i][1]*2-1, r.torque, r.totalWeight())}),
    this);

  this.robots.forEach((r, i) => {
    r.xVel = targetVels[i].xVel;
    r.yVel = targetVels[i].yVel
  }, this);
  this.robots.forEach((r, i) =>
    r.rotation += 1/10 * Math.PI * (thoughts[i][2]-0.5)
  );
  return this;
  // energby
}

Battle.prototype.processMovement = function(thoughts) {
  var robots = this.robots;
  var targetOffsets = robots.map(r => ({
    x: r.xVel * r.speed * 10,
    y: r.yVel * r.speed * 50}));
  var targetXYs = robots.map((r, i) => ({
    x: r.x + targetOffsets[i].x,
    y: r.y + targetOffsets[i].y
  }));

  // collision detection affects velocity, charge damage


  // movement
  robots.forEach((r, i) => {
    r.x = targetXYs[i].x;
    r.y = targetXYs[i].y
  });

  //border collision
  robots.forEach((r, i) => {
    if (targetXYs[i].x - r.radius() < 0) {
      r.x = 0 + r.radius();
      r.xVel = 0;
    }
    if (targetXYs[i].x + r.radius() > 1000) {
      r.x = 1000 - r.radius();
      r.xVel = 0;
    }
    if (targetXYs[i].y - r.radius() < 0) {
      r.y = 0 + r.radius();
      r.yVel = 0;
    }
    if (targetXYs[i].y + r.radius() > 1000) {
      r.y = 1000 - r.radius();
      r.yVel = 0;
    }
  })

  // red zone damage
  robots.forEach(r => {
    var rad = r.radius();
      if (r.x - rad <= 50
          || r.x + rad >= 950
          || r.y - rad <= 50
          || r.y + rad >= 950) {
      r.health -= 1;
    }
  })

  return this;
}

Battle.prototype.processAttacks = function(thoughts) {
  // Attackss: yes/no
}




Battle.prototype.draw = function() {
  this.drawBoard();
  this.robots.forEach(r => r.draw());
}

Battle.prototype.resetRobots = function() {
  function resetRobot(robot) {
    robot.health = 100;
    robot.energy = 100;
  }
  return this;
}

Battle.prototype.resetPositions = function() {
  var n = this.robots.length;
  function positionRobot(robot, i) {
    var radian = Math.PI * 2 * i / n;
    var xOffset = Math.sin(radian);
    var yOffset = Math.cos(radian);
    robot.x = 500 + 250 * xOffset;
    robot.y = 500 + 250 * yOffset;

    robot.rotation = -radian - Math.PI / 2;
    robot.yVel = 0;
    robot.xVel = 0;
    return robot;
  }
  this.robots.forEach(positionRobot);
  return this;
}


Battle.prototype.drawBoard = function() {
  background("#E6E6E6");
  strokeWeight(0)
  fill(240,10,26)
  rect(0, 0, 50, 1000);
  rect(0, 0, 1000, 50);
  rect(950, 0, 50, 1000);
  rect(0, 950, 1000, 50);

  stroke("white");
  strokeWeight(2);
  for (var i = 100; i <1000; i += 100) {
    line(i, 0, i, 1000);
    line(0, i, 1000, i);
  }
  return this;
}


Battle.collision = function(x, y) {

}