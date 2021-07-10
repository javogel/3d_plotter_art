const canvasSketch = require('canvas-sketch');
const { renderPaths, createPath, pathsToPolylines } = require('canvas-sketch-util/penplot');
const { clipPolylinesToBox } = require('canvas-sketch-util/geometry');
const Random = require('canvas-sketch-util/random');
const ln = require("@lnjs/core");

// You can force a specific seed by replacing this with a string value
const defaultSeed = 'o';

// Set a random seed so we can reproduce this print later
Random.setSeed(defaultSeed || Random.getRandomSeed());

// Print to console so we can see which seed is being used and copy it if desired
console.log('Random Seed:', Random.getSeed());

const settings = {
  suffix: Random.getSeed(),
  dimensions: 'A4',
  orientation: 'portrait',
  pixelsPerInch: 300,
  scaleToView: true,
  units: 'cm'
};

const sketch = (props) => {
  const { width, height, units } = props;

  // Holds all our 'path' objects
  // which could be from createPath, or SVGPath string, or polylines
  // const paths = [];

  // Draw random arcs
  // const count = 450;
  // for (let i = 0; i < count; i++) {
  //   // setup arc properties randomly
  //   const angle = Random.gaussian(0, Math.PI / 2);
  //   const arcLength = Math.abs(Random.gaussian(0, Math.PI / 2));
  //   const r = ((i + 1) / count) * Math.min(width, height) / 1;

  //   // draw the arc
  //   const p = createPath();
  //   p.arc(width / 2, height / 2, r, angle, angle + arcLength);
  //   paths.push(p);
  // }

  const scene = new ln.Scene()

  // A "Cube" in ln is defined by the position of 2 points
  // We are using vectors to store the X, Y and Z coordinates of a position in 3D space



  let eye = new ln.Vector(50, 40, 55)
  // let eye = new ln.Vector(3, 5, 10)
  let center = new ln.Vector(0, 0, 0)
  let up = new ln.Vector(0, 1, 0)


  const fovy = 40  // vertical field of view, in degrees
  const znear = 0.1 // near z plane
  const zfar = 100 // far z plane
  const step = 0.1 // how finely to chop the paths for visibility testing

  let count = 0.1
  for (let x = 5; x < 25; x = x + 2) {
    count += 1
    let cube = createCube([-count, x, -count], [count, x + 1.5, count])
    scene.add(cube)
  }

  // let c = 0.1
  // for (let x = -6; x > -25; x = x - 2) {
  //   c += 1
  //   let cube = createCube([-c, x, -c], [c, x + 1.5, c])
  //   scene.add(cube)
  // }




  // const sphere = new ln.TransformedShape(new ln.Sphere(new ln.Vector(0, -30, 0), 3.1), ln.rotate(new ln.Vector(1, 0, 0), Math.PI / 2))
  let sphere2 = new ln.Sphere(new ln.Vector(0, 0, 0), 3.5);
  let sphere2Rotated = new ln.TransformedShape(sphere2, ln.rotate(new ln.Vector(1, 0, 0), Math.PI / 2))
  // let sphere2Translated = new ln.TransformedShape(sphere2Rotated, ln.translate(new ln.Vector(0, 0, 0)))
  // let result = new ln.BooleanShape(ln.CSGOperation.Union, sphere2Translated, cube)
  // result = new ln.BooleanShape(ln.CSGOperation.Difference, result, cube2)
  // scene.add(result)


  scene.add(sphere2Rotated)


  const scenePaths = scene.render(eye, center, up, width, height, fovy, znear, zfar, step)
  const paths = sceneToLinePaths(scenePaths)
  // Convert the paths into polylines so we can apply line-clipping
  // When converting, pass the 'units' to get a nice default curve resolution

  let lines = pathsToPolylines(paths, { units });

  // Clip to bounds, using a margin in working units
  const margin = 1; // in working 'units' based on settings
  const box = [margin, margin, width - margin, height - margin];
  lines = clipPolylinesToBox(lines, box);

  // The 'penplot' util includes a utility to render
  // and export both PNG and SVG files
  return props => renderPaths(lines, {
    ...props,
    lineJoin: 'round',
    lineCap: 'round',
    // in working units; you might have a thicker pen
    lineWidth: 0.08,
    // Optimize SVG paths for pen plotter use
    optimize: true
  });
};

canvasSketch(sketch, settings);


function sceneToLinePaths(scenePaths) {
  return scenePaths.map(path => {
    const p = createPath();
    path.forEach(point => {
      p.lineTo(point.x, point.y)
    })
    return p
  })
}

// we can specify which paths to render and create new ones:
function cubePaths() {
  const { x: x1, y: y1, z: z1 } = this.min
  const { x: x2, y: y2, z: z2 } = this.max

  const paths = []

  const N = 3
  for (let i = 0; i <= N; i++) {
    const p = i / N
    const x = x1 + (x2 - x1) * p
    const y = y1 + (y2 - y1) * p
    const z = z1 + (z2 - z1) * p
    paths.push([new ln.Vector(x, y2, z1), new ln.Vector(x, y2, z2)]) // on top face
    paths.push([new ln.Vector(x2, y, z2), new ln.Vector(x1, y, z2)]) // on front face
    paths.push([new ln.Vector(x2, y1, z), new ln.Vector(x2, y2, z)]) // on right face

    // uncomment these for more paths :)
    paths.push([new ln.Vector(x1, y2, z), new ln.Vector(x2, y2, z)]) // on top face
    paths.push([new ln.Vector(x, y1, z2), new ln.Vector(x, y2, z2)]) // on front face
    paths.push([new ln.Vector(x2, y, z1), new ln.Vector(x2, y, z2)]) // on right face
  }
  return paths
}

function spherePaths() {

  let { center, radius } = this
  var paths = [];
  let n = 15;
  let o = 20;
  for (let lat = -90 + o; lat <= 90 - o; lat += n) {
    var path = [];
    for (let lng = 0; lng <= 360; lng++) {
      // console.log(Random.noise1D(Math.abs(lat)))
      let v = latLngToXYZ(lat, lng, radius).add(center);

      path.push(v);

    }

    paths.push(path);


  }
  for (let lng = 0; lng <= 360; lng += n) {
    var path = [];
    for (let lat = -90 + 1; lat <= 90 - 1; lat++) {

      let v = latLngToXYZ(lat, lng, radius).add(center);

      path.push(v);

    }
    paths.push(path);
  }
  return paths;



}



function createCube(min = [-1, -1, -1], max = [1, 1, 1]) {

  let cube = new ln.Cube(new ln.Vector(...min), new ln.Vector(...max))
  cube.paths = cubePaths
  return cube
}


function latLngToXYZ(lat, lng, radius) {
  let latr = radians(lat);
  let lngr = radians(lng);
  let x = radius * Math.cos(latr) * Math.cos(lngr);
  let y = radius * Math.cos(latr) * Math.sin(lngr);
  let z = radius * Math.sin(latr);
  return new ln.Vector(x, y, z);
}

function radians(degrees) {
  return (degrees * Math.PI) / 180;
}