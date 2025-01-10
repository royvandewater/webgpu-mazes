
fn flatten4Quads(quads: array<array<vec2f, 6>, 4>) -> array<f32, 48> {
  var flattened: array<f32, 48> = array<f32, 48>();

  for (var i: i32 = 0; i < 4; i++) {
    for (var j: i32 = 0; j < 6; j += 1) {
      flattened[(i * 12) + (j * 2)] = quads[i][j].x;
      flattened[(i * 12) + (j * 2) + 1] = quads[i][j].y;
    }
  }

  return flattened;
}

fn flatten2Quads(quads: array<array<vec2f, 6>, 2>) -> array<f32, 24> {
  var flattened: array<f32, 24> = array<f32, 24>();

  for (var i: i32 = 0; i < 2; i++) {
    for (var j: i32 = 0; j < 6; j += 1) {
      flattened[(i * 12) + (j * 2)] = quads[i][j].x;
      flattened[(i * 12) + (j * 2) + 1] = quads[i][j].y;
    }
  }

  return flattened;
}

fn flattenQuad(quad: array<vec2f, 6>) -> array<f32, 12> {
  var flattened: array<f32, 12> = array<f32, 12>();

  for (var i: i32 = 0; i < 6; i++) {
    flattened[(i * 2)] = quad[i].x;
    flattened[(i * 2) + 1] = quad[i].y;
  }

  return flattened;
}
