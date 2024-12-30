// @include "./mazeWalls.wgsl"
// @include "./flattenQuads.wgsl"

@group(0) @binding(0) var<storage, read_write> data: array<f32>;
@group(0) @binding(1) var<uniform> dimensions: vec2u;
@group(0) @binding(2) var<uniform> thickness: f32;

@compute @workgroup_size(1) fn generate(
  @builtin(global_invocation_id) id: vec3u
) {
  let i = id.x + (id.y * dimensions.x);
  let seed = f32(i) * data[i];

  let values = generateCell(id.x, id.y, seed, thickness);

  for (var j: u32 = 0; j < 24; j++) {
    data[i * 24 + j] = values[j];
  }
}

fn cellIndexToPosition(cellIndex: u32) -> vec2u {
  return vec2u(cellIndex % dimensions.x, cellIndex / dimensions.x);
}

fn generateCell(x: u32, y: u32, seed: f32, thickness: f32) -> array<f32, 24> {
  return flatten2Quads(array<array<vec2f, 6>, 2>(
    topForCell(x, y, seed, thickness),
    rightForCell(x, y, seed, thickness),
  ));
}

fn topForCell(x: u32, y: u32, seed: f32, thickness: f32) -> array<vec2f, 6> {
  if (x == dimensions.x - 1) {
    return empty();
  }

  if (hashCell(x, y, seed) < 0.5) {
    return top(x, y, thickness);
  }

  return empty();
}

fn rightForCell(x: u32, y: u32, seed: f32, thickness: f32) -> array<vec2f, 6> {
  if (y == dimensions.y - 1) {
    return empty();
  }

  if (hashCell(x, y, seed) >= 0.5) {
    return right(x, y, thickness);
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
