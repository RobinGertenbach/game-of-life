function Pool(size, proto) {
  this.size = size;
  this.proto = proto;

  function createEntityFromProto() {
    return new Entity(this.proto).randomize()
  }

  this.entities = Array.from(Array(size)).map(createEntityFromProto, this);
  return this;
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