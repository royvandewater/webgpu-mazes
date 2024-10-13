@group(0) @binding(0) var<storage> vertices: array<vec2f>;

@vertex fn vertexShader(
  @builtin(vertex_index) vertexIndex: u32,
) -> @builtin(position) vec4f {
  return vec4f(vertices[vertexIndex], 0.0, 1.0);
}

@fragment fn fragmentShader() -> @location(0) vec4f {
  return vec4f(0.0, 0.0, 0.0, 1.0);
}
