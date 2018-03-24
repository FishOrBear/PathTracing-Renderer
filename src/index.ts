import * as THREE from 'three';

import { FirstPersonCameraControls } from './FirstPersonCameraControls';
import { screenTextureShader, screenOutputShader } from './pathTracingCommon';
import { Vector3 } from 'three';

let SCREEN_WIDTH: number;
let SCREEN_HEIGHT: number;
let container: HTMLElement;
let stats: any;
let pathTracingScene: any;
let screenTextureScene: any;
let screenOutputScene: any;
let pathTracingUniforms: any;
let screenTextureUniforms: any;
let screenOutputUniforms: any;
let pathTracingDefines: any;
let pathTracingGeometry: any;
let pathTracingMaterial: any;
let pathTracingMesh: any;
let screenTextureGeometry: any;
let screenTextureMaterial: any;
let screenTextureMesh: any;
let screenOutputGeometry: any;
let screenOutputMaterial: any;
let screenOutputMesh: any;
let tallBoxGeometry: any;
let tallBoxMaterial: any;
let tallBoxMesh: any;
let shortBoxGeometry: any;
let shortBoxMaterial: any;
let shortBoxMesh;
let pathTracingRenderTarget: THREE.WebGLRenderTarget;
let screenOutputRenderTarget: THREE.WebGLRenderTarget;
let quadCamera: any;
let worldCamera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let clock: any;
let frameTime: any;
let elapsedTime: any;
let fovScale: any;
let increaseFOV = false;
let decreaseFOV = false;
let apertureSize = 0.0;
let increaseAperture = false;
let decreaseAperture = false;
let focusDistance = 1180.0;
let increaseFocusDist = false;
let decreaseFocusDist = false;
let pixelRatio = 0.5;
const TWO_PI = Math.PI * 2;
const randomVector = new THREE.Vector3();
let sampleCounter = 1.0;
let cameraIsMoving = false;
let cameraJustStartedMoving = false;
let cameraRecentlyMoving = false;
let isPaused = true;
let oldYawRotation;
let oldPitchRotation;
let mobileJoystickControls = null;
let oldDeltaX = 0;
let oldDeltaY = 0;
let newDeltaX = 0;
let newDeltaY = 0;
let mobileControlsMoveX = 0;
let mobileControlsMoveY = 0;
let stillFlagX = true;
let stillFlagY = true;
let oldPinchWidthX = 0;
let oldPinchWidthY = 0;
let pinchDeltaX = 0;
let pinchDeltaY = 0;
const camFlightSpeed = 300;
let fontAspect: any;

var controls: FirstPersonCameraControls

let screenTextureRenderTarget: any;

// the following variables will be used to calculate rotations and directions from the camera
const cameraDirectionVector = new THREE.Vector3();//for moving where the camera is looking
const cameraRightVector = new THREE.Vector3();//for strafing the camera right and left
const cameraUpVector = new THREE.Vector3();//for moving camera up and down
const cameraWorldQuaternion = new THREE.Quaternion();//for rotating scene objects to match camera's current rotation
let cameraControlsObject;//for positioning and moving the camera itself
let cameraControlsYawObject;//allows access to control camera's left/right movements through mobile input
let cameraControlsPitchObject;//allows access to control camera's up/down movements through mobile input
const PI_2 = Math.PI / 2;//used by controls below

const infoElement = document.getElementById('info');
infoElement.style.cursor = "default";
infoElement.style.webkitUserSelect = "none";
infoElement.style.msUserSelect = "none";


const cameraInfoElement = document.getElementById('cameraInfo');
cameraInfoElement.style.cursor = "default";
cameraInfoElement.style.webkitUserSelect = "none";
cameraInfoElement.style.msUserSelect = "none";

let mouseControl = true;

function onMouseWheel(event)
{
    event.preventDefault();
    event.stopPropagation();
    if (event.deltaY > 0)
    {

        increaseFOV = true;

    } else if (event.deltaY < 0)
    {

        decreaseFOV = true;

    }
}


init();


// function init( meshes ) {
function init()
{

    if ('createTouch' in document)
    {
        mouseControl = false;
        pixelRatio = 0.5;
        mobileJoystickControls = new mobileJoystickControls({
            //showJoystick: true,
            enableMultiTouch: true
        });
    }
    // if on mobile device, unpause the app because there is no ESC key and no mouse capture to do
    if (!mouseControl)
        isPaused = false;
    if (mouseControl)
    {
        window.addEventListener('wheel', onMouseWheel, false);
        document.body.addEventListener("click", function ()
        {
            this.requestPointerLock = this.requestPointerLock;
            this.requestPointerLock();
        }, false);
        window.addEventListener("click", event =>
        {
            event.preventDefault();
        }, false);
        window.addEventListener("dblclick", event =>
        {
            event.preventDefault();
        }, false);
        const pointerlockChange = event =>
        {
            if (document.pointerLockElement === document.body)
            {
                isPaused = false;
            } else
            {
                isPaused = true;
            }
        };
        // Hook pointer lock state change events
        document.addEventListener('pointerlockchange', pointerlockChange, false);
        document.addEventListener('mozpointerlockchange', pointerlockChange, false);
        document.addEventListener('webkitpointerlockchange', pointerlockChange, false);
    }

    renderer = new THREE.WebGLRenderer(
    );

    renderer.setClearColor(0x000000, 1);

    renderer.autoClear = false;
    // 1 is full resolution, 0.5 is half, 0.25 is quarter, etc. (must be > than 0.0)
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.context.getExtension('OES_texture_float');

    container = document.getElementById('container');
    document.body.appendChild(renderer.domElement);

    // stats = new stats();
    // stats.domElement.style.position = 'absolute';
    // stats.domElement.style.top = '0px';
    // stats.domElement.style.cursor = "default";
    // stats.domElement.style.webkitUserSelect = "none";
    // stats.domElement.style.MozUserSelect = "none";
    // container.appendChild(stats.domElement);

    window.addEventListener('resize', onWindowResize, false);

    clock = new THREE.Clock();

    pathTracingScene = new THREE.Scene();
    screenTextureScene = new THREE.Scene();
    screenOutputScene = new THREE.Scene();

    // quadCamera is simply the camera to help render the full screen quad (2 triangles),
    // hence the name.  It is an Orthographic camera that sits facing the view plane, which serves as
    // the window into our 3d world. This camera will not move or rotate for the duration of the app.
    quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    screenTextureScene.add(quadCamera);
    screenOutputScene.add(quadCamera);

    // worldCamera is the dynamic camera 3d object that will be positioned, oriented and 
    // constantly updated inside the 3d scene.  Its view will ultimately get passed back to the 
    // stationary quadCamera, which renders the scene to a fullscreen quad (made up of 2 large triangles).
    worldCamera = new THREE.PerspectiveCamera(31, window.innerWidth / window.innerHeight, 1, 1000);
    pathTracingScene.add(worldCamera);

    controls = new FirstPersonCameraControls(worldCamera);

    cameraControlsObject = controls.getObject();
    cameraControlsYawObject = controls.getYawObject();
    cameraControlsPitchObject = controls.getPitchObject();

    pathTracingScene.add(cameraControlsObject);
    // for flyCam
    cameraControlsObject.position.set(278, 270, 1050);
    ///cameraControlsYawObject.rotation.y = 0.0;
    // look slightly upward
    cameraControlsPitchObject.rotation.x = 0.005;

    oldYawRotation = cameraControlsYawObject.rotation.y;
    oldPitchRotation = cameraControlsPitchObject.rotation.x;

    // now that we moved and rotated the camera, the following line force-updates the camera's matrix,
    //  and prevents rendering the very first frame in the old default camera position/orientation
    cameraControlsObject.updateMatrixWorld(true);

    pathTracingRenderTarget = new THREE.WebGLRenderTarget((window.innerWidth * pixelRatio), (window.innerHeight * pixelRatio), {
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBAFormat,
        type: THREE.FloatType,
        depthBuffer: false,
        stencilBuffer: false
    });
    pathTracingRenderTarget.texture.generateMipmaps = false;

    screenTextureRenderTarget = new THREE.WebGLRenderTarget((window.innerWidth * pixelRatio), (window.innerHeight * pixelRatio), {
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBAFormat,
        type: THREE.FloatType,
        depthBuffer: false,
        stencilBuffer: false
    });
    screenTextureRenderTarget.texture.generateMipmaps = false;


    pathTracingGeometry = new THREE.PlaneBufferGeometry(2, 2);

    let uMouse = new Vector3();
    window["uMouse"] = uMouse;
    pathTracingUniforms = {

        tPreviousTexture: { type: "t", value: screenTextureRenderTarget.texture },
        //tTriangleTexture: { type: "t", value: triangleDataTexture },

        uCameraIsMoving: { type: "b1", value: false },
        uCameraJustStartedMoving: { type: "b1", value: false },
        uTime: { type: "f", value: 0.0 },
        uSampleCounter: { type: "f", value: 0.0 },
        uMouse: { type: "v3", value: uMouse },
        uULen: { type: "f", value: 1.0 },
        uVLen: { type: "f", value: 1.0 },
        uApertureSize: { type: "f", value: 0.0 },
        uFocusDistance: { type: "f", value: 1180.0 },

        uResolution: { type: "v2", value: new THREE.Vector2(renderer.context.drawingBufferWidth, renderer.context.drawingBufferHeight) },

        //uMeshBBox_min: { type: "v3", value: objMeshes.my_mesh.bounding_box_min },
        //uMeshBBox_max: { type: "v3", value: objMeshes.my_mesh.bounding_box_max },
        uRandomVector: { type: "v3", value: new THREE.Vector3() },

        uCameraMatrix: { type: "m4", value: new THREE.Matrix4() },

        uShortBoxInvMatrix: { type: "m4", value: new THREE.Matrix4() },
        uShortBoxNormalMatrix: { type: "m3", value: new THREE.Matrix3() },

        uTallBoxInvMatrix: { type: "m4", value: new THREE.Matrix4() },
        uTallBoxNormalMatrix: { type: "m3", value: new THREE.Matrix3() }

    };

    window["pathUniforms"] = pathTracingUniforms;

    pathTracingMaterial = new THREE.ShaderMaterial({
        uniforms: pathTracingUniforms,
        //defines: pathTracingDefines,
        vertexShader: require('./glsl/pathTracingVertexShader.glsl'),
        fragmentShader: require('./glsl/pathTracingFragmentShader.glsl'),
        depthTest: false,
        depthWrite: false
    });
    pathTracingMesh = new THREE.Mesh(pathTracingGeometry, pathTracingMaterial);
    pathTracingScene.add(pathTracingMesh);



    // the following keeps the large scene ShaderMaterial quad right in front 
    //   of the camera at all times. This is necessary because without it, the scene 
    //   quad will fall out of view and get clipped when the camera rotates past 180 degrees.
    worldCamera.add(pathTracingMesh);



    screenTextureGeometry = new THREE.PlaneBufferGeometry(2, 2);

    screenTextureMaterial = new THREE.ShaderMaterial({
        uniforms: screenTextureShader.uniforms,
        vertexShader: screenTextureShader.vertexShader,
        fragmentShader: screenTextureShader.fragmentShader,
        depthWrite: false,
        depthTest: false
    });

    screenTextureMaterial.uniforms.tTexture0.value = pathTracingRenderTarget.texture;

    screenTextureMesh = new THREE.Mesh(screenTextureGeometry, screenTextureMaterial);

    screenTextureScene.add(screenTextureMesh);



    screenOutputGeometry = new THREE.PlaneBufferGeometry(2, 2);

    screenOutputMaterial = new THREE.ShaderMaterial({
        uniforms: screenOutputShader.uniforms,
        vertexShader: screenOutputShader.vertexShader,
        fragmentShader: screenOutputShader.fragmentShader,
        depthWrite: false,
        depthTest: false
    });

    screenOutputMaterial.uniforms.tTexture0.value = pathTracingRenderTarget.texture;

    screenOutputMesh = new THREE.Mesh(screenOutputGeometry, screenOutputMaterial);
    screenOutputScene.add(screenOutputMesh);

    // Boxes
    tallBoxMesh = new THREE.Object3D();
    pathTracingScene.add(tallBoxMesh);
    tallBoxMesh.rotation.set(0, Math.PI * 0.1, 0);
    tallBoxMesh.position.set(180, 170, -350);
    tallBoxMesh.updateMatrixWorld(true); // 'true' forces immediate matrix update

    pathTracingUniforms.uTallBoxInvMatrix.value.getInverse(tallBoxMesh.matrixWorld);
    pathTracingUniforms.uTallBoxNormalMatrix.value.getNormalMatrix(tallBoxMesh.matrixWorld);


    shortBoxMesh = new THREE.Object3D();
    pathTracingScene.add(shortBoxMesh);
    shortBoxMesh.rotation.set(0, -Math.PI * 0.09, 0);
    shortBoxMesh.position.set(370, 85, -170);
    shortBoxMesh.updateMatrixWorld(true); // 'true' forces immediate matrix update

    pathTracingUniforms.uShortBoxInvMatrix.value.getInverse(shortBoxMesh.matrixWorld);
    pathTracingUniforms.uShortBoxNormalMatrix.value.getNormalMatrix(shortBoxMesh.matrixWorld);

    // onWindowResize() must be at the end of the init() function
    onWindowResize();

    // everything is set up, now we can start animating
    animate();

} // end function init()



function onWindowResize()
{

    SCREEN_WIDTH = window.innerWidth;
    SCREEN_HEIGHT = window.innerHeight;

    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);

    fontAspect = (SCREEN_WIDTH / 175) * (SCREEN_HEIGHT / 200);
    if (fontAspect > 25) fontAspect = 25;
    if (fontAspect < 4) fontAspect = 4;
    fontAspect *= 2;

    pathTracingUniforms.uResolution.value.x = renderer.context.drawingBufferWidth;
    pathTracingUniforms.uResolution.value.y = renderer.context.drawingBufferHeight;

    pathTracingRenderTarget.setSize(renderer.context.drawingBufferWidth, renderer.context.drawingBufferHeight);
    screenTextureRenderTarget.setSize(renderer.context.drawingBufferWidth, renderer.context.drawingBufferHeight);

    worldCamera.aspect = renderer.domElement.clientWidth / renderer.domElement.clientHeight;
    worldCamera.updateProjectionMatrix();

    // the following scales all scene objects by the worldCamera's field of view,
    // taking into account the screen aspect ratio and multiplying the uniform uULen,
    // the x-coordinate, by this ratio
    fovScale = worldCamera.fov * 0.5 * (Math.PI / 180.0);
    pathTracingUniforms.uVLen.value = Math.tan(fovScale);
    pathTracingUniforms.uULen.value = pathTracingUniforms.uVLen.value * worldCamera.aspect;

} // end function onWindowResize( event )



function animate()
{

    requestAnimationFrame(animate);

    frameTime = clock.getDelta();

    //elapsedTime = clock.getElapsedTime() % 1000;

    // reset flags
    cameraIsMoving = false;
    cameraJustStartedMoving = false;

    // check user controls
    if (mouseControl)
    {
        // movement detected
        if (oldYawRotation != cameraControlsYawObject.rotation.y ||
            oldPitchRotation != cameraControlsPitchObject.rotation.x)
        {

            cameraIsMoving = true;
        }

        // save state for next frame
        oldYawRotation = cameraControlsYawObject.rotation.y;
        oldPitchRotation = cameraControlsPitchObject.rotation.x;

    } // end if (mouseControl)


    // this gives us a vector in the direction that the camera is pointing,
    // which will be useful for moving the camera 'forward' and shooting projectiles in that direction
    controls.getDirection(cameraDirectionVector);
    cameraDirectionVector.normalize();
    controls.getUpVector(cameraUpVector);
    controls.getRightVector(cameraRightVector);
    // the following gives us a rotation quaternion (4D vector), which will be useful for 
    // rotating scene objects to match the camera's rotation
    worldCamera.getWorldQuaternion(cameraWorldQuaternion);

    if (increaseFOV)
    {
        worldCamera.fov++;
        if (worldCamera.fov > 150)
            worldCamera.fov = 150;
        fovScale = worldCamera.fov * 0.5 * (Math.PI / 180.0);
        pathTracingUniforms.uVLen.value = Math.tan(fovScale);
        pathTracingUniforms.uULen.value = pathTracingUniforms.uVLen.value * worldCamera.aspect;

        cameraIsMoving = true;
        increaseFOV = false;
    }
    if (decreaseFOV)
    {
        worldCamera.fov--;
        if (worldCamera.fov < 1)
            worldCamera.fov = 1;
        fovScale = worldCamera.fov * 0.5 * (Math.PI / 180.0);
        pathTracingUniforms.uVLen.value = Math.tan(fovScale);
        pathTracingUniforms.uULen.value = pathTracingUniforms.uVLen.value * worldCamera.aspect;

        cameraIsMoving = true;
        decreaseFOV = false;
    }

    if (increaseFocusDist)
    {
        focusDistance += 2;
        pathTracingUniforms.uFocusDistance.value = focusDistance;
        cameraIsMoving = true;
        increaseFocusDist = false;
    }
    if (decreaseFocusDist)
    {
        focusDistance -= 2;
        if (focusDistance < 2)
            focusDistance = 2;
        pathTracingUniforms.uFocusDistance.value = focusDistance;
        cameraIsMoving = true;
        decreaseFocusDist = false;
    }

    if (increaseAperture)
    {
        apertureSize += 1.0;
        if (apertureSize > 200.0)
            apertureSize = 200.0;
        pathTracingUniforms.uApertureSize.value = apertureSize;
        cameraIsMoving = true;
        increaseAperture = false;
    }
    if (decreaseAperture)
    {
        apertureSize -= 1.0;
        if (apertureSize < 0.0)
            apertureSize = 0.0;
        pathTracingUniforms.uApertureSize.value = apertureSize;
        cameraIsMoving = true;
        decreaseAperture = false;
    }


    if (cameraIsMoving)
    {

        sampleCounter = 1.0;

        if (!cameraRecentlyMoving)
        {
            cameraJustStartedMoving = true;
            cameraRecentlyMoving = true;
        }

    }

    if (!cameraIsMoving)
    {

        sampleCounter += 1.0;
        cameraRecentlyMoving = false;

    }


    pathTracingUniforms.uCameraIsMoving.value = cameraIsMoving;
    pathTracingUniforms.uCameraJustStartedMoving.value = cameraJustStartedMoving;
    pathTracingUniforms.uSampleCounter.value = sampleCounter;
    pathTracingUniforms.uRandomVector.value = randomVector.set(Math.random(), Math.random(), Math.random());
    // CAMERA
    cameraControlsObject.updateMatrixWorld(true);
    pathTracingUniforms.uCameraMatrix.value.copy(worldCamera.matrixWorld);
    screenOutputMaterial.uniforms.uOneOverSampleCounter.value = 1.0 / sampleCounter;

    cameraInfoElement.innerHTML = "FOV: " + worldCamera.fov + " / Aperture: " + apertureSize.toFixed(2) + " / FocusDistance: " + focusDistance + "<br>" + "Samples: " + sampleCounter;


    // RENDERING in 3 steps

    // STEP 1
    // Perform PathTracing and Render(save) into pathTracingRenderTarget
    // Read previous screenTextureRenderTarget to use as a new starting point to blend with
    //执行PathTracing并渲染（保存）到pathTracingRenderTarget中
    //读取前一个screenTextureRenderTarget作为一个新的起点与之交融
    renderer.render(pathTracingScene, worldCamera, pathTracingRenderTarget);

    // STEP 2
    // Render(copy) the final pathTracingScene output(above) into screenTextureRenderTarget
    // This will be used as a new starting point for Step 1 above
    //将最终的pathTracingScene输出（上面）渲染（复制）到screenTextureRenderTarget中
    //这将作为上面第1步的新起点
    renderer.render(screenTextureScene, quadCamera, screenTextureRenderTarget);

    // STEP 3
    // Render full screen quad with generated pathTracingRenderTarget in STEP 1 above.
    // After the image is gamma corrected, it will be shown on the screen as the final accumulated output
    //在上面的步骤1中使用生成的pathTracingRenderTarget渲染全屏四元组。
    //图像经过伽马校正后，它将在屏幕上显示为最终累计输出
    renderer.render(screenOutputScene, quadCamera);


    // stats.update();


} // end function animate()
