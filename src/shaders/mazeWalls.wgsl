const thickness = 0.1;
const halfThickness = thickness / 2.0;

fn top(x: u32, y: u32) -> array<vec2f, 6> {
  // x, y is the center of the square.
  // the top edge is 0.5 units above the center
  // the quad should be vertically centered about the top edge
  // and have a thickness of 0.01 units

  let topEdge = f32(y) + 0.5;
  let leftEdge = f32(x) - 0.5;
  let rightEdge = f32(x) + 0.5;

  return array<vec2f, 6>(
    vec2f(leftEdge - halfThickness, topEdge - halfThickness),
    vec2f(rightEdge + halfThickness, topEdge - halfThickness),
    vec2f(leftEdge - halfThickness, topEdge + halfThickness),
    vec2f(rightEdge + halfThickness, topEdge - halfThickness),
    vec2f(leftEdge - halfThickness, topEdge + halfThickness),
    vec2f(rightEdge + halfThickness, topEdge + halfThickness),
  );
};

fn bottom(x: u32, y: u32) -> array<vec2f, 6> {
  let bottomEdge = f32(y) - 0.5;
  let leftEdge = f32(x) - 0.5;
  let rightEdge = f32(x) + 0.5;

  return array<vec2f, 6>(
    vec2f(leftEdge - halfThickness, bottomEdge - halfThickness),
    vec2f(rightEdge + halfThickness, bottomEdge - halfThickness),
    vec2f(leftEdge - halfThickness, bottomEdge + halfThickness),
    vec2f(rightEdge + halfThickness, bottomEdge - halfThickness),
    vec2f(leftEdge - halfThickness, bottomEdge + halfThickness),
    vec2f(rightEdge + halfThickness, bottomEdge + halfThickness),
  );
};


fn left(x: u32, y: u32) -> array<vec2f, 6> {
  let leftEdge = f32(x) - 0.5;
  let topEdge = f32(y) + 0.5;
  let bottomEdge = f32(y) - 0.5;

  return array<vec2f, 6>(
    vec2f(leftEdge - halfThickness, topEdge + halfThickness),
    vec2f(leftEdge - halfThickness, bottomEdge - halfThickness),
    vec2f(leftEdge + halfThickness, topEdge + halfThickness),
    vec2f(leftEdge - halfThickness, bottomEdge - halfThickness),
    vec2f(leftEdge + halfThickness, topEdge + halfThickness),
    vec2f(leftEdge + halfThickness, bottomEdge - halfThickness),
  );
};

fn right(x: u32, y: u32) -> array<vec2f, 6> {
  let rightEdge = f32(x) + 0.5;
  let topEdge = f32(y) + 0.5;
  let bottomEdge = f32(y) - 0.5;

  return array<vec2f, 6>(
    vec2f(rightEdge - halfThickness, topEdge + halfThickness),
    vec2f(rightEdge - halfThickness, bottomEdge - halfThickness),
    vec2f(rightEdge + halfThickness, topEdge + halfThickness),
    vec2f(rightEdge - halfThickness, bottomEdge - halfThickness),
    vec2f(rightEdge + halfThickness, topEdge + halfThickness),
    vec2f(rightEdge + halfThickness, bottomEdge - halfThickness),
  );
};

fn empty() -> array<vec2f, 6> {
  return array<vec2f, 6>(
    vec2f(-2.0, -2.0),
    vec2f(-2.0, -2.0),
    vec2f(-2.0, -2.0),
    vec2f(-2.0, -2.0),
    vec2f(-2.0, -2.0),
    vec2f(-2.0, -2.0),
  );
}
