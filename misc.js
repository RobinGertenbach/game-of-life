function rnorm(mu, sd) {
  mu = mu || 0;
  sd = sd || 1;

  var u = Math.random();
  var v = Math.random();
  var r = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return r * sd + mu;
}

function runif(start, end, discrete) {
  start = start || 0;
  end = end || 1;
  discrete = discrete || false;
  if (discrete) {
    return Math.floor(Math.random() * (1 + end - start) + start);
  }
  return Math.random() * (end - start) + start;;
}

function sig(x) {
  return 1 / (1 + Math.pow(Math.E, -x));
}

function sum(a, b) {
  return a+b;
}

function prod(a, b) {
  return a*b;
}

function identity(a) {
  return a;
}

function inverse(a) {
  return 1/a;
}

function log(a) {
  return Math.log(a);
}

function abs(a) {
  return Math.abs(a);
}

function square(a) {
  return a*a;
}


function euclidean(x1, y1, x2, y2) {
  return Math.sqrt(Math.abs(x1 - x2) + Math.abs(y1 - y2))
}

function sleep(sleepDuration) {
  var now = new Date().getTime();
  while(new Date().getTime() < now + sleepDuration){ /* do nothing */ }
}

function pad(array, length, value) {
  array.length = length;
  for (var i = 0; i<array.length; i++) {
    array[i] = array[i] || value
  }
  return array
}

function safeAdd(log, field, value) {
  if (log[field] === undefined) {
    log[field] = 0;
  }
  log[field] += value;
}
