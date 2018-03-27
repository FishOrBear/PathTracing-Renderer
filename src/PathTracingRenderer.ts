import { Vector3 } from 'three';
import * as THREE from 'three';

import { FirstPersonCameraControls } from './FirstPersonCameraControls';
import { screenOutputShader, screenTextureShader } from './glsl/pathTracingCommon';

export class PathTracingRenderer
{
    pathTracingMesh: THREE.Mesh;
    controls: FirstPersonCameraControls;
    sampleCounter: number = 1;
    screenTextureMesh: THREE.Mesh;
    screenTextureScene: THREE.Scene;
    screenOutputScene: THREE.Scene;
    pathTracingScene: THREE.Scene;
    screenOutputMaterial: THREE.ShaderMaterial;
    cameraControlsObject: THREE.Object3D;
    quadCamera: THREE.OrthographicCamera;
    worldCamera: THREE.PerspectiveCamera;
    screenTextureRenderTarget: THREE.WebGLRenderTarget;
    pathTracingRenderTarget: THREE.WebGLRenderTarget;
    pathTracingUniforms: { tPreviousTexture: { type: string; value: THREE.Texture; }; uCameraIsMoving: { type: string; value: boolean; }; uCameraJustStartedMoving: { type: string; value: boolean; }; uTime: { type: string; value: number; }; uSampleCounter: { type: string; value: number; }; uMouse: { type: string; value: any; }; uULen: { type: string; value: number; }; uVLen: { type: string; value: number; }; uApertureSize: { type: string; value: number; }; uFocusDistance: { type: string; value: number; }; uResolution: { type: string; value: THREE.Vector2; }; uRandomVector: { type: string; value: THREE.Vector3; }; uCameraMatrix: { type: string; value: THREE.Matrix4; }; uShortBoxInvMatrix: { type: string; value: THREE.Matrix4; }; uShortBoxNormalMatrix: { type: string; value: THREE.Matrix3; }; uTallBoxInvMatrix: { type: string; value: THREE.Matrix4; }; uTallBoxNormalMatrix: { type: string; value: THREE.Matrix3; }; };
    renderer: THREE.WebGLRenderer;
    SCREEN_HEIGHT: number;
    SCREEN_WIDTH: number;

    Disabled: boolean = false;
    constructor()
    {
        this.InitRender();
        this.InitScene();
        this.OnWindowResize();
    }
    InitRender()
    {
        this.renderer = new THREE.WebGLRenderer(
        );

        this.renderer.setClearColor(0x000000, 1);

        this.renderer.autoClear = false;
        this.
            // 1 is full resolution, 0.5 is half, 0.25 is quarter, etc. (must be > than 0.0)
            renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.context.getExtension('OES_texture_float');

        let container = document.getElementById('container');
        container.appendChild(this.renderer.domElement);
    }
    InitScene()
    {
        this.pathTracingScene = new THREE.Scene();
        this.screenTextureScene = new THREE.Scene();
        this.screenOutputScene = new THREE.Scene();

        this.InitCamera();

        this.InitRenderTarget();

        this.InitUniforms();

        let pathTracingGeometry = new THREE.PlaneBufferGeometry(2, 2);

        this.pathTracingMesh = new THREE.Mesh(pathTracingGeometry);
        this.pathTracingScene.add(this.pathTracingMesh);

        // the following keeps the large scene ShaderMaterial quad right in front 
        //   of the camera at all times. This is necessary because without it, the scene 
        //   quad will fall out of view and get clipped when the camera rotates past 180 degrees.
        this.worldCamera.add(this.pathTracingMesh);

        let screenTextureGeometry = new THREE.PlaneBufferGeometry(2, 2);

        let screenTextureMaterial = new THREE.ShaderMaterial({
            uniforms: screenTextureShader.uniforms,
            vertexShader: screenTextureShader.vertexShader,
            fragmentShader: screenTextureShader.fragmentShader,
            depthWrite: false,
            depthTest: false
        });

        screenTextureMaterial.uniforms.tTexture0.value = this.pathTracingRenderTarget.texture;

        this.screenTextureMesh = new THREE.Mesh(screenTextureGeometry, screenTextureMaterial);

        this.screenTextureScene.add(this.screenTextureMesh);


        let screenOutputGeometry = new THREE.PlaneBufferGeometry(2, 2);

        this.screenOutputMaterial = new THREE.ShaderMaterial({
            uniforms: screenOutputShader.uniforms,
            vertexShader: screenOutputShader.vertexShader,
            fragmentShader: screenOutputShader.fragmentShader,
            depthWrite: false,
            depthTest: false
        });

        this.screenOutputMaterial.uniforms.tTexture0.value = this.pathTracingRenderTarget.texture;

        let screenOutputMesh = new THREE.Mesh(screenOutputGeometry, this.screenOutputMaterial);
        this.screenOutputScene.add(screenOutputMesh);

        // Boxes
        let tallBoxMesh = new THREE.Object3D();
        this.pathTracingScene.add(tallBoxMesh);
        tallBoxMesh.rotation.set(0, Math.PI * 0.1, 0);
        tallBoxMesh.position.set(180, 170, -350);
        tallBoxMesh.updateMatrixWorld(true); // 'true' forces immediate matrix update

        this.pathTracingUniforms.uTallBoxInvMatrix.value.getInverse(tallBoxMesh.matrixWorld);
        this.pathTracingUniforms.uTallBoxNormalMatrix.value.getNormalMatrix(tallBoxMesh.matrixWorld);


        let shortBoxMesh = new THREE.Object3D();
        this.pathTracingScene.add(shortBoxMesh);
        shortBoxMesh.rotation.set(0, -Math.PI * 0.09, 0);
        shortBoxMesh.position.set(370, 85, -170);
        shortBoxMesh.updateMatrixWorld(true); // 'true' forces immediate matrix update

        this.pathTracingUniforms.uShortBoxInvMatrix.value.getInverse(shortBoxMesh.matrixWorld);
        this.pathTracingUniforms.uShortBoxNormalMatrix.value.getNormalMatrix(shortBoxMesh.matrixWorld);
    }

    LoadDefaultMaterial(fragmentShader: string): THREE.ShaderMaterial
    {
        return new THREE.ShaderMaterial({
            uniforms: this.pathTracingUniforms,
            //defines: pathTracingDefines,
            vertexShader: require('./glsl/pathTracingVertexShader.glsl'),
            fragmentShader: fragmentShader,
            depthTest: false,
            depthWrite: false
        });
    }

    private InitUniforms()
    {
        this.pathTracingUniforms = {
            tPreviousTexture: { type: "t", value: this.screenTextureRenderTarget.texture },
            //tTriangleTexture: { type: "t", value: triangleDataTexture },
            uCameraIsMoving: { type: "b1", value: false },
            uCameraJustStartedMoving: { type: "b1", value: false },
            uTime: { type: "f", value: 0.0 },
            uSampleCounter: { type: "f", value: 0.0 },
            uMouse: { type: "v3", value: new Vector3() },
            uULen: { type: "f", value: 1.0 },
            uVLen: { type: "f", value: 1.0 },
            uApertureSize: { type: "f", value: 0.0 },
            uFocusDistance: { type: "f", value: 1180.0 },
            uResolution: { type: "v2", value: new THREE.Vector2(this.renderer.context.drawingBufferWidth, this.renderer.context.drawingBufferHeight) },
            //uMeshBBox_min: { type: "v3", value: objMeshes.my_mesh.bounding_box_min },
            //uMeshBBox_max: { type: "v3", value: objMeshes.my_mesh.bounding_box_max },
            uRandomVector: { type: "v3", value: new THREE.Vector3() },
            uCameraMatrix: { type: "m4", value: new THREE.Matrix4() },
            uShortBoxInvMatrix: { type: "m4", value: new THREE.Matrix4() },
            uShortBoxNormalMatrix: { type: "m3", value: new THREE.Matrix3() },
            uTallBoxInvMatrix: { type: "m4", value: new THREE.Matrix4() },
            uTallBoxNormalMatrix: { type: "m3", value: new THREE.Matrix3() }
        };
    }

    private InitRenderTarget()
    {
        this.pathTracingRenderTarget = new THREE.WebGLRenderTarget((window.innerWidth * window.devicePixelRatio), (window.innerHeight * window.devicePixelRatio), {
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter,
            format: THREE.RGBAFormat,
            type: THREE.FloatType,
            depthBuffer: false,
            stencilBuffer: false
        });
        this.pathTracingRenderTarget.texture.generateMipmaps = false;
        this.screenTextureRenderTarget = new THREE.WebGLRenderTarget((window.innerWidth * window.devicePixelRatio), (window.innerHeight * window.devicePixelRatio), {
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter,
            format: THREE.RGBAFormat,
            type: THREE.FloatType,
            depthBuffer: false,
            stencilBuffer: false
        });
        this.screenTextureRenderTarget.texture.generateMipmaps = false;
    }

    private InitCamera()
    {
        // quadCamera is simply the camera to help render the full screen quad (2 triangles),
        // hence the name.  It is an Orthographic camera that sits facing the view plane, which serves as
        // the window into our 3d world. This camera will not move or rotate for the duration of the app.
        this.quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        this.screenTextureScene.add(this.quadCamera);
        this.screenOutputScene.add(this.quadCamera);
        // worldCamera is the dynamic camera 3d object that will be positioned, oriented and 
        // constantly updated inside the 3d scene.  Its view will ultimately get passed back to the 
        // stationary quadCamera, which renders the scene to a fullscreen quad (made up of 2 large triangles).
        this.worldCamera = new THREE.PerspectiveCamera(31, window.innerWidth / window.innerHeight, 1, 1000);
        this.pathTracingScene.add(this.worldCamera);
        this.controls = new FirstPersonCameraControls(this.worldCamera);
        this.cameraControlsObject = this.controls.getObject();
        let cameraControlsYawObject = this.controls.getYawObject();
        let cameraControlsPitchObject = this.controls.getPitchObject();
        this.pathTracingScene.add(this.cameraControlsObject);
        this.cameraControlsObject.position.set(278, 270, 1050); // for flyCam
        ///cameraControlsYawObject.rotation.y = 0.0;
        // look slightly upward
        cameraControlsPitchObject.rotation.x = 0.005;
        let oldYawRotation = cameraControlsYawObject.rotation.y;
        let oldPitchRotation = cameraControlsPitchObject.rotation.x;
        // now that we moved and rotated the camera, the following line force-updates the camera's matrix,
        //  and prevents rendering the very first frame in the old default camera position/orientation
        this.cameraControlsObject.updateMatrixWorld(true);
    }

    OnWindowResize()
    {
        this.SCREEN_WIDTH = window.innerWidth;
        this.SCREEN_HEIGHT = window.innerHeight;

        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.SCREEN_WIDTH, this.SCREEN_HEIGHT);

        let fontAspect = (this.SCREEN_WIDTH / 175) * (this.SCREEN_HEIGHT / 200);
        if (fontAspect > 25) fontAspect = 25;
        if (fontAspect < 4) fontAspect = 4;
        fontAspect *= 2;

        this.pathTracingUniforms.uResolution.value.x = this.renderer.context.drawingBufferWidth;
        this.pathTracingUniforms.uResolution.value.y = this.renderer.context.drawingBufferHeight;

        this.pathTracingRenderTarget.setSize(this.renderer.context.drawingBufferWidth, this.renderer.context.drawingBufferHeight);
        this.screenTextureRenderTarget.setSize(this.renderer.context.drawingBufferWidth, this.renderer.context.drawingBufferHeight);

        this.worldCamera.aspect = this.renderer.domElement.clientWidth / this.renderer.domElement.clientHeight;
        this.worldCamera.updateProjectionMatrix();

        // the following scales all scene objects by the worldCamera's field of view,
        // taking into account the screen aspect ratio and multiplying the uniform uULen,
        // the x-coordinate, by this ratio
        let fovScale = this.worldCamera.fov * 0.5 * (Math.PI / 180.0);
        this.pathTracingUniforms.uVLen.value = Math.tan(fovScale);
        this.pathTracingUniforms.uULen.value = this.pathTracingUniforms.uVLen.value * this.worldCamera.aspect;
    }

    RenderCycle = () =>
    {
        requestAnimationFrame(this.RenderCycle);
        this.Render();
        // this.Render();
        // this.Render();
        // this.Render();
    }

    Render()
    {
        if (this.Disabled) return;
        if (this.controls.mouseDown)
            this.sampleCounter = 1;

        this.pathTracingUniforms.uCameraIsMoving.value = this.controls.mouseDown;
        this.pathTracingUniforms.uCameraJustStartedMoving.value = this.controls.mouseDown && !this.controls.mouseMove;
        this.pathTracingUniforms.uSampleCounter.value = this.sampleCounter;
        this.pathTracingUniforms.uRandomVector.value.set(Math.random(), Math.random(), Math.random());
        // CAMERA
        this.cameraControlsObject.updateMatrixWorld(true);
        this.pathTracingUniforms.uCameraMatrix.value.copy(this.worldCamera.matrixWorld);
        this.screenOutputMaterial.uniforms.uOneOverSampleCounter.value = 1.0 / this.sampleCounter;

        let cameraInfoElement = document.getElementById('cameraInfo');
        // cameraInfoElement.innerHTML = "FOV: " + this.worldCamera.fov + " / Aperture: " + apertureSize.toFixed(2) + " / FocusDistance: " + focusDistance + "<br>" + "Samples: " + sampleCounter;

        this.sampleCounter++;
        cameraInfoElement.innerHTML = this.sampleCounter.toString();

        // RENDERING in 3 steps

        // STEP 1
        // Perform PathTracing and Render(save) into pathTracingRenderTarget
        // Read previous screenTextureRenderTarget to use as a new starting point to blend with
        //执行PathTracing并渲染（保存）到pathTracingRenderTarget中
        //读取前一个screenTextureRenderTarget作为一个新的起点与之交融
        this.renderer.render(this.pathTracingScene, this.worldCamera, this.pathTracingRenderTarget);

        // STEP 2
        // Render(copy) the final pathTracingScene output(above) into screenTextureRenderTarget
        // This will be used as a new starting point for Step 1 above
        //将最终的pathTracingScene输出（上面）渲染（复制）到screenTextureRenderTarget中
        //这将作为上面第1步的新起点
        this.renderer.render(this.screenTextureScene, this.quadCamera, this.screenTextureRenderTarget);

        // STEP 3
        // Render full screen quad with generated pathTracingRenderTarget in STEP 1 above.
        // After the image is gamma corrected, it will be shown on the screen as the final accumulated output
        //在上面的步骤1中使用生成的pathTracingRenderTarget渲染全屏四元组。
        //图像经过伽马校正后，它将在屏幕上显示为最终累计输出
        this.renderer.render(this.screenOutputScene, this.quadCamera);
    }
}



