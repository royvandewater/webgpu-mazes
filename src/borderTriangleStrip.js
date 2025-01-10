/**
 * @param {number} width
 * @param {number} height
 * @param {number} thickness
 * @returns {Float32Array}
 */
export const borderTriangleStrip = (width, height, thickness) => {
  const h = thickness / 2;

  return [
    [-0.5 + h + 1, -0.5 - h], // bottom left
    [-0.5 + h + 1, -0.5 + h], // bottom left inner
    [width - 0.5 + h, -0.5 - h], // bottom right
    [width - 0.5 - h, -0.5 + h], // bottom right inner
    [width - 0.5 + h, height - 0.5 - h - 1], // top right
    [width - 0.5 - h, height - 0.5 - h - 1], // top right inner

    [width - 0.5 - h - 1, height - 0.5 - h - 1], // break strip with invalid triangle
    [width - 0.5 - h - 1, height - 0.5 - h - 1],

    [width - 0.5 - h - 1, height - 0.5 + h], // top right
    [width - 0.5 - h - 1, height - 0.5 - h], // top right inner
    [-0.5 - h, height - 0.5 + h], // top left
    [-0.5 + h, height - 0.5 - h], // top left inner
    [-0.5 - h, -0.5 + h + 1], // bottom left
    [-0.5 + h, -0.5 + h + 1], // bottom left inner
  ];
};

/**
 * @param {GPUDevice} device
 * @param {number} width
 * @param {number} height
 * @param {number} thickness
 * @returns {GPUBuffer}
 */
export const generateBorderBuffer = (device, width, height, thickness) => {
  const triangles = Float32Array.from(borderTriangleStrip(width, height, thickness).flat(2));

  const buffer = device.createBuffer({
    label: "border buffer",
    size: triangles.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(buffer, 0, triangles);

  return buffer;
};
