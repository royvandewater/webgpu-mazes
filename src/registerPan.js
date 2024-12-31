const scaleX = 0.0009;
const scaleY = 0.000975;

export function registerPan(canvas, callback) {
  let mouseDown = false;

  canvas.addEventListener("pointerdown", (event) => {
    mouseDown = true;
  });

  canvas.addEventListener("pointerup", (event) => {
    mouseDown = false;
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!mouseDown) return;

    callback({
      dx: event.movementX * scaleX,
      dy: event.movementY * scaleY,
    });
  });
}
