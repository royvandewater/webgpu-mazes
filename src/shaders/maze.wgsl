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
    // First normalize the coordinate to 0-1 range
  let normalizedCoord = (coordinate - minMaxValues.xy) / (minMaxValues.zw - minMaxValues.xy);
  let normalizedCamera = (camera.xy - minMaxValues.xy) / (minMaxValues.zw - minMaxValues.xy);

  // Center the coordinate system (move 0,0 to center)
  let centeredCoord = normalizedCoord - 0.5;

  // Apply zoom to the centered coordinate
  let zoomedCoordinate = centeredCoord * (1 / camera.z);

  // Apply camera translation
  let cameraAdjustedCoordinate = vec2f(zoomedCoordinate.x + normalizedCamera.x, zoomedCoordinate.y - normalizedCamera.y);

  // Convert to clip space (-1 to 1 range)
  return cameraAdjustedCoordinate * 2.0;
}
