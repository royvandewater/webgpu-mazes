const resizeCanvas = (canvas, device) => {
  const width = canvas.clientWidth;
  const maxWidth = device.limits.maxTextureDimension2D;
  const height = canvas.clientHeight;
  const maxHeight = device.limits.maxTextureDimension2D;

  const displayWidth = clamp(1, maxWidth, width);
  const displayHeight = clamp(1, maxHeight, height);

  if (canvas.width === displayWidth && canvas.height === displayHeight) return;

  canvas.width = displayWidth;
  canvas.height = displayHeight;
};

export const autoResize = (canvas, device) => {
  const observer = new ResizeObserver(() => {
    resizeCanvas(canvas, device);
  });
  observer.observe(canvas);
};

const clamp = (min, max, value) => Math.max(min, Math.min(value, max));
