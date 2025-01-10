// @include "./mazeWalls.wgsl"
// @include "./flattenQuads.wgsl"

// ┌───┬───┬
// │ 7   8   9    0,2 1,2 2,2
// ├───┼   ┼   ┤
// │ 4   5 │ 6 │  0,1 1,1 2,1
// ├   ┼───┼   ┤
//   0 │ 1   2 │  0,0 1,0 2,0
//    ─┴───┴───┘
// The outer border walls are taken care of somewhere else

@group(0) @binding(0) var<storage, read_write> data: array<f32>;
@group(0) @binding(1) var<uniform> dimensions: vec2u;
@group(0) @binding(2) var<uniform> thickness: f32;

@compute @workgroup_size(1) fn generate(
  @builtin(global_invocation_id) id: vec3u
) {
  let i = id.x + (id.y * dimensions.x);
  let values = flattenQuad(generateCell(id.x, id.y, thickness));

  for (var j: u32 = 0; j < 12; j++) {
    data[i * 12 + j] = values[j];
  }
}

fn coordToInt(x: u32, y: u32) -> u32 {
  return x + (y * dimensions.x);
}

fn generateCell(x: u32, y: u32, thickness: f32) -> array<vec2f, 6> {
  // processing the maze from bottom left to top right
  switch (coordToInt(x, y)) {
    case 0: {
      return right(x, y, thickness);
    }
    case 1: {
      return top(x, y, thickness);
    }
    case 2: {
      return empty();
    }
    case 3: {
      return top(x, y, thickness);
    }
    case 4: {
      return right(x, y, thickness);
    }
    case 5: {
      return empty();
    }
    case 6, 7, 8: {
      return empty();
    }
    default: {
      return empty();
    }
  }
}

