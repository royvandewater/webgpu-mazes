export const registerPinchZoom = (canvas, onZoom) => {
  // registerDesktopPinchZoom(canvas, onZoom);
  registerMobilePinchZoom(canvas, onZoom);
};

const registerDesktopPinchZoom = (canvas, onZoom) => {
  canvas.addEventListener(
    "wheel",
    (event) => {
      if (!event.ctrlKey) return;
      event.preventDefault();
      onZoom(event.deltaY);
    },
    { passive: false }
  );
};

const registerMobilePinchZoom = (canvas, onZoom) => {
  const evCache = {};
  let prevDiff = -1;

  canvas.onpointerdown = pointerdownHandler;
  canvas.onpointermove = pointermoveHandler;
  // Use same handler for pointer{up,cancel,out,leave} events since
  // the semantics for these events - in this app - are the same.
  canvas.onpointerup = pointerupHandler;
  canvas.onpointercancel = pointerupHandler;
  canvas.onpointerout = pointerupHandler;
  canvas.onpointerleave = pointerupHandler;

  const logElement = document.getElementById("log");
  const log = (...args) => {
    logElement.textContent = (args.map((arg) => JSON.stringify(arg))).join("\t") + "\n" + logElement.textContent;
    console.log(...args);
  };

  function pointerdownHandler(ev) {
    // The pointerdown event signals the start of a touch interaction.
    // This event is cached to support 2-finger gestures
    evCache[ev.pointerId] = ev;
    // log("pointerDown", ev);
  }

  function pointerupHandler(ev) {
    // log(ev.type, ev);
    // Remove this pointer from the cache and reset the target's
    // background and border
    delete evCache[ev.pointerId];
    ev.target.style.background = "white";
    ev.target.style.border = "1px solid black";

    // If the number of pointers down is less than two then reset diff tracker
    if (Object.keys(evCache).length < 2) {
      prevDiff = -1;
    }
  }

  function pointermoveHandler(ev) {
    // This function implements a 2-pointer horizontal pinch/zoom gesture.
    //
    // If the distance between the two pointers has increased (zoom in),
    // the target element's background is changed to "pink" and if the
    // distance is decreasing (zoom out), the color is changed to "lightblue".
    //
    // This function sets the target element's border to "dashed" to visually
    // indicate the pointer's target received a move event.
    // log("pointerMove", ev);
    // ev.target.style.border = "dashed";

    // Find this event in the cache and update its record with this event
    evCache[ev.pointerId] = ev;

    // If two pointers are down, check for pinch gestures
    if (Object.keys(evCache).length === 2) {
      const [pointer0, pointer1] = Object.values(evCache);
      // Calculate the distance between the two pointers
      const curDiff = Math.abs(pointer0.clientX - pointer1.clientX);

      if (prevDiff > 0 && curDiff !== prevDiff) {
        onZoom(prevDiff - curDiff);
        // ev.preventDefault();
        if (curDiff > prevDiff) {
          // The distance between the two pointers has increased
          log("Zoom in", ev);
          logElement.style.background = "pink";
        }
        if (curDiff < prevDiff) {
          // The distance between the two pointers has decreased
          log("Zoom out", ev);
          logElement.style.background = "lightblue";
        }
      }

      // Cache the distance for the next move event
      prevDiff = curDiff;
    }
  }
};
