var v3dot = require('gl-vec3/dot');
var v3sub = require('gl-vec3/subtract');
var v3add = require('gl-vec3/add');
var v3scale = require('gl-vec3/scale');

module.exports = rayCapsule

var w0 = [0, 0, 0]
var segDir = [0, 0, 0]
var wc = [0, 0, 0]
var tmp = [0, 0, 0]

function rayCapsule(ro, rd, segA, segB, radius) {
  var rsquared = radius * radius;

  // compute intermediate parameters
  v3sub(w0, segA, ro);
  v3sub(segDir, segA, segB);
  var a = v3dot(segDir, segDir);
  var b = v3dot(segDir, rd);
  var c = v3dot(rd, rd);
  var d = v3dot(segDir, w0);
  var e = v3dot(rd, w0)

  var denom = a * c - b * b;
  var sn = 0.0;
  var sd = c;
  var tn = e;
  var td = c;

  if (denom !== 0) {
    // clamp s_c within [0,1]
    sd = td = denom;
    sn = b * e - c * d;
    tn = a * e - b * d;

    // clamp s_c to 0
    if (sn < 0.0) {
      sn = 0.0;
      tn = e;
      td = c;

    // clamp s_c to 1
    } else if (sn > sd) {
      sn = sd;
      tn = e + b;
      td = c;
    }
  }

  // clamp t_c within [0,+inf]
  // clamp t_c to 0
  if (tn < 0.0) {
    t_c = 0.0;
    // clamp s_c to 0
    if ( -d < 0.0 ) {
      s_c = 0.0;

    // clamp s_c to 1
    } else if ( -d > a ) {
      s_c = 1.0;

    } else {
      s_c = -d / a;
    }
  } else {
    t_c = tn / td;
    s_c = sn / sd;
  }

  // compute difference vector and distance squared
  v3add(wc, w0, v3sub(tmp, v3scale(segDir, segDir, s_c), v3scale(tmp, rd, t_c)));
  var res = v3dot(wc, wc);

console.log('res', res)

  if (rsquared > res) {
    return [t_c, s_c]

  } else if (rsquared === res) {
    console.log('same', t_c, s_c)
  }
  return false;
}


if (require.main === module) {
  rayCapsule(
    [0, 100, 0],
    [1, 0, 0],
    [10, 5, 0],
    [10, -5, 0],
    5
  )

  rayCapsule(
    [0, 100, 0],
    [1, 0, 0],
    [10, 5, 0],
    [10, -5, 0],
    5
  )

  rayCapsule(
    [0, 0, -4],
    [1, 0, 0],
    [10, 5, 0],
    [10, -5, 0],
    5
  )

  console.log('here')
}
