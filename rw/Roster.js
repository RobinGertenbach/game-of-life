/**
 * Handles robot creation, culling, battle order, sesnes
 *
 */
function Roster(size, battleSize) {
  this.size = size;
  this.battleSize = battleSize;
  this.robots = Array.from(Array(size)).map(_ => new Robot.random());

}

