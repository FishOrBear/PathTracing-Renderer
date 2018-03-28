import { PathTracingRenderer } from './PathTracingRenderer';

import * as Dat from "dat.gui";

let render = new PathTracingRenderer();

let path = render.LoadDefaultMaterial(require("./glsl/pathTracingFragmentShader.glsl"));

let mis = render.LoadDefaultMaterial(require("./glsl/mis.glsl"));

let bi = render.LoadDefaultMaterial(require("./glsl/bi.glsl"));

let classPT = render.LoadDefaultMaterial(require("./glsl/Bi-Directional_DifficultLighting_ClassicTestScene.glsl"));

let bvhPT = render.LoadDefaultMaterial(require("./glsl/BVH_Debuging.glsl"));

render.pathTracingMesh.material = path;

render.RenderCycle();

let gui = new Dat.GUI(
    {
        autoPlace: true,
        width: 300,
    }
);

let data = {
    MultiMethod: () =>
    {
        render.pathTracingMesh.material = path;
        render.sampleCounter = 1;
    },
    Mis: () =>
    {
        render.pathTracingMesh.material = mis;
        render.sampleCounter = 1;
    },
    Bi_Directional: () =>
    {
        render.pathTracingMesh.material = bi;
        render.sampleCounter = 1;
    },
    ClassicTestScene: () =>
    {
        render.pathTracingMesh.material = classPT;
        render.sampleCounter = 1;
    },
    BVHDebuging: () =>
    {
        render.pathTracingMesh.material = bvhPT;
        render.sampleCounter = 1;
    },
    Stop: () =>
    {
        render.Disabled = true;
    },
    Start: () =>
    {
        render.Disabled = false;
    },
}

for (let key in data)
{
    gui.add(data, key);
}

gui.domElement.style.width = "500px"

