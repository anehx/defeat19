function add(v1, v2) {
  return [v1[0] + v2[0], v1[1] + v2[1]];
}

function abs(v) {
  return Math.sqrt(v[0] ** 2 + v[1] ** 2);
}

function multiply(v, skalar) {
  return v.map((i) => i * skalar);
}

function distance(v1, v2) {
  return abs(add(v1, multiply(v2, -1)));
}

// linear scaling
function linear(x, x1 = 0, x2 = 1, y1 = 0, y2 = 1) {
  if (x <= x1) return y1;
  if (x >= x2) return y2;
  const m = (y2 - y1) / (x2 - x1);
  return m * x + y1 - m * x1;
}

module.exports = {
  add,
  abs,
  distance,
  multiply,
  linear,
};
