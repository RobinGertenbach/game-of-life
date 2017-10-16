function Robot(options) {
  this.str = options.str
  this.speed = Math.sin(Math.PI * this.str);
  this.torque = Math.cos(Math.PI * this.str);
  this.weaponAngle = options.weaponAngle;
  this.weaponDamage = options.weaponDamage;
  this.shield = options.shield
  this.extraWeight = options.extraWeight;
  this.brain = options.brain;
  return this;
}

Robot.random = function() {
  var str = Math.random() / 2;
  var extraWeight = Math.random() * 10;
  var shield = Math.random() * 10;
  var weaponAngle = Math.random() * 2 * Math.PI;
  var weaponDamage = Math.random() * 10;

  var brain = new Brain.random([
    "x", "y", "health", "rotation", "shield", "angle", "damage", "speed", "torque",
    "enemyHealth", "enemyX", "enemyY", "enemyRotation",
    "enemyShield", "enemyAngle", "enemyDamage",
    "enemySpeed", "enemyTorque", "enemyAction"],
    [10, 10, 4]);

  return new Robot({
    str: str,
    extraWeight: extraWeight,
    shield: shield,
    weaponDamage: weaponDamage,
    weaponAngle: weaponAngle,
    brain: brain});
}

Robot.prototype.totalWeight = function() {
  return 5 + this.extraWeight + this.shield + this.weaponAngle * this.weaponDamage;
}

Robot.prototype.maxSpeed = function() {
  this.speed * 500 / this.totalWeight;
}

Robot.prototype.radius = function() {
  return Math.sqrt(this.totalWeight() / Math.PI) * 10
}

Robot.prototype.draw = function() {
  var size = this.radius() * 2;

  stroke(0);
  strokeWeight(0);
  fill(this.torque * 256, this.speed * 25.6, this.shield * 25.6);
  ellipse(this.x, this.y, size, size);
  stroke(this.weaponDamage * 25.6, 255 * this.isAttacking, 0);

  strokeWeight(4);
  var arcStart = this.rotation - this.weaponAngle / 2;
  var arcEnd = this.rotation + this.weaponAngle / 2;
  arc(this.x, this.y, size, size,  arcStart, arcEnd);
  return this;
}

Robot.prototype.think = function(battle) {
  var r1 = this;
  var r2 = r1 === battle.robots[0] ? battle.robots[1] : battle.robots[0];

  return this.brain.activate({
    x: r1.x,
    y: r1.y,
    health: r1.health,
    rotation: r1.rotation,
    shield: r1.shield,
    angle: r1.weaponAngle,
    damage: r1.weaponDamage,
    speed: r1.speed,
    torque: r1.torque,

    enemyX: r2.x,
    enemyY: r2.y,
    enemyHealth: r2.health,
    enemyRotation: r2.rotation,
    enemyShield: r2.shield,
    enemyAngle: r2.weaponAngle,
    enemyDamage: r2.weaponDamage,
    enemySpeed: r2.speed,
    enemyTorque: r2.torque
  });
}

Robot.prototype.collidesWith = function(r2) {
  var r1 = this;
  var c1 = new Collision.Circle(r1.x, r1.y, r1.radius());
  var c2 = new Collision.Circle(r2.x, r2.y, r2.radius());
  return c1.collidesWithCircle(c2);
}


Robot.prototype.mutate = function() {
  var which = Math.random() <= 2 ? "Brain" : "Body"; // to cange to 0.5
  if (which === "Brain") {
    this.brain.mutate();
  } else {
    this.mutateBody();
  }
  return this;
}

Robot.prototype.mutateBody = function() {
}