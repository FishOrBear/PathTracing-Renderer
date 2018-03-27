import { PathTracingRenderer } from './PathTracingRenderer';

import * as Dat from "dat.gui";

let render = new PathTracingRenderer();

let path = render.LoadDefaultMaterial(require("./glsl/pathTracingFragmentShader.glsl"));

let mis = render.LoadDefaultMaterial(require("./glsl/mis.glsl"));

render.pathTracingMesh.material = path;

render.RenderCycle();

let gui = new Dat.GUI(
    {
        autoPlace: true,
        width: 300,
    }
);

let data = {
    Path: () =>
    {
        render.pathTracingMesh.material = path;
        render.sampleCounter = 1;
    },
    Mis: () =>
    {
        render.pathTracingMesh.material = mis;
        render.sampleCounter = 1;
    },
    Stop: () =>
    {
        render.Disabled = false;
    },
    Start: () =>
    {
        render.Disabled = true;
    },
}

for (let key in data)
{
    gui.add(data, key);
}


