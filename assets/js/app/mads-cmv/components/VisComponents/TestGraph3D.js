import React, { useState, useEffect, useRef } from 'react';
import vis from 'vis-graph3d/dist/esm';

console.log(vis);
window.vis = vis;

function custom(x, y) {
  return Math.sin(x / 50) * Math.cos(y / 50) * 50 + 50;
}

export default function TestGraph3D({ data, options }) {
  const rootNode = useRef(null);
  let views = null;
  let cds = null;

  const createChart = async () => {
    const fig = {};

    const data = new vis.DataSet();

    // create some nice looking data with sin/cos
    const steps = 50; // number of datapoints will be steps*steps
    const axisMax = 314;
    const axisStep = axisMax / steps;
    for (let x = 0; x < axisMax; x += axisStep) {
      for (let y = 0; y < axisMax; y += axisStep) {
        const value = custom(x, y);
        data.add({
          x: x,
          y: y,
          z: value,
          style: value,
        });
      }
    }
    console.log(data);

    // specify options
    const options = {
      width: '600px',
      height: '600px',
      style: 'surface',
      showPerspective: true,
      showGrid: true,
      showShadow: false,
      keepAspectRatio: true,
      verticalRatio: 0.5,
    };

    // create a graph3d
    // var container = document.getElementById('mygraph');
    const graph3d = new vis.Graph3d(rootNode.current, data, options);
  };

  const clearChart = () => {};

  useEffect(() => {
    // console.info('mount');
    createChart();
    return () => {
      // console.info('unmount');
      clearChart();
    };
  });

  return (
    <div id="container">
      <div ref={rootNode} />
    </div>
  );
}
