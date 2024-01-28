const canvas = document.getElementById('graph');
const ctx = canvas.getContext('2d');
let numX = 15;
let numY;
let camX = 0;
let camY = 0;
let exit = false;

canvas.width = 670;
canvas.height = window.innerHeight;
canvas.style.backgroundColor = 'black'
canvas.style.color = 'white';

const factor = canvas.height / canvas.width;
let zoom = 1;
let scale = canvas.width / 10;
let squareSide = 1;

let homeRequest = 0;
let zoomInterval = 0;
let xInterval = 0;
let yInterval = 0;

function translateX(graphX) {
  return (graphX - camX) * scale + canvas.width / 2;
}

function translateY(graphY) {
  return -(graphY - camY) * scale + canvas.height / 2;
}

function reverseX(screenX) {
  return (screenX - canvas.width / 2) / scale + camX;
}

function reverseY(screenY) {
  return -(screenY - canvas.height / 2) / scale - camY;
}

function graph(func) {
// console.log(func);
  ctx.strokeStyle = "red";
  ctx.lineWidth = 3;
  for (let i = 0; i < canvas.width; i++) {
    const graphX1 = reverseX(i);
    const graphY1 = func(graphX1);
    const graphX2 = reverseX(i + 1);
    const graphY2 = func(graphX2);
    ctx.beginPath();
    ctx.moveTo(i, translateY(graphY1));
    ctx.lineTo(i + 1, translateY(graphY2));
    ctx.stroke();
  }
}

function drawLine(startX, startY, endX, endY, color, lineWidth) {
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.lineWidth = lineWidth;
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.closePath();
  ctx.stroke();
}

const supMap = {
  0: "⁰",
  1: "¹",
  2: "²",
  3: "³",
  4: "⁴",
  5: "⁵",
  6: "⁶",
  7: "⁷",
  8: "⁸",
  9: "⁹",
}

function format(num) {
    if (Math.abs(num) >= 10000) {
      let exp = "";
      const digits = Math.floor(Math.log(Math.abs(num)) / Math.log(10));
      for (let i = 0; i < digits.toString().length; i++) {
        exp += supMap[digits.toString()[i]];
      }
      const mantissa = num / (10 ** digits);
      return Math.round(mantissa * 100) / 100 + "×10" + exp;
    }
    if (Math.abs(num) <= 0.01 && num !== 0) {
      let exp = "";
      const digits = -Math.floor(Math.log(Math.abs(num)) / Math.log(10));
      for (let i = 0; i < digits.toString().length; i++) {
        exp += supMap[digits.toString()[i]];
      }
      const mantissa = num * (10 ** digits);
      return Math.round(mantissa * 100) / 100 + "×10⁻" + exp;
    }
    else return (Math.round(num * 100) / 100).toString();
}

function drawGraphLines() {
  numY = Math.ceil(factor * numX);
  const snappedX = Math.round(camX / squareSide) * squareSide;
  const snappedY = Math.round(camY / squareSide) * squareSide;

  // Vertical Lines
  for (let i = -numX; i <= numX; i++) {
    const x = i * squareSide + snappedX;
    //const xRounded = (Math.round(100 * x) / 100);
    drawLine(translateX(x), 0, translateX(x), canvas.height, 'rgb(50, 50, 50)', 1)
    ctx.font = "19px monospace";
    ctx.strokeStyle = "white";
    ctx.fillStyle = "white";

    let xText = format(x);

    ctx.fillText(xText, translateX(x), translateY(0) + 20);
  }

  // Horizontal
  for (let i = -numY; i <= numY; i++) {
    const y = i * squareSide + snappedY;
    // const yRounded = (Math.round(100 * y) / 100);
    drawLine(0, translateY(y), canvas.width, translateY(y), "rgb(50, 50, 50)", 1)
    ctx.font = "19px monospace";
    ctx.strokeStyle = "white";
    ctx.fillStyle = "white";

    if (y != 0) {
      let yText = format(y);
      ctx.fillText(yText, (translateX(0) + 5), (translateY(y) - 10));
    }

  }

  drawLine(translateX(0), 0, translateX(0), canvas.height, 'white', 4)
  drawLine(0, translateY(0), canvas.width, translateY(0), 'white', 4)
}

let keys = {};

let previousFrameLog = 0;

document.addEventListener('keydown', (e) => {
  keys[e.key.toLowerCase()] = true;
});

document.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});

function draw(func, init=false) {
    if(init) exit = false;
  if(!exit) requestAnimationFrame(() => draw(func));

  if(keys['escape']) {
    exit = true;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const newFrameLog = Math.floor(Math.log(zoom) / Math.log(2))
  const difference = previousFrameLog - newFrameLog;
  squareSide *= 2 ** difference;
  const zoomSpeed = 1.015;
  if (keys['z']) {
    zoom *= zoomSpeed;
    scale = canvas.width / 10 * zoom;
  }
  if (keys['x']) {
    zoom *= 1 / zoomSpeed;
    scale = canvas.width / 10 * zoom;
  }
  if (keys['h']) {
    if (homeRequest === 0) {
      homeRequest = 30;
      const x = 1 / homeRequest;
      zoomInterval = zoom ** (-x);
      xInterval = -camX * x;
      yInterval = -camY * x;
    }
  }
  

  const shift = 0.075 / zoom;
  if (keys['w']) camY += shift;
  if (keys['a']) camX -= shift;
  if (keys['s']) camY -= shift;
  if (keys['d']) camX += shift;

  drawGraphLines();

  const gamma = z => Math.sqrt(2 * Math.PI / z) * Math.pow((1 / Math.E) * (z + 1 / (12 * z - 1 / (10 * z))), z)

  const { sin, cos, tan, exp } = Math;

  // GRAPHED FUNCTION
  graph(func);

  previousFrameLog = newFrameLog;

  if (homeRequest > 0) {
    zoom *= zoomInterval;
    camX += xInterval;
    camY += yInterval;
    scale = canvas.width / 10 * zoom
    homeRequest--;
  }

  previousFrameLog = newFrameLog;
}

//draw(func);

export {draw}