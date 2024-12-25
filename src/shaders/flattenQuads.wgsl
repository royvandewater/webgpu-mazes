
fn flattenQuads(quads: array<array<vec2f, 6>, 4>) -> array<f32, 48> {
  var flattened: array<f32, 48> = array<f32, 48>();

  for (var i: i32 = 0; i < 4; i++) {
    for (var j: i32 = 0; j < 6; j += 1) {
      flattened[(i * 12) + (j * 2)] = quads[i][j].x;
      flattened[(i * 12) + (j * 2) + 1] = quads[i][j].y;
    }
  }
  return flattened;
}
