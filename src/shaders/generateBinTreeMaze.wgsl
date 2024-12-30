// @include "./mazeWalls.wgsl"
// @include "./flattenQuads.wgsl"

@group(0) @binding(0) var<storage, read_write> data: array<f32>;
@group(0) @binding(1) var<uniform> dimensions: vec2u;

@compute @workgroup_size(1) fn generate(
  @builtin(global_invocation_id) id: vec3u
) {
  let i = id.x + (id.y * dimensions.x);
  let seed = f32(i) * data[i];

  let values = generateCell(id.x, id.y, seed);

  for (var j: u32 = 0; j < 48; j++) {
    data[i * 48 + j] = values[j];
  }
}

fn cellIndexToPosition(cellIndex: u32) -> vec2u {
  return vec2u(cellIndex % dimensions.x, cellIndex / dimensions.x);
}

fn generateCell(x: u32, y: u32, seed: f32) -> array<f32, 48> {
  return flattenQuads(array<array<vec2f, 6>, 4>(
    topForCell(x, y, seed),
    rightForCell(x, y, seed),
    bottomForCell(x, y, seed),
    leftForCell(x, y, seed),
  ));
}

fn topForCell(x: u32, y: u32, seed: f32) -> array<vec2f, 6> {
  if (y == dimensions.y - 1) {
    return top(x, y);
  }

  if (x == dimensions.x - 1) {
    return empty();
  }

  if (hashCell(x, y, seed) < 0.5) {
    return top(x, y);
  }

  return empty();
}

fn rightForCell(x: u32, y: u32, seed: f32) -> array<vec2f, 6> {
  if (x == dimensions.x - 1) {
    return right(x, y);
  }

  if (y == dimensions.y - 1) {
    return empty();
  }

  if (hashCell(x, y, seed) >= 0.5) {
    return right(x, y);
  }


  return empty();
}

fn bottomForCell(x: u32, y: u32, seed: f32) -> array<vec2f, 6> {
  if (y == 0) {
    return bottom(x, y);
  }

  return empty();
}

fn leftForCell(x: u32, y: u32, seed: f32) -> array<vec2f, 6> {
  if (x == 0) {
    return left(x, y);
  }

  return empty();
}

fn randomForCell(x: u32, y: u32, seed: f32) -> f32 {
  return f32((x * dimensions.x) + dimensions.y) * seed;
}


// A hash function to generate a pseudo-random value between 0 and 1
fn hashCell(x: u32, y: u32, seed: f32) -> f32 {
  let grid_width = dimensions.x;
  let grid_height = dimensions.y;

  // Combine coordinates, seed, and grid dimensions into a single integer
  let input = (x % grid_width) + (y % grid_height) * grid_width + u32(seed);

  // Use a mix of bitwise operations and arithmetic to hash
  var hashed = input ^ 0x27d4eb2d;
  hashed = (hashed ^ (hashed >> 15)) * 0x85ebca6b;
  hashed = (hashed ^ (hashed >> 13)) * 0xc2b2ae35;
  hashed = hashed ^ (hashed >> 16);

  // Map the hashed value to [0, 1]
  let normalized = f32(hashed & 0x7FFFFFFF) / f32(0x7FFFFFFF);

  return normalized;
}
