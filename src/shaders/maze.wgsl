@group(0) @binding(0) var<storage> vertices: array<vec2f>;

// minMaxValues is an array of 4 floats. The first two are the minimum x & y values,
// and the second two are the maximum x & y values.
@group(0) @binding(1) var<uniform> minMaxValues: vec4f;

// camera is a vec3f that represents the camera's position. The first two are the
// x & y position, and the third is the zoom level. Think of the zoom level as the
// distance between the camera and the maze.
@group(0) @binding(2) var<uniform> camera: vec3f;

@vertex fn vertexShader(
  @builtin(vertex_index) vertexIndex: u32,
) -> @builtin(position) vec4f {
  let vertex = scaleCoordinate(vertices[vertexIndex], minMaxValues, camera);

  return vec4f(vertex, 0.0, 1.0);
}

@fragment fn fragmentShader() -> @location(0) vec4f {
  return vec4f(0.0, 0.0, 0.0, 1.0);
}

// moves the coordinate to a -1 to 1 range, adjust for the camera's position and zoom
fn scaleCoordinate(coordinate: vec2f, minMaxValues: vec4f, camera: vec3f) -> vec2f {
  let cameraAdjustedCoordinate = vec2f(coordinate.x + camera.x, coordinate.y - camera.y) * (1 / camera.z);

  return ((cameraAdjustedCoordinate - minMaxValues.xy) / (minMaxValues.zw - minMaxValues.xy)) * 2 - 1;
}
