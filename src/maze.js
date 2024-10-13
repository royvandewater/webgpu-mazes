export const generateMaze = (width, height) => {
  const quads = [];

  times(height).forEach((y) => {
    quads.push(left(0, y));
  });

  times(width).forEach((x) => {
    quads.push(bottom(x, 0));
  });

  times(width)
    .map((x) => times(height).map((y) => [x, y]))
    .flat()
    .forEach(([x, y]) => {
      if (x === width && y === height) {
        quads.push(right(x, y));
        quads.push(top(x, y));
        return;
      }

      if (x === width) {
        quads.push(right(x, y));
        return;
      }

      if (y === height) {
        quads.push(top(x, y));
        return;
      }

      if (Math.random() < 0.5) {
        quads.push(right(x, y));
      } else {
        quads.push(top(x, y));
      }
    });

  return quads;
};

export const hardcodedMaze = () => {
  // we're drawing a 3x3 grid of squares. Each square has a top edge and a right edge.
  // The squares on the bottom row have a bottom edge, and the squares on the left row
  // have a left edge. Each edge is drawn as a line, and is therefore represented by 2
  // vertices. Therefore, we have 3 lines per row and 4 lines (3 top lines, 1 bottom line)
  // Similarly, we have 3 lines per column and 4 lines (3 left lines, 1 right line).
  // Therefore, we have (3 * 4) + (3 * 4) = 24 lines.
  // Not all lines will be filled in though

  // lets start with a hardcoded grid that looks like this:
  // ┌───┬───┬───┐
  // │           │  0,2 1,2 2,2
  // ├───┼   ┼   ┤
  // │       │   │  0,1 1,1 2,1
  // ├   ┼───┼   ┤
  // │   │       │  0,0 1,0 2,0
  // └───┴───┴───┘

  const quads = [
    // first row
    top(0, 2),
    top(1, 2),
    top(2, 2),
    left(0, 2),
    right(2, 2),
    // second row
    top(0, 1),
    left(0, 1),
    right(1, 1),
    right(2, 1),
    // third row
    top(1, 0),
    left(0, 0),
    right(0, 0),
    right(2, 0),
    bottom(0, 0),
    bottom(1, 0),
    bottom(2, 0),
  ];
};

const thickness = 0.1;
const halfThickness = thickness / 2;

const top = (x, y) => {
  // x, y is the center of the square.
  // the top edge is 0.5 units above the center
  // the quad should be vertically centered about the top edge
  // and have a thickness of 0.01 units

  const topEdge = y + 0.5;
  const leftEdge = x - 0.5;
  const rightEdge = x + 0.5;

  return [
    [leftEdge - halfThickness, topEdge - halfThickness],
    [rightEdge + halfThickness, topEdge - halfThickness],
    [leftEdge - halfThickness, topEdge + halfThickness],
    [rightEdge + halfThickness, topEdge - halfThickness],
    [leftEdge - halfThickness, topEdge + halfThickness],
    [rightEdge + halfThickness, topEdge + halfThickness],
  ];
};

const left = (x, y) => {
  const leftEdge = x - 0.5;
  const topEdge = y + 0.5;
  const bottomEdge = y - 0.5;

  return [
    [leftEdge - halfThickness, topEdge + halfThickness],
    [leftEdge - halfThickness, bottomEdge - halfThickness],
    [leftEdge + halfThickness, topEdge + halfThickness],
    [leftEdge - halfThickness, bottomEdge - halfThickness],
    [leftEdge + halfThickness, topEdge + halfThickness],
    [leftEdge + halfThickness, bottomEdge - halfThickness],
  ];
};

const right = (x, y) => {
  const rightEdge = x + 0.5;
  const topEdge = y + 0.5;
  const bottomEdge = y - 0.5;

  return [
    [rightEdge - halfThickness, topEdge + halfThickness],
    [rightEdge - halfThickness, bottomEdge - halfThickness],
    [rightEdge + halfThickness, topEdge + halfThickness],
    [rightEdge - halfThickness, bottomEdge - halfThickness],
    [rightEdge + halfThickness, topEdge + halfThickness],
    [rightEdge + halfThickness, bottomEdge - halfThickness],
  ];
};

const bottom = (x, y) => {
  const bottomEdge = y - 0.5;
  const leftEdge = x - 0.5;
  const rightEdge = x + 0.5;

  return [
    [leftEdge - halfThickness, bottomEdge - halfThickness],
    [rightEdge + halfThickness, bottomEdge - halfThickness],
    [leftEdge - halfThickness, bottomEdge + halfThickness],
    [rightEdge + halfThickness, bottomEdge - halfThickness],
    [leftEdge - halfThickness, bottomEdge + halfThickness],
    [rightEdge + halfThickness, bottomEdge + halfThickness],
  ];
};

const times = (end) => {
  return Array.from({ length: end + 1 }, (_, i) => i);
};
