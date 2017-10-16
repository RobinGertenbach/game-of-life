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
  if (this.isDone 
      || this.time === this.totalTime
      || this.robots.map(r => r.health > 0).reduce((a,b) => a+b) <= 1) {
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
  this.robots.forEach(r => r.isAttacking = false);
  var thoughts = this.robots.map(r => r.think(this), this);
  this.processVelocities(thoughts);
  this.processMovement(thoughts);
  this.processAttacks(thoughts);
  return this;
}


Battle.prototype.processVelocities = function(thoughts) {
  function addVelocity(current, plus, torque, weight) {
    var adjustedPlus = plus * torque / Math.sqrt(weight);
    return Math.min(1, Math.max(adjustedPlus, -1));
  }

  var currentVels = this.robots.map(r => ({xVel: r.xVel, yVel: r.yVel}));
  var targetVels = this.robots.map((r, i) => ({
    xVel: addVelocity(r.xVel, thoughts[i][0]*2-1, r.torque, r.totalWeight()),
    yVel: addVelocity(r.yVel, thoughts[i][1]*2-1, r.torque, r.totalWeight())}),
    this);

  this.robots.forEach((r, i) => {
    if (r.energy > 0) {
      r.xVel = r.xVel + targetVels[i].xVel;
      r.yVel = r.yVel + targetVels[i].yVel;
      r.energy -= r.totalWeight() / 200;
    }
  }, this);
  this.robots.forEach((r, i) =>
    r.rotation += 1/10 * Math.PI * (thoughts[i][2]-0.5)
  );
  return this;
}

Battle.prototype.processMovement = function(thoughts) {
  var robots = this.robots;
  var targetOffsets = robots.map(r => ({
    x: r.xVel * r.speed * (r.health > 0),
    y: r.yVel * r.speed * (r.health > 0)}));
  var targetXYs = robots.map((r, i) => ({
    x: r.x + targetOffsets[i].x,
    y: r.y + targetOffsets[i].y
  }));

  // movement
  robots.forEach((r, i) => {
    r.x = targetXYs[i].x;
    r.y = targetXYs[i].y
  });

  // collision detection affects velocity, charge damage
  var elasticity = 0.8;
  for (var r1i = 0; r1i < robots.length - 1; r1i += 1) {
    for (var r2i = r1i + 1; r2i < robots.length; r2i += 1) {
      var r1 = robots[r1i];
      var r2 = robots[r2i];      
      if (r1.collidesWith(r2)) {
        //todo: elasticity and refelction
        if(r1.totalWeight() < r2.totalWeight()) {
          r1.xVel = 0;
          r1.yVel = 0;
        } else {
          r2.xVel = 0;
          r2.yVel = 0;
        }
      }
    }
  }


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
  var robots = this.robots;
  var circles = robots.map(r => new Collision.Circle(r.x, r.y, r.radius()));

  function processAttack(robot, i, robots) {
    if (thoughts[i][3] < 0.5) {return;}
    robot.isAttacking = true;

    function processAttackTo(r2, j) {
      if (i === j) {return;}
      var closestPointToR2 = Collision
          .closestPoint(circles[j], circles[i].points());

      // find closest point of c2 to closest point of c1
      var closestDistance = Collision
          .closestDistance(closestPointToR2, circles[j].points());
      
      // double distance, quarter damage
      r2.health -= 10 / (closestDistance * closestDistance * r2.shield)
    }

    robots.forEach(processAttackTo);
  }

  robots.forEach(processAttack);
  return this;
}

Battle.prototype.draw = function() {
  this.drawBoard();
  this.robots.forEach(r => r.draw());
}

Battle.prototype.resetRobots = function() {
  function resetRobot(robot) {
    robot.health = 100;
    robot.energy = 100;
    robot.isAttacking = false;
  }
  return this.robots.forEach(resetRobot);
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