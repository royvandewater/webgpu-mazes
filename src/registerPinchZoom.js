export const registerPinchZoom = (canvas, onZoom) => {
  canvas.addEventListener(
    "wheel",
    (event) => {
      if (!event.ctrlKey) return;
      ((event) => {
        event.preventDefault();
        const amount = event.deltaY;
        onZoom(amount);
      })(event);
    },
    { passive: false }
  );
};
