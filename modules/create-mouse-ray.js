module.exports = createMouseRay;

var mat4multiply = require('gl-mat4/multiply')
var mat4invert = require('gl-mat4/invert')
var pick = require('camera-picking-ray');

var mouse = [0, 0];
var viewport = [0, 0, 0, 0]
var m4scratch = new Array(16);

function createMouseRay(event, width, height, projection, view) {
  var ray = {
    origin: [0, 0, 0],
    direction: [0, 0, 0]
  };

  mouse[0] = event.x;
  mouse[1] = event.y;
  viewport[2] = width;
  viewport[3] = height

  var projView = mat4multiply(m4scratch, projection, view);
  var invProjView = mat4invert(projView, projView);

  pick(ray.origin, ray.direction, mouse, viewport, invProjView);

  return ray;
}
