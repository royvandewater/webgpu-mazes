// @include "./mazeWalls.wgsl"
// @include "./flattenQuads.wgsl"

@group(0) @binding(0) var<storage, read_write> data: array<f32>;

@compute @workgroup_size(1) fn generate(
  @builtin(global_invocation_id) id: vec3u
) {
  let i = id.x;

  let values = getValues(i);

  for (var j: i32 = 0; j < 48; j++) {
    data[i32(i) * 48 + j] = values[j];
  }
}


fn getValues(i: u32) -> array<f32, 48> {
  switch (i) {
    case 0: {
      return if0();
    }
    case 1: {
      return if1();
    }
    case 2: {
      return if2();
    }
    case 3: {
      return if3();
    }
    case 4: {
      return if4();
    }
    case 5: {
      return if5();
    }
    case 6: {
      return if6();
    }
    case 7: {
      return if7();
    }
    case 8: {
      return if8();
    }
    default: {
      return array<f32, 48>();
    }
  }
}

// we are the 0'th cell, we need to return 48 coordinates (2 coordinates per vertex, 6 vertices per quad, 4 quads per cell)
// If any of the quads should not be drawn, we need to return -2.0 for each of the coordinates in those quads
// if0 needs to return The top left cell, so top, bottom, and left walls
fn if0() -> array<f32, 48> {
  return flattenQuads(array<array<vec2f, 6>, 4>(
    top(0.0, 2.0),
    bottom(0.0, 2.0),
    left(0.0, 2.0),
    empty(),
  ));
}

// if1 needs to return the top middle cell, so only top
fn if1() -> array<f32, 48> {
  return flattenQuads(array<array<vec2f, 6>, 4>(
    top(1.0, 2.0),
    empty(),
    empty(),
    empty(),
  ));
}

// if2 needs to return the top right cell, so top and right
fn if2() -> array<f32, 48> {
  return flattenQuads(array<array<vec2f, 6>, 4>(
    top(2.0, 2.0),
    right(2.0, 2.0),
    empty(),
    empty(),
  ));
}

// if3 needs to return the middle left cell, so top and left
fn if3() -> array<f32, 48> {
  return flattenQuads(array<array<vec2f, 6>, 4>(
    top(0.0, 1.0),
    left(0.0, 1.0),
    empty(),
    empty(),
  ));
}

// if4 needs to return the middle middle cell, so right and bottom
fn if4() -> array<f32, 48> {
  return flattenQuads(array<array<vec2f, 6>, 4>(
    bottom(1.0, 1.0),
    right(1.0, 1.0),
    empty(),
    empty(),
  ));
}

// if5 needs to return the middle right cell, so left and right
fn if5() -> array<f32, 48> {
  return flattenQuads(array<array<vec2f, 6>, 4>(
    left(2.0, 1.0),
    right(2.0, 1.0),
    empty(),
    empty(),
  ));
}

// if6 needs to return the bottom left cell, so bottom, left, and right
fn if6() -> array<f32, 48> {
  return flattenQuads(array<array<vec2f, 6>, 4>(
    bottom(0.0, 0.0),
    left(0.0, 0.0),
    right(0.0, 0.0),
    empty(),
  ));
}

// if7 needs to return the bottom middle cell, so bottom, left, and top
fn if7() -> array<f32, 48> {
  return flattenQuads(array<array<vec2f, 6>, 4>(
    bottom(1.0, 0.0),
    left(1.0, 0.0),
    top(1.0, 0.0),
    empty(),
  ));
}

// if8 needs to return the bottom right cell, so bottom and right
fn if8() -> array<f32, 48> {
  return flattenQuads(array<array<vec2f, 6>, 4>(
    bottom(2.0, 0.0),
    right(2.0, 0.0),
    empty(),
    empty(),
  ));
}
