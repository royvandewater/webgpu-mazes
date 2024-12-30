@group(0) @binding(0) var<storage> vertices: array<vec2f>;

// minMaxValues is an array of 4 floats. The first two are the minimum x & y values,
// and the second two are the maximum x & y values.
@group(0) @binding(1) var<uniform> minMaxValues: vec4f;

@vertex fn vertexShader(
  @builtin(vertex_index) vertexIndex: u32,
) -> @builtin(position) vec4f {
  let vertex = scaleCoordinate(vertices[vertexIndex], minMaxValues);

  return vec4f(vertex, 0.0, 1.0);
}

@fragment fn fragmentShader() -> @location(0) vec4f {
  return vec4f(0.0, 0.0, 0.0, 1.0);
}

// moves the coordinate to a -1 to 1 range
fn scaleCoordinate(coordinate: vec2f, minMaxValues: vec4f) -> vec2f {
  return ((coordinate - minMaxValues.xy) / (minMaxValues.zw - minMaxValues.xy)) * 2 - 1;
}
