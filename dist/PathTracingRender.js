/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 1);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = (__webpack_require__(3))(1);

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const PathTracingRenderer_1 = __webpack_require__(2);
const Dat = __webpack_require__(8);
let render = new PathTracingRenderer_1.PathTracingRenderer();
let path = render.LoadDefaultMaterial(__webpack_require__(9));
let mis = render.LoadDefaultMaterial(__webpack_require__(10));
render.pathTracingMesh.material = path;
render.RenderCycle();
let gui = new Dat.GUI({
    autoPlace: true,
    width: 300,
});
let data = {
    Path: () => {
        render.pathTracingMesh.material = path;
        render.sampleCounter = 1;
    },
    Mis: () => {
        render.pathTracingMesh.material = mis;
        render.sampleCounter = 1;
    },
    Stop: () => {
        render.Disabled = true;
    },
    Start: () => {
        render.Disabled = false;
    },
};
for (let key in data) {
    gui.add(data, key);
}


/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const three_1 = __webpack_require__(0);
const THREE = __webpack_require__(0);
const FirstPersonCameraControls_1 = __webpack_require__(4);
const pathTracingCommon_1 = __webpack_require__(5);
class PathTracingRenderer {
    constructor() {
        this.sampleCounter = 1;
        this.Disabled = false;
        this.RenderCycle = () => {
            requestAnimationFrame(this.RenderCycle);
            this.Render();
            // this.Render();
            // this.Render();
            // this.Render();
        };
        this.InitRender();
        this.InitScene();
        this.OnWindowResize();
    }
    InitRender() {
        this.renderer = new THREE.WebGLRenderer();
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
    InitScene() {
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
            uniforms: pathTracingCommon_1.screenTextureShader.uniforms,
            vertexShader: pathTracingCommon_1.screenTextureShader.vertexShader,
            fragmentShader: pathTracingCommon_1.screenTextureShader.fragmentShader,
            depthWrite: false,
            depthTest: false
        });
        screenTextureMaterial.uniforms.tTexture0.value = this.pathTracingRenderTarget.texture;
        this.screenTextureMesh = new THREE.Mesh(screenTextureGeometry, screenTextureMaterial);
        this.screenTextureScene.add(this.screenTextureMesh);
        let screenOutputGeometry = new THREE.PlaneBufferGeometry(2, 2);
        this.screenOutputMaterial = new THREE.ShaderMaterial({
            uniforms: pathTracingCommon_1.screenOutputShader.uniforms,
            vertexShader: pathTracingCommon_1.screenOutputShader.vertexShader,
            fragmentShader: pathTracingCommon_1.screenOutputShader.fragmentShader,
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
    LoadDefaultMaterial(fragmentShader) {
        return new THREE.ShaderMaterial({
            uniforms: this.pathTracingUniforms,
            //defines: pathTracingDefines,
            vertexShader: __webpack_require__(7),
            fragmentShader: fragmentShader,
            depthTest: false,
            depthWrite: false
        });
    }
    InitUniforms() {
        this.pathTracingUniforms = {
            tPreviousTexture: { type: "t", value: this.screenTextureRenderTarget.texture },
            //tTriangleTexture: { type: "t", value: triangleDataTexture },
            uCameraIsMoving: { type: "b1", value: false },
            uCameraJustStartedMoving: { type: "b1", value: false },
            uTime: { type: "f", value: 0.0 },
            uSampleCounter: { type: "f", value: 0.0 },
            uMouse: { type: "v3", value: new three_1.Vector3() },
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
    InitRenderTarget() {
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
    InitCamera() {
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
        this.controls = new FirstPersonCameraControls_1.FirstPersonCameraControls(this.worldCamera);
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
    OnWindowResize() {
        this.SCREEN_WIDTH = window.innerWidth;
        this.SCREEN_HEIGHT = window.innerHeight;
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.SCREEN_WIDTH, this.SCREEN_HEIGHT);
        let fontAspect = (this.SCREEN_WIDTH / 175) * (this.SCREEN_HEIGHT / 200);
        if (fontAspect > 25)
            fontAspect = 25;
        if (fontAspect < 4)
            fontAspect = 4;
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
    Render() {
        if (this.Disabled)
            return;
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
exports.PathTracingRenderer = PathTracingRenderer;


/***/ }),
/* 3 */
/***/ (function(module, exports) {

module.exports = dll;

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const THREE = __webpack_require__(0);
/**
 * originally from https://github.com/mrdoob/three.js/blob/dev/examples/js/controls/PointerLockControls.js
 * @author mrdoob / http://mrdoob.com/
 *
 * edited by Erich Loftis (erichlof on GitHub)
 * https://github.com/erichlof
 * Btw, this is the most consice and elegant way to implement first person camera rotation/movement that I've ever seen -
 * look at how short it is, without spaces/braces it would be around 30 lines!  Way to go, mrdoob!
 */
let PI_2 = Math.PI / 2;
class FirstPersonCameraControls {
    constructor(camera) {
        this.mouseMove = false;
        this.mouseDown = false;
        this.camera = camera;
        camera.rotation.set(0, 0, 0);
        this.pitchObject = new THREE.Object3D();
        this.pitchObject.add(camera);
        this.yawObject = new THREE.Object3D();
        this.yawObject.add(this.pitchObject);
        const scope = this;
        let movementX = 0;
        let movementY = 0;
        const onMouseDown = (event) => {
            if (event.button == 0)
                this.mouseDown = true;
        };
        const onMouseUp = (event) => {
            if (event.button == 0) {
                this.mouseDown = false;
                this.mouseMove = false;
            }
        };
        const onMouseMove = event => {
            if (!this.mouseDown)
                return;
            this.mouseMove = true;
            movementX = event.movementX || event.mozMovementX || 0;
            movementY = event.movementY || event.mozMovementY || 0;
            scope.yawObject.rotation.y -= movementX * 0.002;
            scope.pitchObject.rotation.x -= movementY * 0.002;
            scope.pitchObject.rotation.x = Math.max(-PI_2, Math.min(PI_2, scope.pitchObject.rotation.x));
        };
        let container = document.getElementById("container");
        container.addEventListener("mousedown", onMouseDown);
        container.addEventListener("mouseup", onMouseUp);
        container.addEventListener('mousemove', onMouseMove, false);
    }
    getObject() { return this.yawObject; }
    ;
    getYawObject() { return this.yawObject; }
    getPitchObject() { return this.pitchObject; }
    getDirection(v) {
        const te = this.camera.matrixWorld.elements;
        v.set(te[8], te[9], te[10]).negate();
        return v;
    }
    ;
    getUpVector(v) {
        const te = this.camera.matrixWorld.elements;
        v.set(te[4], te[5], te[6]);
        return v;
    }
    ;
    getRightVector(v) {
        const te = this.camera.matrixWorld.elements;
        v.set(te[0], te[1], te[2]);
        return v;
    }
    ;
}
exports.FirstPersonCameraControls = FirstPersonCameraControls;
;


/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const THREE = __webpack_require__(0);
exports.screenTextureShader = {
    uniforms: THREE.UniformsUtils.merge([
        {
            tTexture0: { type: "t", value: null }
        }
    ]),
    vertexShader: [
        'precision highp float;',
        'precision highp int;',
        'varying vec2 vUv;',
        'void main()',
        '{',
        'vUv = uv;',
        'gl_Position = vec4( position, 1.0 );',
        '}'
    ].join('\n'),
    fragmentShader: [
        'precision highp float;',
        'precision highp int;',
        'precision highp sampler2D;',
        'varying vec2 vUv;',
        'uniform sampler2D tTexture0;',
        'void main()',
        '{',
        'gl_FragColor = texture2D(tTexture0, vUv);',
        '}'
    ].join('\n')
};
exports.screenOutputShader = {
    uniforms: THREE.UniformsUtils.merge([
        {
            uOneOverSampleCounter: { type: "f", value: 0.0 },
            tTexture0: { type: "t", value: null }
        }
    ]),
    vertexShader: [
        'precision highp float;',
        'precision highp int;',
        'varying vec2 vUv;',
        'void main()',
        '{',
        'vUv = uv;',
        'gl_Position = vec4( position, 1.0 );',
        '}'
    ].join('\n'),
    fragmentShader: [
        'precision highp float;',
        'precision highp int;',
        'precision highp sampler2D;',
        'varying vec2 vUv;',
        'uniform float uOneOverSampleCounter;',
        'uniform sampler2D tTexture0;',
        'void main()',
        '{',
        'vec4 col = texture2D(tTexture0, vUv) * uOneOverSampleCounter;',
        'gl_FragColor = sqrt(col);',
        '}'
    ].join('\n')
};
//#region pathtracing_uniforms_and_defines
THREE.ShaderChunk['pathtracing_uniforms_and_defines'] = `
uniform bool uCameraIsMoving;
uniform bool uCameraJustStartedMoving;
uniform float uTime;
uniform float uSampleCounter;
uniform float uULen;
uniform float uVLen;
uniform float uApertureSize;
uniform float uFocusDistance;
uniform vec2 uResolution;
uniform vec3 uMouse;
uniform vec3 uRandomVector;
uniform mat4 uCameraMatrix;
uniform sampler2D tPreviousTexture;
varying vec2 vUv;
#define PI               3.14159265358979323
#define TWO_PI           6.28318530717958648
#define FOUR_PI          12.5663706143591729
#define ONE_OVER_PI      0.31830988618379067
#define ONE_OVER_TWO_PI  0.15915494309
#define ONE_OVER_FOUR_PI 0.07957747154594767
#define PI_OVER_TWO      1.57079632679489662
#define ONE_OVER_THREE   0.33333333333333333
#define E                2.71828182845904524
#define INFINITY         1000000.0
#define LIGHT 0
#define DIFF 1
#define REFR 2
#define SPEC 3
#define CHECK 4
#define COAT 5
#define VOLUME 6
#define TRANSLUCENT 7
#define SPECSUB 8
#define WATER 9
#define WOOD 10
#define SEAFLOOR 11
#define TERRAIN 12
#define CLOTH 13
#define LIGHTWOOD 14
#define DARKWOOD 15
#define PAINTING 16
`;
//#endregion
//#endregion
//#region pathtracing_uniforms_and_defines
THREE.ShaderChunk['pathtracing_skymodel_defines'] = `
#define TURBIDITY 0.3
#define RAYLEIGH_COEFFICIENT 2.0
#define MIE_COEFFICIENT 0.05
#define MIE_DIRECTIONAL_G 0.76
// constants for atmospheric scattering
#define THREE_OVER_SIXTEENPI 0.05968310365946075
#define ONE_OVER_FOURPI 0.07957747154594767
// wavelength of used primaries, according to preetham
#define LAMBDA vec3( 680E-9, 550E-9, 450E-9 )
#define TOTAL_RAYLEIGH vec3( 5.804542996261093E-6, 1.3562911419845635E-5, 3.0265902468824876E-5 )
// mie stuff
// K coefficient for the primaries
#define K vec3(0.686, 0.678, 0.666)
#define MIE_V 4.0
#define MIE_CONST vec3( 1.8399918514433978E14, 2.7798023919660528E14, 4.0790479543861094E14 )
// optical length at zenith for molecules
#define RAYLEIGH_ZENITH_LENGTH 8400.0
#define MIE_ZENITH_LENGTH 1250.0
#define UP_VECTOR vec3(0.0, 1.0, 0.0)
#define SUN_INTENSITY 20.0 //800.0 if Uncharted2ToneMap is used
#define SUN_ANGULAR_DIAMETER_COS 0.99983194915 // 66 arc seconds -> degrees, and the cosine of that
#define CUTOFF_ANGLE 1.66 // original value (PI / 1.9) 
`;
//#endregion
//#region pathtracing_plane_intersect
THREE.ShaderChunk['pathtracing_plane_intersect'] = `
//-----------------------------------------------------------------------
float PlaneIntersect( vec4 pla, Ray r )
//-----------------------------------------------------------------------
{
	vec3 n = normalize(pla.xyz);
	float denom = dot(n, r.direction);
	// uncomment the following if single-sided plane is desired
	//if (denom >= 0.0) 
	//	return INFINITY;
	
        vec3 pOrO = (pla.w * n) - r.origin; 
        float result = dot(pOrO, n) / denom;
	return (result > 0.0) ? result : INFINITY;
}
`;
//#endregion
//#region pathtracing_disk_intersect
THREE.ShaderChunk['pathtracing_disk_intersect'] = `
//-----------------------------------------------------------------------
float DiskIntersect( vec3 diskPos, vec3 normal, float radius, Ray r )
//-----------------------------------------------------------------------
{
	vec3 n = normalize(-normal);
	vec3 pOrO = diskPos - r.origin;
	float denom = dot(n, r.direction);
	// use the following for one-sided disk
	//if (denom <= 0.0)
	//	return INFINITY;
	
        float result = dot(pOrO, n) / denom;
	if (result < 0.0)
		return INFINITY;
        vec3 intersectPos = r.origin + r.direction * result;
	vec3 v = intersectPos - diskPos;
	float d2 = dot(v,v);
	float radiusSq = radius * radius;
	if (d2 > radiusSq)
		return INFINITY;
		
	return result;
}
`;
//#endregion
//#region pathtracing_sphere_intersect
THREE.ShaderChunk['pathtracing_sphere_intersect'] = `
/*
bool solveQuadratic(float A, float B, float C, out float t0, out float t1)
{
	float discrim = B*B-4.0*A*C;
    	
	if ( discrim < 0.0 )
        	return false;
	
    	float A2 = 2.0 * A;
	float rootDiscrim = sqrt( discrim );
    
	float t_0 = (-B-rootDiscrim)/A2;
	float t_1 = (-B+rootDiscrim)/A2;
	t0 = min( t_0, t_1 );
	t1 = max( t_0, t_1 );
    
	return true;
}
*/
bool solveQuadratic(float A, float B, float C, out float t0, out float t1)
{
	float discrim = B*B-4.0*A*C;
    
	if ( discrim < 0.0 )
        	return false;
    
	float rootDiscrim = sqrt( discrim );
	float Q = (B > 0.0) ? -0.5 * (B + rootDiscrim) : -0.5 * (B - rootDiscrim); 
	float t_0 = Q / A; 
	float t_1 = C / Q;
	
	t0 = min( t_0, t_1 );
	t1 = max( t_0, t_1 );
    
	return true;
}
//-----------------------------------------------------------------------
float SphereIntersect( float rad, vec3 pos, Ray ray )
//-----------------------------------------------------------------------
{
	float t = INFINITY;
	float t0, t1;
	vec3 L = ray.origin - pos;
	float a = dot( ray.direction, ray.direction );
	float b = 2.0 * dot( ray.direction, L );
	float c = dot( L, L ) - (rad * rad);
	if (!solveQuadratic( a, b, c, t0, t1))
		return INFINITY;
	
	if ( t1 > 0.0 )
		t = t1;
		
	if ( t0 > 0.0 )
		t = t0;
	
	return t;
}
`;
//#endregion
//#region pathtracing_ellipsoid_intersect
THREE.ShaderChunk['pathtracing_ellipsoid_intersect'] = `
//-----------------------------------------------------------------------
float EllipsoidIntersect( vec3 radii, vec3 pos, Ray r )
//-----------------------------------------------------------------------
{
	float t = INFINITY;
	float t0, t1;
	vec3 oc = r.origin - pos;
	vec3 oc2 = oc*oc;
	vec3 ocrd = oc*r.direction;
	vec3 rd2 = r.direction*r.direction;
	vec3 invRad = 1.0/radii;
	vec3 invRad2 = invRad*invRad;
	
	// quadratic equation coefficients
	float a = dot(rd2, invRad2);
	float b = 2.0*dot(ocrd, invRad2);
	float c = dot(oc2, invRad2) - 1.0;
	if (!solveQuadratic( a, b, c, t0, t1))
		return INFINITY;
	
	if ( t1 > 0.0 )
		t = t1;
		
	if ( t0 > 0.0 )
		t = t0;
	
	return t;
}
`;
//#endregion
//#region pathtracing_opencylinder_intersect
THREE.ShaderChunk['pathtracing_opencylinder_intersect'] = `
//---------------------------------------------------------------------------
float OpenCylinderIntersect( vec3 p0, vec3 p1, float rad, Ray r, out vec3 n )
//---------------------------------------------------------------------------
{
	float r2=rad*rad;
	
	vec3 dp=p1-p0;
	vec3 dpt=dp/dot(dp,dp);
	
	vec3 ao=r.origin-p0;
	vec3 aoxab=cross(ao,dpt);
	vec3 vxab=cross(r.direction,dpt);
	float ab2=dot(dpt,dpt);
	float a=2.0*dot(vxab,vxab);
	float ra=1.0/a;
	float b=2.0*dot(vxab,aoxab);
	float c=dot(aoxab,aoxab)-r2*ab2;
	
	float det=b*b-2.0*a*c;
	
	if(det<0.0)
	return INFINITY;
	
	det=sqrt(det);
	
	float t = INFINITY;
	
	float t0=(-b-det)*ra;
	float t1=(-b+det)*ra;
	
	vec3 ip;
	vec3 lp;
	float ct;
	
	if (t1 > 0.0)
	{
		ip=r.origin+r.direction*t1;
		lp=ip-p0;
		ct=dot(lp,dpt);
		if((ct>0.0)&&(ct<1.0))
		{
			t = t1;
		     	n=(p0+dp*ct)-ip;
		}
		
	}
	
	if (t0 > 0.0)
	{
		ip=r.origin+r.direction*t0;
		lp=ip-p0;
		ct=dot(lp,dpt);
		if((ct>0.0)&&(ct<1.0))
		{
			t = t0;
			n=ip-(p0+dp*ct);
		}
		
	}
	
	return t;
}
`;
//#endregion
//#region pathtracing_cappedcylinder_intersect
THREE.ShaderChunk['pathtracing_cappedcylinder_intersect'] = `
//-----------------------------------------------------------------------------
float CappedCylinderIntersect( vec3 p0, vec3 p1, float rad, Ray r, out vec3 n )
//-----------------------------------------------------------------------------
{
	float r2=rad*rad;
	
	vec3 dp=p1-p0;
	vec3 dpt=dp/dot(dp,dp);
	
	vec3 ao=r.origin-p0;
	vec3 aoxab=cross(ao,dpt);
	vec3 vxab=cross(r.direction,dpt);
	float ab2=dot(dpt,dpt);
	float a=2.0*dot(vxab,vxab);
	float ra=1.0/a;
	float b=2.0*dot(vxab,aoxab);
	float c=dot(aoxab,aoxab)-r2*ab2;
	
	float det=b*b-2.0*a*c;
	
	if(det<0.0)
		return INFINITY;
	
	det=sqrt(det);
	
	float t0=(-b-det)*ra;
	float t1=(-b+det)*ra;
	
	vec3 ip;
	vec3 lp;
	float ct;
	float result = INFINITY;
	
	// Cylinder caps
	// disk0
	vec3 diskNormal = normalize(dp);
	float denom = dot(diskNormal, r.direction);
	vec3 pOrO = p0 - r.origin;
	float tDisk0 = dot(pOrO, diskNormal) / denom;
	if (tDisk0 > 0.0)
	{
		vec3 intersectPos = r.origin + r.direction * tDisk0;
		vec3 v = intersectPos - p0;
		float d2 = dot(v,v);
		if (d2 <= r2)
		{
			result = tDisk0;
			n = diskNormal;
		}
	}
	
	// disk1
	denom = dot(diskNormal, r.direction);
	pOrO = p1 - r.origin;
	float tDisk1 = dot(pOrO, diskNormal) / denom;
	if (tDisk1 > 0.0)
	{
		vec3 intersectPos = r.origin + r.direction * tDisk1;
		vec3 v = intersectPos - p1;
		float d2 = dot(v,v);
		if (d2 <= r2 && tDisk1 < result)
		{
			result = tDisk1;
			n = diskNormal;
		}
	}
	
	// Cylinder body
	if (t1 > 0.0)
	{
		ip=r.origin+r.direction*t1;
		lp=ip-p0;
		ct=dot(lp,dpt);
		if(ct>0.0 && ct<1.0 && t1<result)
		{
			result = t1;
		     	n=(p0+dp*ct)-ip;
		}
		
	}
	
	if (t0 > 0.0)
	{
		ip=r.origin+r.direction*t0;
		lp=ip-p0;
		ct=dot(lp,dpt);
		if(ct>0.0 && ct<1.0 && t0<result)
		{
			result = t0;
			n=ip-(p0+dp*ct);
		}
		
	}
	
	return result;
}
`;
//#endregion
//#region pathtracing_cone_intersect
THREE.ShaderChunk['pathtracing_cone_intersect'] = `
//----------------------------------------------------------------------------
float ConeIntersect( vec3 p0, float r0, vec3 p1, float r1, Ray r, out vec3 n )
//----------------------------------------------------------------------------   
{
	r0 += 0.1;
	float t = INFINITY;
	vec3 locX;
	vec3 locY;
	vec3 locZ=-(p1-p0)/(1.0 - r1/r0);
	
	Ray ray = r;
	ray.origin-=p0-locZ;
	
	if(abs(locZ.x)<abs(locZ.y))
		locX=vec3(1,0,0);
	else
		locX=vec3(0,1,0);
		
	float len=length(locZ);
	locZ=normalize(locZ)/len;
	locY=normalize(cross(locX,locZ))/r0;
	locX=normalize(cross(locY,locZ))/r0;
	
	mat3 tm;
	tm[0]=locX;
	tm[1]=locY;
	tm[2]=locZ;
	
	ray.direction*=tm;
	ray.origin*=tm;
	
	float dx=ray.direction.x;
	float dy=ray.direction.y;
	float dz=ray.direction.z;
	
	float x0=ray.origin.x;
	float y0=ray.origin.y;
	float z0=ray.origin.z;
	
	float x02=x0*x0;
	float y02=y0*y0;
	float z02=z0*z0;
	
	float dx2=dx*dx;
	float dy2=dy*dy;
	float dz2=dz*dz;
	
	float det=(
		-2.0*x0*dx*z0*dz
		+2.0*x0*dx*y0*dy
		-2.0*z0*dz*y0*dy
		+dz2*x02
		+dz2*y02
		+dx2*z02
		+dy2*z02
		-dy2*x02
		-dx2*y02
        );
	
	if(det<0.0)
		return INFINITY;
		
	float t0=(-x0*dx+z0*dz-y0*dy-sqrt(abs(det)))/(dx2-dz2+dy2);
	float t1=(-x0*dx+z0*dz-y0*dy+sqrt(abs(det)))/(dx2-dz2+dy2);
	vec3 pt0=ray.origin+t0*ray.direction;
	vec3 pt1=ray.origin+t1*ray.direction;
	
        if(t1>0.0 && pt1.z>r1/r0 && pt1.z<1.0)
	{
		t=t1;
		n=pt1;
		n.z=0.0;
		n=normalize(n);
		n.z=-pt1.z/abs(pt1.z);
		n=normalize(n);
		n=tm*-n;
	}
	
	if(t0>0.0 && pt0.z>r1/r0 && pt0.z<1.0)
	{
		t=t0;
		n=pt0;
		n.z=0.0;
		n=normalize(n);
		n.z=-pt0.z/abs(pt0.z);
		n=normalize(n);
		n=tm*n;
	}
	
	return t;	
}
`;
//#endregion
//#region pathtracing_capsule_intersect
THREE.ShaderChunk['pathtracing_capsule_intersect'] = `
//-------------------------------------------------------------------------------
float CapsuleIntersect( vec3 p0, float r0, vec3 p1, float r1, Ray r, out vec3 n )
//-------------------------------------------------------------------------------
{
	/*
	// used for ConeIntersect below, if different radius sphere end-caps are desired
	vec3 l  = p1-p0;
	float ld = length(l);
	l=l/ld;
	float d= r0-r1;
	float sa = d/ld;
	float h0 = r0*sa;
	float h1 = r1*sa;
	float cr0 = sqrt(r0*r0-h0*h0);
	float cr1 = sqrt(r1*r1-h1*h1);
	vec3 coneP0=p0+l*h0;
	vec3 coneP1=p1+l*h1;
	*/
	
	float t0=INFINITY;
	    
	float t1;
	vec3 uv1;
	vec3 n1;
	//t1 = ConeIntersect(coneP0,cr0,coneP1,cr1,r,n1);
	t1 = OpenCylinderIntersect(p0,p1,r0,r,n1);
	if(t1<t0)
	{
		t0=t1;
		n=n1;
	}
	t1 = SphereIntersect(r0,p0,r);
	if(t1<t0)
	{
		t0=t1;
		n=(r.origin + r.direction * t1) - p0;
	}
	t1 = SphereIntersect(r1,p1,r);
	if(t1<t0)
	{
		t0=t1;
		n=(r.origin + r.direction * t1) - p1;
	}
	    
	return t0;
}
`;
//#endregion
//#region pathtracing_paraboloid_intersect
THREE.ShaderChunk['pathtracing_paraboloid_intersect'] = `
//------------------------------------------------------------------------------
float ParaboloidIntersect( float rad, float height, vec3 pos, Ray r, out vec3 n )
//------------------------------------------------------------------------------
{
	vec3 rd = r.direction;
	vec3 ro = r.origin - pos;
	float k = height / (rad * rad);
	
	// quadratic equation coefficients
	float a = k * (rd.x * rd.x + rd.z * rd.z);
	float b = k * 2.0 * (rd.x * ro.x + rd.z * ro.z) - rd.y;
	float c = k * (ro.x * ro.x + ro.z * ro.z) - ro.y;
	float t0, t1;
	if (!solveQuadratic( a, b, c, t0, t1))
		return INFINITY;
	
	vec3 ip1, ip2;
	float result = INFINITY;
	
	if (t1 > 0.0)
	{	
		ip2 = ro + rd * t1;
		if (ip2.y < height)
		{
			n = vec3( -2.0 * ip2.x, 2.0 * ip2.y, -2.0 * ip2.z );
			result = t1;
		}		
	}
	
	if (t0 > 0.0)
	{
		ip1 = ro + rd * t0;
		if (ip1.y < height)
		{
			n = vec3( 2.0 * ip1.x, -2.0 * ip1.y, 2.0 * ip1.z );
			result = t0;
		}		
	}
	
	if( t0 > 0.0 && t1 > 0.0)
	{
		float dist1 = distance(ro,ip1);
		float dist2 = distance(ro,ip2);
		
		if (dist2 < dist1 && ip2.y < height)
		{
			n = vec3( -2.0 * ip2.x, 2.0 * ip2.y, -2.0 * ip2.z );
			result = t1;
		}	
		
		if (dist1 < dist2 && ip1.y < height)
		{
			n = vec3( 2.0 * ip1.x, -2.0 * ip1.y, 2.0 * ip1.z );
			result = t0;
		}			
	}
	
	return result;	
}
`;
//#endregion
//#region pathtracing_torus_intersect
THREE.ShaderChunk['pathtracing_torus_intersect'] = `
float map_Torus( in vec3 pos )
{
	return length( vec2(length(pos.xz)-torii[0].radius0,pos.y) )-torii[0].radius1;
}
vec3 calcNormal_Torus( in vec3 pos )
{
	// epsilon = a small number
	vec2 e = vec2(1.0,-1.0)*0.5773*0.0002;
	return normalize( e.xyy*map_Torus( pos + e.xyy ) + 
			  e.yyx*map_Torus( pos + e.yyx ) + 
			  e.yxy*map_Torus( pos + e.yxy ) + 
			  e.xxx*map_Torus( pos + e.xxx ) );
}
/* 
Thanks to koiava for the ray marching strategy! https://www.shadertoy.com/user/koiava 
*/
float TorusIntersect( float rad0, float rad1, Ray r )
{	
	vec3 n;
	float d = CappedCylinderIntersect( vec3(0,rad1,0), vec3(0,-rad1,0), rad0+rad1, r, n );
	if (d == INFINITY)
		return INFINITY;
	
	vec3 pos = r.origin;
	float t = 0.0;
	float torusFar = d + (rad0 * 2.0) + (rad1 * 2.0);
	for (int i = 0; i < 200; i++)
	{
		d = map_Torus(pos);
		if (d < 0.001 || t > torusFar) break;
		pos += r.direction * d;
		t += d;
	}
	
	return (d<0.001) ? t : INFINITY;
}
/*
// borrowed from iq: https://www.shadertoy.com/view/4sBGDy
//-----------------------------------------------------------------------
float TorusIntersect( float rad0, float rad1, vec3 pos, Ray ray )
//-----------------------------------------------------------------------
{
	vec3 rO = ray.origin - pos;
	vec3 rD = ray.direction;
	
	float Ra2 = rad0*rad0;
	float ra2 = rad1*rad1;
	
	float m = dot(rO,rO);
	float n = dot(rO,rD);
		
	float k = (m - ra2 - Ra2) * 0.5;
	float a = n;
	float b = n*n + Ra2*rD.z*rD.z + k;
	float c = k*n + Ra2*rO.z*rD.z;
	float d = k*k + Ra2*rO.z*rO.z - Ra2*ra2;
	
	float a2 = a * a;
	float p = -3.0*a2     + 2.0*b;
	float q =  2.0*a2*a   - 2.0*a*b   + 2.0*c;
	float r = -3.0*a2*a2 + 4.0*a2*b - 8.0*a*c + 4.0*d;
	p *= ONE_OVER_THREE;
	r *= ONE_OVER_THREE;
	float p2 = p * p;
	float Q = p2 + r;
	float R = 3.0*r*p - p2*p - q*q;
	
	float h = R*R - Q*Q*Q;
	float z = 0.0;
	if( h < 0.0 )
	{
		float sQ = sqrt(Q);
		z = 2.0*sQ*cos( acos(R/(sQ*Q)) * ONE_OVER_THREE );
	}
	else
	{
		float sQ = pow( sqrt(h) + abs(R), ONE_OVER_THREE );
		z = sign(R)*abs( sQ + Q/sQ );
	}
	
	z = p - z;
		
	float d1 = z   - 3.0*p;
	float d2 = z*z - 3.0*r;
	if( abs(d1)<0.5 ) // originally < 0.0001, but this was too precise and caused holes when viewed from the side
	{
		if( d2<0.0 ) return INFINITY;
		d2 = sqrt(d2);
	}
	else
	{
		if( d1<0.0 ) return INFINITY;
		d1 = sqrt( d1*0.5 );
		d2 = q/d1;
	}
	
	float result = INFINITY;
	float d1SqMinusZ = d1*d1 - z;
	
	h = d1SqMinusZ - d2;
	if( h>0.0 )
	{
		h = sqrt(h);
		float t1 = d1 - h - a;
		float t2 = d1 + h - a;
		if( t2>0.0 ) result=t2;
		if( t1>0.0 ) result=t1;
	}
	h = d1SqMinusZ + d2;
	if( h>0.0 )
	{
		h = sqrt(h);
		float t1 = -d1 - h - a;
		float t2 = -d1 + h - a;
		if( t2>0.0 ) result=min(result,t2);
		if( t1>0.0 ) result=min(result,t1); 
	}
	return result;
}
*/
`;
//#endregion
//#region pathtracing_quad_intersect
THREE.ShaderChunk['pathtracing_quad_intersect'] = `
//----------------------------------------------------------------------------
float QuadIntersect( vec3 v0, vec3 v1, vec3 v2, vec3 v3, vec3 normal, Ray r )
//----------------------------------------------------------------------------
{
	vec3 u, v, n;    // triangle vectors
	vec3 w0, w, x;   // ray and intersection vectors
	float rt, a, b;  // params to calc ray-plane intersect
	
	// get first triangle edge vectors and plane normal
	v = v2 - v0;
	u = v1 - v0; // switched u and v names to save calculation later below
	//n = cross(v, u); // switched u and v names to save calculation later below
	n = -normal; // can avoid cross product if normal is already known
	    
	w0 = r.origin - v0;
	a = -dot(n,w0);
	b = dot(n, r.direction);
	if (b < 0.0001)   // ray is parallel to quad plane
		return INFINITY;
	// get intersect point of ray with quad plane
	rt = a / b;
	if (rt < 0.0)          // ray goes away from quad
		return INFINITY;   // => no intersect
	    
	x = r.origin + rt * r.direction; // intersect point of ray and plane
	// is x inside first Triangle?
	float uu, uv, vv, wu, wv, D;
	uu = dot(u,u);
	uv = dot(u,v);
	vv = dot(v,v);
	w = x - v0;
	wu = dot(w,u);
	wv = dot(w,v);
	D = 1.0 / (uv * uv - uu * vv);
	// get and test parametric coords
	float s, t;
	s = (uv * wv - vv * wu) * D;
	if (s >= 0.0 && s <= 1.0)
	{
		t = (uv * wu - uu * wv) * D;
		if (t >= 0.0 && (s + t) <= 1.0)
		{
			return rt;
		}
	}
	
	// is x inside second Triangle?
	u = v3 - v0;
	///v = v2 - v0;  //optimization - already calculated above
	uu = dot(u,u);
	uv = dot(u,v);
	///vv = dot(v,v);//optimization - already calculated above
	///w = x - v0;   //optimization - already calculated above
	wu = dot(w,u);
	///wv = dot(w,v);//optimization - already calculated above
	D = 1.0 / (uv * uv - uu * vv);
	// get and test parametric coords
	s = (uv * wv - vv * wu) * D;
	if (s >= 0.0 && s <= 1.0)
	{
		t = (uv * wu - uu * wv) * D;
		if (t >= 0.0 && (s + t) <= 1.0)
		{
			return rt;
		}
	}
	return INFINITY;
}
`;
//#endregion
//#region pathtracing_box_intersect
THREE.ShaderChunk['pathtracing_box_intersect'] = `
//--------------------------------------------------------------------------
float BoxIntersect( vec3 minCorner, vec3 maxCorner, Ray r, out vec3 normal )
//--------------------------------------------------------------------------
{
	vec3 invDir = 1.0 / r.direction;
	vec3 tmin = (minCorner - r.origin) * invDir;
	vec3 tmax = (maxCorner - r.origin) * invDir;
	
	vec3 real_min = min(tmin, tmax);
	vec3 real_max = max(tmin, tmax);
	
	float minmax = min( min(real_max.x, real_max.y), real_max.z);
	float maxmin = max( max(real_min.x, real_min.y), real_min.z);
	
	if (minmax > maxmin)
	{
		
		if (maxmin > 0.0) // if we are outside the box
		{
			normal = -sign(r.direction) * step(real_min.yzx, real_min) * step(real_min.zxy, real_min);
			return maxmin;	
		}
		
		else if (minmax > 0.0) // else if we are inside the box
		{
			normal = -sign(r.direction) * step(real_max, real_max.yzx) * step(real_max, real_max.zxy);
			return minmax;
		}
				
	}
	
	return INFINITY;
}
`;
//#endregion
//#region pathtracing_boundingbox_intersect
THREE.ShaderChunk['pathtracing_boundingbox_intersect'] = `
//--------------------------------------------------------------------------------------
bool BoundingBoxIntersect( vec3 minCorner, vec3 maxCorner, vec3 rayOrigin, vec3 invDir )
//--------------------------------------------------------------------------------------
{
	vec3 tmin = (minCorner - rayOrigin) * invDir;
	vec3 tmax = (maxCorner - rayOrigin) * invDir;
	vec3 real_min = min(tmin, tmax);
   	vec3 real_max = max(tmin, tmax);
   
   	float minmax = min( min(real_max.x, real_max.y), real_max.z);
   	float maxmin = max( max(real_min.x, real_min.y), real_min.z);
	//return minmax > maxmin;
	return minmax > max(maxmin, 0.0);
}
`;
//#endregion
//#region pathtracing_triangle_intersect
THREE.ShaderChunk['pathtracing_triangle_intersect'] = `
//---------------------------------------------------------
float TriangleIntersect( vec3 v0, vec3 v1, vec3 v2, Ray r )
//---------------------------------------------------------
{
	vec3 edge1 = v1 - v0;
	vec3 edge2 = v2 - v0;
	vec3 tvec = r.origin - v0;
	vec3 pvec = cross(r.direction, edge2);
	float det = 1.0 / dot(edge1, pvec);
	float u = dot(tvec, pvec) * det;
	if (u < 0.0 || u > 1.0)
		return INFINITY;
	vec3 qvec = cross(tvec, edge1);
	float v = dot(r.direction, qvec) * det;
	if (v < 0.0 || u + v > 1.0)
		return INFINITY;
	return dot(edge2, qvec) * det;
}
`;
//#endregion
//#region pathtracing_physical_sky_functions
THREE.ShaderChunk['pathtracing_physical_sky_functions'] = `
float RayleighPhase(float cosTheta)
{
	return THREE_OVER_SIXTEENPI * (1.0 + (cosTheta * cosTheta));
}
float hgPhase(float cosTheta, float g)
{
        float g2 = g * g;
        float inverse = 1.0 / pow(1.0 - 2.0 * g * cosTheta + g2, 1.5);
	return ONE_OVER_FOURPI * ((1.0 - g2) * inverse);
}
vec3 totalMie()
{
	float c = (0.2 * TURBIDITY) * 10E-18;
	return 0.434 * c * MIE_CONST;
}
float SunIntensity(float zenithAngleCos)
{
	return SUN_INTENSITY * max( 0.0, 1.0 - exp( -( CUTOFF_ANGLE - acos(zenithAngleCos) ) ) );
}
vec3 Get_Sky_Color(Ray r, vec3 sunDirection)
{
	
    	vec3 viewDir = normalize(r.direction);
	
	/* most of the following code is borrowed from the three.js shader file: SkyShader.js */
    	// Cosine angles
	float cosViewSunAngle = max(0.001, dot(viewDir, sunDirection));
    	float cosSunUpAngle = dot(sunDirection, UP_VECTOR); // allowed to be negative: + is daytime, - is nighttime
    	float cosUpViewAngle = max(0.001, dot(UP_VECTOR, viewDir)); // cannot be 0, used as divisor
	
        // Get sun intensity based on how high in the sky it is
    	float sunE = SunIntensity(cosSunUpAngle);
        
	// extinction (absorbtion + out scattering)
	// rayleigh coefficients
    	vec3 rayleighAtX = TOTAL_RAYLEIGH * RAYLEIGH_COEFFICIENT;
    
	// mie coefficients
	vec3 mieAtX = totalMie() * MIE_COEFFICIENT;  
    
	// optical length
	float zenithAngle = 1.0 / cosUpViewAngle;
    
	float rayleighOpticalLength = RAYLEIGH_ZENITH_LENGTH * zenithAngle;
	float mieOpticalLength = MIE_ZENITH_LENGTH * zenithAngle;
	// combined extinction factor	
	vec3 Fex = exp(-(rayleighAtX * rayleighOpticalLength + mieAtX * mieOpticalLength));
	// in scattering
	vec3 rayleighXtoEye = rayleighAtX * RayleighPhase(cosViewSunAngle);
	vec3 mieXtoEye = mieAtX * hgPhase(cosViewSunAngle, MIE_DIRECTIONAL_G);
     
    	vec3 totalLightAtX = rayleighAtX + mieAtX;
    	vec3 lightFromXtoEye = rayleighXtoEye + mieXtoEye; 
    
    	vec3 somethingElse = sunE * (lightFromXtoEye / totalLightAtX);
    
    	vec3 sky = somethingElse * (1.0 - Fex);
	float oneMinusCosSun = 1.0 - cosSunUpAngle;
    	sky *= mix( vec3(1.0), pow(somethingElse * Fex,vec3(0.5)), 
	    clamp(oneMinusCosSun * oneMinusCosSun * oneMinusCosSun * oneMinusCosSun * oneMinusCosSun, 0.0, 1.0) );
	// composition + solar disc
    	float sundisk = smoothstep(SUN_ANGULAR_DIAMETER_COS, SUN_ANGULAR_DIAMETER_COS, cosViewSunAngle + 0.0004);
	vec3 sun = (sunE * SUN_INTENSITY * Fex) * sundisk;
	
	return sky + sun;
}
`;
//#endregion
//#region pathtracing_random_functions
THREE.ShaderChunk['pathtracing_random_functions'] = `
float rand( inout float seed )
{ 
	seed -= uRandomVector.x * uRandomVector.y;
	return fract( sin( seed ) * 43758.5453123 );
}
vec3 randomSphereDirection( inout float seed )
{
    	vec2 r = vec2(rand(seed), rand(seed)) * TWO_PI;
	return vec3( sin(r.x) * vec2(sin(r.y), cos(r.y)), cos(r.x) );	
}
vec3 randomDirectionInHemisphere( vec3 n, inout float seed )
{
	vec2 r = vec2(rand(seed), rand(seed)) * TWO_PI;
	vec3 dr = vec3( sin(r.x) * vec2(sin(r.y), cos(r.y)), cos(r.x) );	
	return dot(dr,n) * dr;
}
vec3 randomCosWeightedDirectionInHemisphere( vec3 nl, inout float seed )
{
	float up = sqrt(rand(seed)); // weighted cos(theta)
    	float over = sqrt(1.0 - up * up); // sin(theta)
    	float around = rand(seed) * TWO_PI;
	vec3 u = normalize( cross( abs(nl.x) > 0.1 ? vec3(0, 1, 0) : vec3(1, 0, 0), nl ) );
	vec3 v = normalize( cross(nl, u) );
    	return vec3( cos(around) * over * u ) + ( sin(around) * over * v ) + (up * nl);		
}
`;
//#endregion
//#region pathtracing_direct_lighting_sphere
THREE.ShaderChunk['pathtracing_direct_lighting_sphere'] = `
vec3 calcDirectLightingSphere(vec3 mask, vec3 x, vec3 nl, Sphere light, inout float seed)
{
	vec3 dirLight = vec3(0.0);
	Intersection shadowIntersec;
	
	// cast shadow ray from intersection point
	vec3 ld = light.position + (randomSphereDirection(seed) * light.radius);
	vec3 srDir = normalize(ld - x);
		
	Ray shadowRay = Ray(x, srDir);
	shadowRay.origin += nl * 2.0;
	float st = SceneIntersect(shadowRay, shadowIntersec);
	if ( shadowIntersec.type == LIGHT )
	{
		float r2 = light.radius * light.radius;
		vec3 d = light.position - shadowRay.origin;
		float d2 = dot(d,d);
		float cos_a_max = sqrt(1. - clamp( r2 / d2, 0., 1.));
                float weight = 2. * (1. - cos_a_max);
                dirLight = mask * light.emission * weight * max(0.01, dot(srDir, nl));
	}
	
	return dirLight;
}
`;
//#endregion
//#region pathtracing_direct_lighting_quad
THREE.ShaderChunk['pathtracing_direct_lighting_quad'] = `
vec3 calcDirectLightingQuad(vec3 mask, vec3 x, vec3 nl, Quad light, inout float seed)
{
	vec3 dirLight = vec3(0.0);
	Intersection shadowIntersec;
	vec3 randPointOnLight;
	randPointOnLight.x = mix(light.v0.x, light.v1.x, rand(seed));
	randPointOnLight.y = light.v0.y;
	randPointOnLight.z = mix(light.v0.z, light.v3.z, rand(seed));
	vec3 srDir = normalize(randPointOnLight - x);
	float nlDotSrDir = max(dot(nl, srDir), 0.01);
		
	// cast shadow ray from intersection point	
	Ray shadowRay = Ray(x, srDir);
	shadowRay.origin += nl * 2.0; // larger dimensions of this scene require greater offsets
	float st = SceneIntersect(shadowRay, shadowIntersec);
	if ( shadowIntersec.type == LIGHT )
	{
		float r2 = distance(light.v0, light.v1) * distance(light.v0, light.v3);
		vec3 d = randPointOnLight - shadowRay.origin;
		float d2 = dot(d, d);
		float weight = dot(-srDir, normalize(shadowIntersec.normal)) * r2 / d2;
		dirLight = mask * light.emission * nlDotSrDir * clamp(weight, 0.0, 1.0);
	}
	return dirLight;
}
`;
//#endregion pathtracing_main
THREE.ShaderChunk['pathtracing_main'] = __webpack_require__(6);


/***/ }),
/* 6 */
/***/ (function(module, exports) {

module.exports = "void main( void )\r\n{\r\n\t// not needed, three.js has a built-in uniform named cameraPosition\r\n\t//vec3 camPos     = vec3( uCameraMatrix[3][0],  uCameraMatrix[3][1],  uCameraMatrix[3][2]);\r\n\t\r\n    vec3 camRight   = vec3( uCameraMatrix[0][0],  uCameraMatrix[0][1],  uCameraMatrix[0][2]);\r\n    vec3 camUp      = vec3( uCameraMatrix[1][0],  uCameraMatrix[1][1],  uCameraMatrix[1][2]);\r\n\tvec3 camForward = vec3(-uCameraMatrix[2][0], -uCameraMatrix[2][1], -uCameraMatrix[2][2]);\r\n\t\r\n\t// seed for rand(seed) function\r\n\tfloat seed = mod(uSampleCounter,1000.0) * uRandomVector.x - uRandomVector.y + uResolution.y * gl_FragCoord.x / uResolution.x + uResolution.x * gl_FragCoord.y / uResolution.y;\r\n\t\r\n\tfloat r1 = 2.0 * rand(seed);\r\n\tfloat r2 = 2.0 * rand(seed);\r\n\t\r\n\tvec2 pixelPos = vec2(0);\r\n\tvec2 offset = vec2(0);\r\n\tif ( !uCameraIsMoving ) \r\n\t{\r\n\t\toffset.x = r1 < 1.0 ? sqrt(r1) - 1.0 : 1.0 - sqrt(2.0 - r1);\r\n        offset.y = r2 < 1.0 ? sqrt(r2) - 1.0 : 1.0 - sqrt(2.0 - r2);\r\n\t}\r\n\t\r\n\toffset /= (uResolution);\r\n\tpixelPos = (2.0 * (vUv + offset) - 1.0);\r\n\tvec3 rayDir = normalize( pixelPos.x * camRight * uULen + pixelPos.y * camUp * uVLen + camForward );\r\n\t\r\n\t// depth of field\r\n\tvec3 focalPoint = uFocusDistance * rayDir;\r\n\tfloat randomAngle = rand(seed) * TWO_PI; // pick random point on aperture\r\n\tfloat randomRadius = rand(seed) * uApertureSize;\r\n\tvec3  randomAperturePos = ( cos(randomAngle) * camRight + sin(randomAngle) * camUp ) * randomRadius;\r\n\t// point on aperture to focal point\r\n\tvec3 finalRayDir = normalize(focalPoint - randomAperturePos);\r\n\t\r\n\tRay ray = Ray( cameraPosition + randomAperturePos , finalRayDir );\r\n\tSetupScene();\r\n\t     \t\t\r\n\t// perform path tracing and get resulting pixel color\r\n\tvec3 pixelColor = CalculateRadiance( ray, seed );\r\n\t\r\n\tvec3 previousColor = texture2D(tPreviousTexture, vUv).rgb;\r\n\t\r\n\tif ( uSampleCounter == 1.0 )\r\n\t{\r\n\t\tpreviousColor = vec3(0.0); // clear rendering accumulation buffer\r\n\t}\r\n\telse if ( uCameraIsMoving )\r\n\t{\r\n\t\tpreviousColor *= 0.5; // motion-blur trail amount (old image)\r\n\t\tpixelColor *= 0.5; // brightness of new image (noisy)\r\n\t}\r\n\t\t\r\n\tgl_FragColor = vec4( pixelColor + previousColor, 1.0 );\r\n\t\r\n}\r\n"

/***/ }),
/* 7 */
/***/ (function(module, exports) {

module.exports = "precision highp float;\r\nprecision highp int;\r\nvarying vec2 vUv;\r\nvoid main()\r\n{\r\n\tvUv = uv;\r\n\tgl_Position = vec4( position, 1.0 );\r\n}\r\n"

/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

/**
 * dat-gui JavaScript Controller Library
 * http://code.google.com/p/dat-gui
 *
 * Copyright 2011 Data Arts Team, Google Creative Lab
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 */

(function (global, factory) {
	 true ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.dat = factory());
}(this, (function () { 'use strict';

function ___$insertStyle(css) {
  if (!css) {
    return;
  }
  if (typeof window === 'undefined') {
    return;
  }

  var style = document.createElement('style');

  style.setAttribute('type', 'text/css');
  style.innerHTML = css;
  document.head.appendChild(style);

  return css;
}

function colorToString (color, forceCSSHex) {
  var colorFormat = color.__state.conversionName.toString();
  var r = Math.round(color.r);
  var g = Math.round(color.g);
  var b = Math.round(color.b);
  var a = color.a;
  var h = Math.round(color.h);
  var s = color.s.toFixed(1);
  var v = color.v.toFixed(1);
  if (forceCSSHex || colorFormat === 'THREE_CHAR_HEX' || colorFormat === 'SIX_CHAR_HEX') {
    var str = color.hex.toString(16);
    while (str.length < 6) {
      str = '0' + str;
    }
    return '#' + str;
  } else if (colorFormat === 'CSS_RGB') {
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  } else if (colorFormat === 'CSS_RGBA') {
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  } else if (colorFormat === 'HEX') {
    return '0x' + color.hex.toString(16);
  } else if (colorFormat === 'RGB_ARRAY') {
    return '[' + r + ',' + g + ',' + b + ']';
  } else if (colorFormat === 'RGBA_ARRAY') {
    return '[' + r + ',' + g + ',' + b + ',' + a + ']';
  } else if (colorFormat === 'RGB_OBJ') {
    return '{r:' + r + ',g:' + g + ',b:' + b + '}';
  } else if (colorFormat === 'RGBA_OBJ') {
    return '{r:' + r + ',g:' + g + ',b:' + b + ',a:' + a + '}';
  } else if (colorFormat === 'HSV_OBJ') {
    return '{h:' + h + ',s:' + s + ',v:' + v + '}';
  } else if (colorFormat === 'HSVA_OBJ') {
    return '{h:' + h + ',s:' + s + ',v:' + v + ',a:' + a + '}';
  }
  return 'unknown format';
}

var ARR_EACH = Array.prototype.forEach;
var ARR_SLICE = Array.prototype.slice;
var Common = {
  BREAK: {},
  extend: function extend(target) {
    this.each(ARR_SLICE.call(arguments, 1), function (obj) {
      var keys = this.isObject(obj) ? Object.keys(obj) : [];
      keys.forEach(function (key) {
        if (!this.isUndefined(obj[key])) {
          target[key] = obj[key];
        }
      }.bind(this));
    }, this);
    return target;
  },
  defaults: function defaults(target) {
    this.each(ARR_SLICE.call(arguments, 1), function (obj) {
      var keys = this.isObject(obj) ? Object.keys(obj) : [];
      keys.forEach(function (key) {
        if (this.isUndefined(target[key])) {
          target[key] = obj[key];
        }
      }.bind(this));
    }, this);
    return target;
  },
  compose: function compose() {
    var toCall = ARR_SLICE.call(arguments);
    return function () {
      var args = ARR_SLICE.call(arguments);
      for (var i = toCall.length - 1; i >= 0; i--) {
        args = [toCall[i].apply(this, args)];
      }
      return args[0];
    };
  },
  each: function each(obj, itr, scope) {
    if (!obj) {
      return;
    }
    if (ARR_EACH && obj.forEach && obj.forEach === ARR_EACH) {
      obj.forEach(itr, scope);
    } else if (obj.length === obj.length + 0) {
      var key = void 0;
      var l = void 0;
      for (key = 0, l = obj.length; key < l; key++) {
        if (key in obj && itr.call(scope, obj[key], key) === this.BREAK) {
          return;
        }
      }
    } else {
      for (var _key in obj) {
        if (itr.call(scope, obj[_key], _key) === this.BREAK) {
          return;
        }
      }
    }
  },
  defer: function defer(fnc) {
    setTimeout(fnc, 0);
  },
  debounce: function debounce(func, threshold, callImmediately) {
    var timeout = void 0;
    return function () {
      var obj = this;
      var args = arguments;
      function delayed() {
        timeout = null;
        if (!callImmediately) func.apply(obj, args);
      }
      var callNow = callImmediately || !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(delayed, threshold);
      if (callNow) {
        func.apply(obj, args);
      }
    };
  },
  toArray: function toArray(obj) {
    if (obj.toArray) return obj.toArray();
    return ARR_SLICE.call(obj);
  },
  isUndefined: function isUndefined(obj) {
    return obj === undefined;
  },
  isNull: function isNull(obj) {
    return obj === null;
  },
  isNaN: function (_isNaN) {
    function isNaN(_x) {
      return _isNaN.apply(this, arguments);
    }
    isNaN.toString = function () {
      return _isNaN.toString();
    };
    return isNaN;
  }(function (obj) {
    return isNaN(obj);
  }),
  isArray: Array.isArray || function (obj) {
    return obj.constructor === Array;
  },
  isObject: function isObject(obj) {
    return obj === Object(obj);
  },
  isNumber: function isNumber(obj) {
    return obj === obj + 0;
  },
  isString: function isString(obj) {
    return obj === obj + '';
  },
  isBoolean: function isBoolean(obj) {
    return obj === false || obj === true;
  },
  isFunction: function isFunction(obj) {
    return Object.prototype.toString.call(obj) === '[object Function]';
  }
};

var INTERPRETATIONS = [
{
  litmus: Common.isString,
  conversions: {
    THREE_CHAR_HEX: {
      read: function read(original) {
        var test = original.match(/^#([A-F0-9])([A-F0-9])([A-F0-9])$/i);
        if (test === null) {
          return false;
        }
        return {
          space: 'HEX',
          hex: parseInt('0x' + test[1].toString() + test[1].toString() + test[2].toString() + test[2].toString() + test[3].toString() + test[3].toString(), 0)
        };
      },
      write: colorToString
    },
    SIX_CHAR_HEX: {
      read: function read(original) {
        var test = original.match(/^#([A-F0-9]{6})$/i);
        if (test === null) {
          return false;
        }
        return {
          space: 'HEX',
          hex: parseInt('0x' + test[1].toString(), 0)
        };
      },
      write: colorToString
    },
    CSS_RGB: {
      read: function read(original) {
        var test = original.match(/^rgb\(\s*(.+)\s*,\s*(.+)\s*,\s*(.+)\s*\)/);
        if (test === null) {
          return false;
        }
        return {
          space: 'RGB',
          r: parseFloat(test[1]),
          g: parseFloat(test[2]),
          b: parseFloat(test[3])
        };
      },
      write: colorToString
    },
    CSS_RGBA: {
      read: function read(original) {
        var test = original.match(/^rgba\(\s*(.+)\s*,\s*(.+)\s*,\s*(.+)\s*,\s*(.+)\s*\)/);
        if (test === null) {
          return false;
        }
        return {
          space: 'RGB',
          r: parseFloat(test[1]),
          g: parseFloat(test[2]),
          b: parseFloat(test[3]),
          a: parseFloat(test[4])
        };
      },
      write: colorToString
    }
  }
},
{
  litmus: Common.isNumber,
  conversions: {
    HEX: {
      read: function read(original) {
        return {
          space: 'HEX',
          hex: original,
          conversionName: 'HEX'
        };
      },
      write: function write(color) {
        return color.hex;
      }
    }
  }
},
{
  litmus: Common.isArray,
  conversions: {
    RGB_ARRAY: {
      read: function read(original) {
        if (original.length !== 3) {
          return false;
        }
        return {
          space: 'RGB',
          r: original[0],
          g: original[1],
          b: original[2]
        };
      },
      write: function write(color) {
        return [color.r, color.g, color.b];
      }
    },
    RGBA_ARRAY: {
      read: function read(original) {
        if (original.length !== 4) return false;
        return {
          space: 'RGB',
          r: original[0],
          g: original[1],
          b: original[2],
          a: original[3]
        };
      },
      write: function write(color) {
        return [color.r, color.g, color.b, color.a];
      }
    }
  }
},
{
  litmus: Common.isObject,
  conversions: {
    RGBA_OBJ: {
      read: function read(original) {
        if (Common.isNumber(original.r) && Common.isNumber(original.g) && Common.isNumber(original.b) && Common.isNumber(original.a)) {
          return {
            space: 'RGB',
            r: original.r,
            g: original.g,
            b: original.b,
            a: original.a
          };
        }
        return false;
      },
      write: function write(color) {
        return {
          r: color.r,
          g: color.g,
          b: color.b,
          a: color.a
        };
      }
    },
    RGB_OBJ: {
      read: function read(original) {
        if (Common.isNumber(original.r) && Common.isNumber(original.g) && Common.isNumber(original.b)) {
          return {
            space: 'RGB',
            r: original.r,
            g: original.g,
            b: original.b
          };
        }
        return false;
      },
      write: function write(color) {
        return {
          r: color.r,
          g: color.g,
          b: color.b
        };
      }
    },
    HSVA_OBJ: {
      read: function read(original) {
        if (Common.isNumber(original.h) && Common.isNumber(original.s) && Common.isNumber(original.v) && Common.isNumber(original.a)) {
          return {
            space: 'HSV',
            h: original.h,
            s: original.s,
            v: original.v,
            a: original.a
          };
        }
        return false;
      },
      write: function write(color) {
        return {
          h: color.h,
          s: color.s,
          v: color.v,
          a: color.a
        };
      }
    },
    HSV_OBJ: {
      read: function read(original) {
        if (Common.isNumber(original.h) && Common.isNumber(original.s) && Common.isNumber(original.v)) {
          return {
            space: 'HSV',
            h: original.h,
            s: original.s,
            v: original.v
          };
        }
        return false;
      },
      write: function write(color) {
        return {
          h: color.h,
          s: color.s,
          v: color.v
        };
      }
    }
  }
}];
var result = void 0;
var toReturn = void 0;
var interpret = function interpret() {
  toReturn = false;
  var original = arguments.length > 1 ? Common.toArray(arguments) : arguments[0];
  Common.each(INTERPRETATIONS, function (family) {
    if (family.litmus(original)) {
      Common.each(family.conversions, function (conversion, conversionName) {
        result = conversion.read(original);
        if (toReturn === false && result !== false) {
          toReturn = result;
          result.conversionName = conversionName;
          result.conversion = conversion;
          return Common.BREAK;
        }
      });
      return Common.BREAK;
    }
  });
  return toReturn;
};

var tmpComponent = void 0;
var ColorMath = {
  hsv_to_rgb: function hsv_to_rgb(h, s, v) {
    var hi = Math.floor(h / 60) % 6;
    var f = h / 60 - Math.floor(h / 60);
    var p = v * (1.0 - s);
    var q = v * (1.0 - f * s);
    var t = v * (1.0 - (1.0 - f) * s);
    var c = [[v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q]][hi];
    return {
      r: c[0] * 255,
      g: c[1] * 255,
      b: c[2] * 255
    };
  },
  rgb_to_hsv: function rgb_to_hsv(r, g, b) {
    var min = Math.min(r, g, b);
    var max = Math.max(r, g, b);
    var delta = max - min;
    var h = void 0;
    var s = void 0;
    if (max !== 0) {
      s = delta / max;
    } else {
      return {
        h: NaN,
        s: 0,
        v: 0
      };
    }
    if (r === max) {
      h = (g - b) / delta;
    } else if (g === max) {
      h = 2 + (b - r) / delta;
    } else {
      h = 4 + (r - g) / delta;
    }
    h /= 6;
    if (h < 0) {
      h += 1;
    }
    return {
      h: h * 360,
      s: s,
      v: max / 255
    };
  },
  rgb_to_hex: function rgb_to_hex(r, g, b) {
    var hex = this.hex_with_component(0, 2, r);
    hex = this.hex_with_component(hex, 1, g);
    hex = this.hex_with_component(hex, 0, b);
    return hex;
  },
  component_from_hex: function component_from_hex(hex, componentIndex) {
    return hex >> componentIndex * 8 & 0xFF;
  },
  hex_with_component: function hex_with_component(hex, componentIndex, value) {
    return value << (tmpComponent = componentIndex * 8) | hex & ~(0xFF << tmpComponent);
  }
};

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};











var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();







var get = function get(object, property, receiver) {
  if (object === null) object = Function.prototype;
  var desc = Object.getOwnPropertyDescriptor(object, property);

  if (desc === undefined) {
    var parent = Object.getPrototypeOf(object);

    if (parent === null) {
      return undefined;
    } else {
      return get(parent, property, receiver);
    }
  } else if ("value" in desc) {
    return desc.value;
  } else {
    var getter = desc.get;

    if (getter === undefined) {
      return undefined;
    }

    return getter.call(receiver);
  }
};

var inherits = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};











var possibleConstructorReturn = function (self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return call && (typeof call === "object" || typeof call === "function") ? call : self;
};

var Color = function () {
  function Color() {
    classCallCheck(this, Color);
    this.__state = interpret.apply(this, arguments);
    if (this.__state === false) {
      throw new Error('Failed to interpret color arguments');
    }
    this.__state.a = this.__state.a || 1;
  }
  createClass(Color, [{
    key: 'toString',
    value: function toString() {
      return colorToString(this);
    }
  }, {
    key: 'toHexString',
    value: function toHexString() {
      return colorToString(this, true);
    }
  }, {
    key: 'toOriginal',
    value: function toOriginal() {
      return this.__state.conversion.write(this);
    }
  }]);
  return Color;
}();
function defineRGBComponent(target, component, componentHexIndex) {
  Object.defineProperty(target, component, {
    get: function get$$1() {
      if (this.__state.space === 'RGB') {
        return this.__state[component];
      }
      Color.recalculateRGB(this, component, componentHexIndex);
      return this.__state[component];
    },
    set: function set$$1(v) {
      if (this.__state.space !== 'RGB') {
        Color.recalculateRGB(this, component, componentHexIndex);
        this.__state.space = 'RGB';
      }
      this.__state[component] = v;
    }
  });
}
function defineHSVComponent(target, component) {
  Object.defineProperty(target, component, {
    get: function get$$1() {
      if (this.__state.space === 'HSV') {
        return this.__state[component];
      }
      Color.recalculateHSV(this);
      return this.__state[component];
    },
    set: function set$$1(v) {
      if (this.__state.space !== 'HSV') {
        Color.recalculateHSV(this);
        this.__state.space = 'HSV';
      }
      this.__state[component] = v;
    }
  });
}
Color.recalculateRGB = function (color, component, componentHexIndex) {
  if (color.__state.space === 'HEX') {
    color.__state[component] = ColorMath.component_from_hex(color.__state.hex, componentHexIndex);
  } else if (color.__state.space === 'HSV') {
    Common.extend(color.__state, ColorMath.hsv_to_rgb(color.__state.h, color.__state.s, color.__state.v));
  } else {
    throw new Error('Corrupted color state');
  }
};
Color.recalculateHSV = function (color) {
  var result = ColorMath.rgb_to_hsv(color.r, color.g, color.b);
  Common.extend(color.__state, {
    s: result.s,
    v: result.v
  });
  if (!Common.isNaN(result.h)) {
    color.__state.h = result.h;
  } else if (Common.isUndefined(color.__state.h)) {
    color.__state.h = 0;
  }
};
Color.COMPONENTS = ['r', 'g', 'b', 'h', 's', 'v', 'hex', 'a'];
defineRGBComponent(Color.prototype, 'r', 2);
defineRGBComponent(Color.prototype, 'g', 1);
defineRGBComponent(Color.prototype, 'b', 0);
defineHSVComponent(Color.prototype, 'h');
defineHSVComponent(Color.prototype, 's');
defineHSVComponent(Color.prototype, 'v');
Object.defineProperty(Color.prototype, 'a', {
  get: function get$$1() {
    return this.__state.a;
  },
  set: function set$$1(v) {
    this.__state.a = v;
  }
});
Object.defineProperty(Color.prototype, 'hex', {
  get: function get$$1() {
    if (!this.__state.space !== 'HEX') {
      this.__state.hex = ColorMath.rgb_to_hex(this.r, this.g, this.b);
    }
    return this.__state.hex;
  },
  set: function set$$1(v) {
    this.__state.space = 'HEX';
    this.__state.hex = v;
  }
});

var Controller = function () {
  function Controller(object, property) {
    classCallCheck(this, Controller);
    this.initialValue = object[property];
    this.domElement = document.createElement('div');
    this.object = object;
    this.property = property;
    this.__onChange = undefined;
    this.__onFinishChange = undefined;
  }
  createClass(Controller, [{
    key: 'onChange',
    value: function onChange(fnc) {
      this.__onChange = fnc;
      return this;
    }
  }, {
    key: 'onFinishChange',
    value: function onFinishChange(fnc) {
      this.__onFinishChange = fnc;
      return this;
    }
  }, {
    key: 'setValue',
    value: function setValue(newValue) {
      this.object[this.property] = newValue;
      if (this.__onChange) {
        this.__onChange.call(this, newValue);
      }
      this.updateDisplay();
      return this;
    }
  }, {
    key: 'getValue',
    value: function getValue() {
      return this.object[this.property];
    }
  }, {
    key: 'updateDisplay',
    value: function updateDisplay() {
      return this;
    }
  }, {
    key: 'isModified',
    value: function isModified() {
      return this.initialValue !== this.getValue();
    }
  }]);
  return Controller;
}();

var EVENT_MAP = {
  HTMLEvents: ['change'],
  MouseEvents: ['click', 'mousemove', 'mousedown', 'mouseup', 'mouseover'],
  KeyboardEvents: ['keydown']
};
var EVENT_MAP_INV = {};
Common.each(EVENT_MAP, function (v, k) {
  Common.each(v, function (e) {
    EVENT_MAP_INV[e] = k;
  });
});
var CSS_VALUE_PIXELS = /(\d+(\.\d+)?)px/;
function cssValueToPixels(val) {
  if (val === '0' || Common.isUndefined(val)) {
    return 0;
  }
  var match = val.match(CSS_VALUE_PIXELS);
  if (!Common.isNull(match)) {
    return parseFloat(match[1]);
  }
  return 0;
}
var dom = {
  makeSelectable: function makeSelectable(elem, selectable) {
    if (elem === undefined || elem.style === undefined) return;
    elem.onselectstart = selectable ? function () {
      return false;
    } : function () {};
    elem.style.MozUserSelect = selectable ? 'auto' : 'none';
    elem.style.KhtmlUserSelect = selectable ? 'auto' : 'none';
    elem.unselectable = selectable ? 'on' : 'off';
  },
  makeFullscreen: function makeFullscreen(elem, hor, vert) {
    var vertical = vert;
    var horizontal = hor;
    if (Common.isUndefined(horizontal)) {
      horizontal = true;
    }
    if (Common.isUndefined(vertical)) {
      vertical = true;
    }
    elem.style.position = 'absolute';
    if (horizontal) {
      elem.style.left = 0;
      elem.style.right = 0;
    }
    if (vertical) {
      elem.style.top = 0;
      elem.style.bottom = 0;
    }
  },
  fakeEvent: function fakeEvent(elem, eventType, pars, aux) {
    var params = pars || {};
    var className = EVENT_MAP_INV[eventType];
    if (!className) {
      throw new Error('Event type ' + eventType + ' not supported.');
    }
    var evt = document.createEvent(className);
    switch (className) {
      case 'MouseEvents':
        {
          var clientX = params.x || params.clientX || 0;
          var clientY = params.y || params.clientY || 0;
          evt.initMouseEvent(eventType, params.bubbles || false, params.cancelable || true, window, params.clickCount || 1, 0,
          0,
          clientX,
          clientY,
          false, false, false, false, 0, null);
          break;
        }
      case 'KeyboardEvents':
        {
          var init = evt.initKeyboardEvent || evt.initKeyEvent;
          Common.defaults(params, {
            cancelable: true,
            ctrlKey: false,
            altKey: false,
            shiftKey: false,
            metaKey: false,
            keyCode: undefined,
            charCode: undefined
          });
          init(eventType, params.bubbles || false, params.cancelable, window, params.ctrlKey, params.altKey, params.shiftKey, params.metaKey, params.keyCode, params.charCode);
          break;
        }
      default:
        {
          evt.initEvent(eventType, params.bubbles || false, params.cancelable || true);
          break;
        }
    }
    Common.defaults(evt, aux);
    elem.dispatchEvent(evt);
  },
  bind: function bind(elem, event, func, newBool) {
    var bool = newBool || false;
    if (elem.addEventListener) {
      elem.addEventListener(event, func, bool);
    } else if (elem.attachEvent) {
      elem.attachEvent('on' + event, func);
    }
    return dom;
  },
  unbind: function unbind(elem, event, func, newBool) {
    var bool = newBool || false;
    if (elem.removeEventListener) {
      elem.removeEventListener(event, func, bool);
    } else if (elem.detachEvent) {
      elem.detachEvent('on' + event, func);
    }
    return dom;
  },
  addClass: function addClass(elem, className) {
    if (elem.className === undefined) {
      elem.className = className;
    } else if (elem.className !== className) {
      var classes = elem.className.split(/ +/);
      if (classes.indexOf(className) === -1) {
        classes.push(className);
        elem.className = classes.join(' ').replace(/^\s+/, '').replace(/\s+$/, '');
      }
    }
    return dom;
  },
  removeClass: function removeClass(elem, className) {
    if (className) {
      if (elem.className === className) {
        elem.removeAttribute('class');
      } else {
        var classes = elem.className.split(/ +/);
        var index = classes.indexOf(className);
        if (index !== -1) {
          classes.splice(index, 1);
          elem.className = classes.join(' ');
        }
      }
    } else {
      elem.className = undefined;
    }
    return dom;
  },
  hasClass: function hasClass(elem, className) {
    return new RegExp('(?:^|\\s+)' + className + '(?:\\s+|$)').test(elem.className) || false;
  },
  getWidth: function getWidth(elem) {
    var style = getComputedStyle(elem);
    return cssValueToPixels(style['border-left-width']) + cssValueToPixels(style['border-right-width']) + cssValueToPixels(style['padding-left']) + cssValueToPixels(style['padding-right']) + cssValueToPixels(style.width);
  },
  getHeight: function getHeight(elem) {
    var style = getComputedStyle(elem);
    return cssValueToPixels(style['border-top-width']) + cssValueToPixels(style['border-bottom-width']) + cssValueToPixels(style['padding-top']) + cssValueToPixels(style['padding-bottom']) + cssValueToPixels(style.height);
  },
  getOffset: function getOffset(el) {
    var elem = el;
    var offset = { left: 0, top: 0 };
    if (elem.offsetParent) {
      do {
        offset.left += elem.offsetLeft;
        offset.top += elem.offsetTop;
        elem = elem.offsetParent;
      } while (elem);
    }
    return offset;
  },
  isActive: function isActive(elem) {
    return elem === document.activeElement && (elem.type || elem.href);
  }
};

var BooleanController = function (_Controller) {
  inherits(BooleanController, _Controller);
  function BooleanController(object, property) {
    classCallCheck(this, BooleanController);
    var _this2 = possibleConstructorReturn(this, (BooleanController.__proto__ || Object.getPrototypeOf(BooleanController)).call(this, object, property));
    var _this = _this2;
    _this2.__prev = _this2.getValue();
    _this2.__checkbox = document.createElement('input');
    _this2.__checkbox.setAttribute('type', 'checkbox');
    function onChange() {
      _this.setValue(!_this.__prev);
    }
    dom.bind(_this2.__checkbox, 'change', onChange, false);
    _this2.domElement.appendChild(_this2.__checkbox);
    _this2.updateDisplay();
    return _this2;
  }
  createClass(BooleanController, [{
    key: 'setValue',
    value: function setValue(v) {
      var toReturn = get(BooleanController.prototype.__proto__ || Object.getPrototypeOf(BooleanController.prototype), 'setValue', this).call(this, v);
      if (this.__onFinishChange) {
        this.__onFinishChange.call(this, this.getValue());
      }
      this.__prev = this.getValue();
      return toReturn;
    }
  }, {
    key: 'updateDisplay',
    value: function updateDisplay() {
      if (this.getValue() === true) {
        this.__checkbox.setAttribute('checked', 'checked');
        this.__checkbox.checked = true;
        this.__prev = true;
      } else {
        this.__checkbox.checked = false;
        this.__prev = false;
      }
      return get(BooleanController.prototype.__proto__ || Object.getPrototypeOf(BooleanController.prototype), 'updateDisplay', this).call(this);
    }
  }]);
  return BooleanController;
}(Controller);

var OptionController = function (_Controller) {
  inherits(OptionController, _Controller);
  function OptionController(object, property, opts) {
    classCallCheck(this, OptionController);
    var _this2 = possibleConstructorReturn(this, (OptionController.__proto__ || Object.getPrototypeOf(OptionController)).call(this, object, property));
    var options = opts;
    var _this = _this2;
    _this2.__select = document.createElement('select');
    if (Common.isArray(options)) {
      var map = {};
      Common.each(options, function (element) {
        map[element] = element;
      });
      options = map;
    }
    Common.each(options, function (value, key) {
      var opt = document.createElement('option');
      opt.innerHTML = key;
      opt.setAttribute('value', value);
      _this.__select.appendChild(opt);
    });
    _this2.updateDisplay();
    dom.bind(_this2.__select, 'change', function () {
      var desiredValue = this.options[this.selectedIndex].value;
      _this.setValue(desiredValue);
    });
    _this2.domElement.appendChild(_this2.__select);
    return _this2;
  }
  createClass(OptionController, [{
    key: 'setValue',
    value: function setValue(v) {
      var toReturn = get(OptionController.prototype.__proto__ || Object.getPrototypeOf(OptionController.prototype), 'setValue', this).call(this, v);
      if (this.__onFinishChange) {
        this.__onFinishChange.call(this, this.getValue());
      }
      return toReturn;
    }
  }, {
    key: 'updateDisplay',
    value: function updateDisplay() {
      if (dom.isActive(this.__select)) return this;
      this.__select.value = this.getValue();
      return get(OptionController.prototype.__proto__ || Object.getPrototypeOf(OptionController.prototype), 'updateDisplay', this).call(this);
    }
  }]);
  return OptionController;
}(Controller);

var StringController = function (_Controller) {
  inherits(StringController, _Controller);
  function StringController(object, property) {
    classCallCheck(this, StringController);
    var _this2 = possibleConstructorReturn(this, (StringController.__proto__ || Object.getPrototypeOf(StringController)).call(this, object, property));
    var _this = _this2;
    function onChange() {
      _this.setValue(_this.__input.value);
    }
    function onBlur() {
      if (_this.__onFinishChange) {
        _this.__onFinishChange.call(_this, _this.getValue());
      }
    }
    _this2.__input = document.createElement('input');
    _this2.__input.setAttribute('type', 'text');
    dom.bind(_this2.__input, 'keyup', onChange);
    dom.bind(_this2.__input, 'change', onChange);
    dom.bind(_this2.__input, 'blur', onBlur);
    dom.bind(_this2.__input, 'keydown', function (e) {
      if (e.keyCode === 13) {
        this.blur();
      }
    });
    _this2.updateDisplay();
    _this2.domElement.appendChild(_this2.__input);
    return _this2;
  }
  createClass(StringController, [{
    key: 'updateDisplay',
    value: function updateDisplay() {
      if (!dom.isActive(this.__input)) {
        this.__input.value = this.getValue();
      }
      return get(StringController.prototype.__proto__ || Object.getPrototypeOf(StringController.prototype), 'updateDisplay', this).call(this);
    }
  }]);
  return StringController;
}(Controller);

function numDecimals(x) {
  var _x = x.toString();
  if (_x.indexOf('.') > -1) {
    return _x.length - _x.indexOf('.') - 1;
  }
  return 0;
}
var NumberController = function (_Controller) {
  inherits(NumberController, _Controller);
  function NumberController(object, property, params) {
    classCallCheck(this, NumberController);
    var _this = possibleConstructorReturn(this, (NumberController.__proto__ || Object.getPrototypeOf(NumberController)).call(this, object, property));
    var _params = params || {};
    _this.__min = _params.min;
    _this.__max = _params.max;
    _this.__step = _params.step;
    if (Common.isUndefined(_this.__step)) {
      if (_this.initialValue === 0) {
        _this.__impliedStep = 1;
      } else {
        _this.__impliedStep = Math.pow(10, Math.floor(Math.log(Math.abs(_this.initialValue)) / Math.LN10)) / 10;
      }
    } else {
      _this.__impliedStep = _this.__step;
    }
    _this.__precision = numDecimals(_this.__impliedStep);
    return _this;
  }
  createClass(NumberController, [{
    key: 'setValue',
    value: function setValue(v) {
      var _v = v;
      if (this.__min !== undefined && _v < this.__min) {
        _v = this.__min;
      } else if (this.__max !== undefined && _v > this.__max) {
        _v = this.__max;
      }
      if (this.__step !== undefined && _v % this.__step !== 0) {
        _v = Math.round(_v / this.__step) * this.__step;
      }
      return get(NumberController.prototype.__proto__ || Object.getPrototypeOf(NumberController.prototype), 'setValue', this).call(this, _v);
    }
  }, {
    key: 'min',
    value: function min(minValue) {
      this.__min = minValue;
      return this;
    }
  }, {
    key: 'max',
    value: function max(maxValue) {
      this.__max = maxValue;
      return this;
    }
  }, {
    key: 'step',
    value: function step(stepValue) {
      this.__step = stepValue;
      this.__impliedStep = stepValue;
      this.__precision = numDecimals(stepValue);
      return this;
    }
  }]);
  return NumberController;
}(Controller);

function roundToDecimal(value, decimals) {
  var tenTo = Math.pow(10, decimals);
  return Math.round(value * tenTo) / tenTo;
}
var NumberControllerBox = function (_NumberController) {
  inherits(NumberControllerBox, _NumberController);
  function NumberControllerBox(object, property, params) {
    classCallCheck(this, NumberControllerBox);
    var _this2 = possibleConstructorReturn(this, (NumberControllerBox.__proto__ || Object.getPrototypeOf(NumberControllerBox)).call(this, object, property, params));
    _this2.__truncationSuspended = false;
    var _this = _this2;
    var prevY = void 0;
    function onChange() {
      var attempted = parseFloat(_this.__input.value);
      if (!Common.isNaN(attempted)) {
        _this.setValue(attempted);
      }
    }
    function onFinish() {
      if (_this.__onFinishChange) {
        _this.__onFinishChange.call(_this, _this.getValue());
      }
    }
    function onBlur() {
      onFinish();
    }
    function onMouseDrag(e) {
      var diff = prevY - e.clientY;
      _this.setValue(_this.getValue() + diff * _this.__impliedStep);
      prevY = e.clientY;
    }
    function onMouseUp() {
      dom.unbind(window, 'mousemove', onMouseDrag);
      dom.unbind(window, 'mouseup', onMouseUp);
      onFinish();
    }
    function onMouseDown(e) {
      dom.bind(window, 'mousemove', onMouseDrag);
      dom.bind(window, 'mouseup', onMouseUp);
      prevY = e.clientY;
    }
    _this2.__input = document.createElement('input');
    _this2.__input.setAttribute('type', 'text');
    dom.bind(_this2.__input, 'change', onChange);
    dom.bind(_this2.__input, 'blur', onBlur);
    dom.bind(_this2.__input, 'mousedown', onMouseDown);
    dom.bind(_this2.__input, 'keydown', function (e) {
      if (e.keyCode === 13) {
        _this.__truncationSuspended = true;
        this.blur();
        _this.__truncationSuspended = false;
        onFinish();
      }
    });
    _this2.updateDisplay();
    _this2.domElement.appendChild(_this2.__input);
    return _this2;
  }
  createClass(NumberControllerBox, [{
    key: 'updateDisplay',
    value: function updateDisplay() {
      this.__input.value = this.__truncationSuspended ? this.getValue() : roundToDecimal(this.getValue(), this.__precision);
      return get(NumberControllerBox.prototype.__proto__ || Object.getPrototypeOf(NumberControllerBox.prototype), 'updateDisplay', this).call(this);
    }
  }]);
  return NumberControllerBox;
}(NumberController);

function map(v, i1, i2, o1, o2) {
  return o1 + (o2 - o1) * ((v - i1) / (i2 - i1));
}
var NumberControllerSlider = function (_NumberController) {
  inherits(NumberControllerSlider, _NumberController);
  function NumberControllerSlider(object, property, min, max, step) {
    classCallCheck(this, NumberControllerSlider);
    var _this2 = possibleConstructorReturn(this, (NumberControllerSlider.__proto__ || Object.getPrototypeOf(NumberControllerSlider)).call(this, object, property, { min: min, max: max, step: step }));
    var _this = _this2;
    _this2.__background = document.createElement('div');
    _this2.__foreground = document.createElement('div');
    dom.bind(_this2.__background, 'mousedown', onMouseDown);
    dom.bind(_this2.__background, 'touchstart', onTouchStart);
    dom.addClass(_this2.__background, 'slider');
    dom.addClass(_this2.__foreground, 'slider-fg');
    function onMouseDown(e) {
      document.activeElement.blur();
      dom.bind(window, 'mousemove', onMouseDrag);
      dom.bind(window, 'mouseup', onMouseUp);
      onMouseDrag(e);
    }
    function onMouseDrag(e) {
      e.preventDefault();
      var bgRect = _this.__background.getBoundingClientRect();
      _this.setValue(map(e.clientX, bgRect.left, bgRect.right, _this.__min, _this.__max));
      return false;
    }
    function onMouseUp() {
      dom.unbind(window, 'mousemove', onMouseDrag);
      dom.unbind(window, 'mouseup', onMouseUp);
      if (_this.__onFinishChange) {
        _this.__onFinishChange.call(_this, _this.getValue());
      }
    }
    function onTouchStart(e) {
      if (e.touches.length !== 1) {
        return;
      }
      dom.bind(window, 'touchmove', onTouchMove);
      dom.bind(window, 'touchend', onTouchEnd);
      onTouchMove(e);
    }
    function onTouchMove(e) {
      var clientX = e.touches[0].clientX;
      var bgRect = _this.__background.getBoundingClientRect();
      _this.setValue(map(clientX, bgRect.left, bgRect.right, _this.__min, _this.__max));
    }
    function onTouchEnd() {
      dom.unbind(window, 'touchmove', onTouchMove);
      dom.unbind(window, 'touchend', onTouchEnd);
      if (_this.__onFinishChange) {
        _this.__onFinishChange.call(_this, _this.getValue());
      }
    }
    _this2.updateDisplay();
    _this2.__background.appendChild(_this2.__foreground);
    _this2.domElement.appendChild(_this2.__background);
    return _this2;
  }
  createClass(NumberControllerSlider, [{
    key: 'updateDisplay',
    value: function updateDisplay() {
      var pct = (this.getValue() - this.__min) / (this.__max - this.__min);
      this.__foreground.style.width = pct * 100 + '%';
      return get(NumberControllerSlider.prototype.__proto__ || Object.getPrototypeOf(NumberControllerSlider.prototype), 'updateDisplay', this).call(this);
    }
  }]);
  return NumberControllerSlider;
}(NumberController);

var FunctionController = function (_Controller) {
  inherits(FunctionController, _Controller);
  function FunctionController(object, property, text) {
    classCallCheck(this, FunctionController);
    var _this2 = possibleConstructorReturn(this, (FunctionController.__proto__ || Object.getPrototypeOf(FunctionController)).call(this, object, property));
    var _this = _this2;
    _this2.__button = document.createElement('div');
    _this2.__button.innerHTML = text === undefined ? 'Fire' : text;
    dom.bind(_this2.__button, 'click', function (e) {
      e.preventDefault();
      _this.fire();
      return false;
    });
    dom.addClass(_this2.__button, 'button');
    _this2.domElement.appendChild(_this2.__button);
    return _this2;
  }
  createClass(FunctionController, [{
    key: 'fire',
    value: function fire() {
      if (this.__onChange) {
        this.__onChange.call(this);
      }
      this.getValue().call(this.object);
      if (this.__onFinishChange) {
        this.__onFinishChange.call(this, this.getValue());
      }
    }
  }]);
  return FunctionController;
}(Controller);

var ColorController = function (_Controller) {
  inherits(ColorController, _Controller);
  function ColorController(object, property) {
    classCallCheck(this, ColorController);
    var _this2 = possibleConstructorReturn(this, (ColorController.__proto__ || Object.getPrototypeOf(ColorController)).call(this, object, property));
    _this2.__color = new Color(_this2.getValue());
    _this2.__temp = new Color(0);
    var _this = _this2;
    _this2.domElement = document.createElement('div');
    dom.makeSelectable(_this2.domElement, false);
    _this2.__selector = document.createElement('div');
    _this2.__selector.className = 'selector';
    _this2.__saturation_field = document.createElement('div');
    _this2.__saturation_field.className = 'saturation-field';
    _this2.__field_knob = document.createElement('div');
    _this2.__field_knob.className = 'field-knob';
    _this2.__field_knob_border = '2px solid ';
    _this2.__hue_knob = document.createElement('div');
    _this2.__hue_knob.className = 'hue-knob';
    _this2.__hue_field = document.createElement('div');
    _this2.__hue_field.className = 'hue-field';
    _this2.__input = document.createElement('input');
    _this2.__input.type = 'text';
    _this2.__input_textShadow = '0 1px 1px ';
    dom.bind(_this2.__input, 'keydown', function (e) {
      if (e.keyCode === 13) {
        onBlur.call(this);
      }
    });
    dom.bind(_this2.__input, 'blur', onBlur);
    dom.bind(_this2.__selector, 'mousedown', function ()        {
      dom.addClass(this, 'drag').bind(window, 'mouseup', function ()        {
        dom.removeClass(_this.__selector, 'drag');
      });
    });
    dom.bind(_this2.__selector, 'touchstart', function ()        {
      dom.addClass(this, 'drag').bind(window, 'touchend', function ()        {
        dom.removeClass(_this.__selector, 'drag');
      });
    });
    var valueField = document.createElement('div');
    Common.extend(_this2.__selector.style, {
      width: '122px',
      height: '102px',
      padding: '3px',
      backgroundColor: '#222',
      boxShadow: '0px 1px 3px rgba(0,0,0,0.3)'
    });
    Common.extend(_this2.__field_knob.style, {
      position: 'absolute',
      width: '12px',
      height: '12px',
      border: _this2.__field_knob_border + (_this2.__color.v < 0.5 ? '#fff' : '#000'),
      boxShadow: '0px 1px 3px rgba(0,0,0,0.5)',
      borderRadius: '12px',
      zIndex: 1
    });
    Common.extend(_this2.__hue_knob.style, {
      position: 'absolute',
      width: '15px',
      height: '2px',
      borderRight: '4px solid #fff',
      zIndex: 1
    });
    Common.extend(_this2.__saturation_field.style, {
      width: '100px',
      height: '100px',
      border: '1px solid #555',
      marginRight: '3px',
      display: 'inline-block',
      cursor: 'pointer'
    });
    Common.extend(valueField.style, {
      width: '100%',
      height: '100%',
      background: 'none'
    });
    linearGradient(valueField, 'top', 'rgba(0,0,0,0)', '#000');
    Common.extend(_this2.__hue_field.style, {
      width: '15px',
      height: '100px',
      border: '1px solid #555',
      cursor: 'ns-resize',
      position: 'absolute',
      top: '3px',
      right: '3px'
    });
    hueGradient(_this2.__hue_field);
    Common.extend(_this2.__input.style, {
      outline: 'none',
      textAlign: 'center',
      color: '#fff',
      border: 0,
      fontWeight: 'bold',
      textShadow: _this2.__input_textShadow + 'rgba(0,0,0,0.7)'
    });
    dom.bind(_this2.__saturation_field, 'mousedown', fieldDown);
    dom.bind(_this2.__saturation_field, 'touchstart', fieldDown);
    dom.bind(_this2.__field_knob, 'mousedown', fieldDown);
    dom.bind(_this2.__field_knob, 'touchstart', fieldDown);
    dom.bind(_this2.__hue_field, 'mousedown', fieldDownH);
    dom.bind(_this2.__hue_field, 'touchstart', fieldDownH);
    function fieldDown(e) {
      setSV(e);
      dom.bind(window, 'mousemove', setSV);
      dom.bind(window, 'touchmove', setSV);
      dom.bind(window, 'mouseup', fieldUpSV);
      dom.bind(window, 'touchend', fieldUpSV);
    }
    function fieldDownH(e) {
      setH(e);
      dom.bind(window, 'mousemove', setH);
      dom.bind(window, 'touchmove', setH);
      dom.bind(window, 'mouseup', fieldUpH);
      dom.bind(window, 'touchend', fieldUpH);
    }
    function fieldUpSV() {
      dom.unbind(window, 'mousemove', setSV);
      dom.unbind(window, 'touchmove', setSV);
      dom.unbind(window, 'mouseup', fieldUpSV);
      dom.unbind(window, 'touchend', fieldUpSV);
      onFinish();
    }
    function fieldUpH() {
      dom.unbind(window, 'mousemove', setH);
      dom.unbind(window, 'touchmove', setH);
      dom.unbind(window, 'mouseup', fieldUpH);
      dom.unbind(window, 'touchend', fieldUpH);
      onFinish();
    }
    function onBlur() {
      var i = interpret(this.value);
      if (i !== false) {
        _this.__color.__state = i;
        _this.setValue(_this.__color.toOriginal());
      } else {
        this.value = _this.__color.toString();
      }
    }
    function onFinish() {
      if (_this.__onFinishChange) {
        _this.__onFinishChange.call(_this, _this.__color.toOriginal());
      }
    }
    _this2.__saturation_field.appendChild(valueField);
    _this2.__selector.appendChild(_this2.__field_knob);
    _this2.__selector.appendChild(_this2.__saturation_field);
    _this2.__selector.appendChild(_this2.__hue_field);
    _this2.__hue_field.appendChild(_this2.__hue_knob);
    _this2.domElement.appendChild(_this2.__input);
    _this2.domElement.appendChild(_this2.__selector);
    _this2.updateDisplay();
    function setSV(e) {
      if (e.type.indexOf('touch') === -1) {
        e.preventDefault();
      }
      var fieldRect = _this.__saturation_field.getBoundingClientRect();
      var _ref = e.touches && e.touches[0] || e,
          clientX = _ref.clientX,
          clientY = _ref.clientY;
      var s = (clientX - fieldRect.left) / (fieldRect.right - fieldRect.left);
      var v = 1 - (clientY - fieldRect.top) / (fieldRect.bottom - fieldRect.top);
      if (v > 1) {
        v = 1;
      } else if (v < 0) {
        v = 0;
      }
      if (s > 1) {
        s = 1;
      } else if (s < 0) {
        s = 0;
      }
      _this.__color.v = v;
      _this.__color.s = s;
      _this.setValue(_this.__color.toOriginal());
      return false;
    }
    function setH(e) {
      if (e.type.indexOf('touch') === -1) {
        e.preventDefault();
      }
      var fieldRect = _this.__hue_field.getBoundingClientRect();
      var _ref2 = e.touches && e.touches[0] || e,
          clientY = _ref2.clientY;
      var h = 1 - (clientY - fieldRect.top) / (fieldRect.bottom - fieldRect.top);
      if (h > 1) {
        h = 1;
      } else if (h < 0) {
        h = 0;
      }
      _this.__color.h = h * 360;
      _this.setValue(_this.__color.toOriginal());
      return false;
    }
    return _this2;
  }
  createClass(ColorController, [{
    key: 'updateDisplay',
    value: function updateDisplay() {
      var i = interpret(this.getValue());
      if (i !== false) {
        var mismatch = false;
        Common.each(Color.COMPONENTS, function (component) {
          if (!Common.isUndefined(i[component]) && !Common.isUndefined(this.__color.__state[component]) && i[component] !== this.__color.__state[component]) {
            mismatch = true;
            return {};
          }
        }, this);
        if (mismatch) {
          Common.extend(this.__color.__state, i);
        }
      }
      Common.extend(this.__temp.__state, this.__color.__state);
      this.__temp.a = 1;
      var flip = this.__color.v < 0.5 || this.__color.s > 0.5 ? 255 : 0;
      var _flip = 255 - flip;
      Common.extend(this.__field_knob.style, {
        marginLeft: 100 * this.__color.s - 7 + 'px',
        marginTop: 100 * (1 - this.__color.v) - 7 + 'px',
        backgroundColor: this.__temp.toHexString(),
        border: this.__field_knob_border + 'rgb(' + flip + ',' + flip + ',' + flip + ')'
      });
      this.__hue_knob.style.marginTop = (1 - this.__color.h / 360) * 100 + 'px';
      this.__temp.s = 1;
      this.__temp.v = 1;
      linearGradient(this.__saturation_field, 'left', '#fff', this.__temp.toHexString());
      this.__input.value = this.__color.toString();
      Common.extend(this.__input.style, {
        backgroundColor: this.__color.toHexString(),
        color: 'rgb(' + flip + ',' + flip + ',' + flip + ')',
        textShadow: this.__input_textShadow + 'rgba(' + _flip + ',' + _flip + ',' + _flip + ',.7)'
      });
    }
  }]);
  return ColorController;
}(Controller);
var vendors = ['-moz-', '-o-', '-webkit-', '-ms-', ''];
function linearGradient(elem, x, a, b) {
  elem.style.background = '';
  Common.each(vendors, function (vendor) {
    elem.style.cssText += 'background: ' + vendor + 'linear-gradient(' + x + ', ' + a + ' 0%, ' + b + ' 100%); ';
  });
}
function hueGradient(elem) {
  elem.style.background = '';
  elem.style.cssText += 'background: -moz-linear-gradient(top,  #ff0000 0%, #ff00ff 17%, #0000ff 34%, #00ffff 50%, #00ff00 67%, #ffff00 84%, #ff0000 100%);';
  elem.style.cssText += 'background: -webkit-linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);';
  elem.style.cssText += 'background: -o-linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);';
  elem.style.cssText += 'background: -ms-linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);';
  elem.style.cssText += 'background: linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);';
}

var css = {
  load: function load(url, indoc) {
    var doc = indoc || document;
    var link = doc.createElement('link');
    link.type = 'text/css';
    link.rel = 'stylesheet';
    link.href = url;
    doc.getElementsByTagName('head')[0].appendChild(link);
  },
  inject: function inject(cssContent, indoc) {
    var doc = indoc || document;
    var injected = document.createElement('style');
    injected.type = 'text/css';
    injected.innerHTML = cssContent;
    var head = doc.getElementsByTagName('head')[0];
    try {
      head.appendChild(injected);
    } catch (e) {
    }
  }
};

var saveDialogContents = "<div id=\"dg-save\" class=\"dg dialogue\">\n\n  Here's the new load parameter for your <code>GUI</code>'s constructor:\n\n  <textarea id=\"dg-new-constructor\"></textarea>\n\n  <div id=\"dg-save-locally\">\n\n    <input id=\"dg-local-storage\" type=\"checkbox\"/> Automatically save\n    values to <code>localStorage</code> on exit.\n\n    <div id=\"dg-local-explain\">The values saved to <code>localStorage</code> will\n      override those passed to <code>dat.GUI</code>'s constructor. This makes it\n      easier to work incrementally, but <code>localStorage</code> is fragile,\n      and your friends may not see the same values you do.\n\n    </div>\n\n  </div>\n\n</div>";

var ControllerFactory = function ControllerFactory(object, property) {
  var initialValue = object[property];
  if (Common.isArray(arguments[2]) || Common.isObject(arguments[2])) {
    return new OptionController(object, property, arguments[2]);
  }
  if (Common.isNumber(initialValue)) {
    if (Common.isNumber(arguments[2]) && Common.isNumber(arguments[3])) {
      if (Common.isNumber(arguments[4])) {
        return new NumberControllerSlider(object, property, arguments[2], arguments[3], arguments[4]);
      }
      return new NumberControllerSlider(object, property, arguments[2], arguments[3]);
    }
    if (Common.isNumber(arguments[4])) {
      return new NumberControllerBox(object, property, { min: arguments[2], max: arguments[3], step: arguments[4] });
    }
    return new NumberControllerBox(object, property, { min: arguments[2], max: arguments[3] });
  }
  if (Common.isString(initialValue)) {
    return new StringController(object, property);
  }
  if (Common.isFunction(initialValue)) {
    return new FunctionController(object, property, '');
  }
  if (Common.isBoolean(initialValue)) {
    return new BooleanController(object, property);
  }
  return null;
};

function requestAnimationFrame(callback) {
  setTimeout(callback, 1000 / 60);
}
var requestAnimationFrame$1 = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || requestAnimationFrame;

var CenteredDiv = function () {
  function CenteredDiv() {
    classCallCheck(this, CenteredDiv);
    this.backgroundElement = document.createElement('div');
    Common.extend(this.backgroundElement.style, {
      backgroundColor: 'rgba(0,0,0,0.8)',
      top: 0,
      left: 0,
      display: 'none',
      zIndex: '1000',
      opacity: 0,
      WebkitTransition: 'opacity 0.2s linear',
      transition: 'opacity 0.2s linear'
    });
    dom.makeFullscreen(this.backgroundElement);
    this.backgroundElement.style.position = 'fixed';
    this.domElement = document.createElement('div');
    Common.extend(this.domElement.style, {
      position: 'fixed',
      display: 'none',
      zIndex: '1001',
      opacity: 0,
      WebkitTransition: '-webkit-transform 0.2s ease-out, opacity 0.2s linear',
      transition: 'transform 0.2s ease-out, opacity 0.2s linear'
    });
    document.body.appendChild(this.backgroundElement);
    document.body.appendChild(this.domElement);
    var _this = this;
    dom.bind(this.backgroundElement, 'click', function () {
      _this.hide();
    });
  }
  createClass(CenteredDiv, [{
    key: 'show',
    value: function show() {
      var _this = this;
      this.backgroundElement.style.display = 'block';
      this.domElement.style.display = 'block';
      this.domElement.style.opacity = 0;
      this.domElement.style.webkitTransform = 'scale(1.1)';
      this.layout();
      Common.defer(function () {
        _this.backgroundElement.style.opacity = 1;
        _this.domElement.style.opacity = 1;
        _this.domElement.style.webkitTransform = 'scale(1)';
      });
    }
  }, {
    key: 'hide',
    value: function hide() {
      var _this = this;
      var hide = function hide() {
        _this.domElement.style.display = 'none';
        _this.backgroundElement.style.display = 'none';
        dom.unbind(_this.domElement, 'webkitTransitionEnd', hide);
        dom.unbind(_this.domElement, 'transitionend', hide);
        dom.unbind(_this.domElement, 'oTransitionEnd', hide);
      };
      dom.bind(this.domElement, 'webkitTransitionEnd', hide);
      dom.bind(this.domElement, 'transitionend', hide);
      dom.bind(this.domElement, 'oTransitionEnd', hide);
      this.backgroundElement.style.opacity = 0;
      this.domElement.style.opacity = 0;
      this.domElement.style.webkitTransform = 'scale(1.1)';
    }
  }, {
    key: 'layout',
    value: function layout() {
      this.domElement.style.left = window.innerWidth / 2 - dom.getWidth(this.domElement) / 2 + 'px';
      this.domElement.style.top = window.innerHeight / 2 - dom.getHeight(this.domElement) / 2 + 'px';
    }
  }]);
  return CenteredDiv;
}();

var styleSheet = ___$insertStyle(".dg ul{list-style:none;margin:0;padding:0;width:100%;clear:both}.dg.ac{position:fixed;top:0;left:0;right:0;height:0;z-index:0}.dg:not(.ac) .main{overflow:hidden}.dg.main{-webkit-transition:opacity .1s linear;-o-transition:opacity .1s linear;-moz-transition:opacity .1s linear;transition:opacity .1s linear}.dg.main.taller-than-window{overflow-y:auto}.dg.main.taller-than-window .close-button{opacity:1;margin-top:-1px;border-top:1px solid #2c2c2c}.dg.main ul.closed .close-button{opacity:1 !important}.dg.main:hover .close-button,.dg.main .close-button.drag{opacity:1}.dg.main .close-button{-webkit-transition:opacity .1s linear;-o-transition:opacity .1s linear;-moz-transition:opacity .1s linear;transition:opacity .1s linear;border:0;line-height:19px;height:20px;cursor:pointer;text-align:center;background-color:#000}.dg.main .close-button.close-top{position:relative}.dg.main .close-button.close-bottom{position:absolute}.dg.main .close-button:hover{background-color:#111}.dg.a{float:right;margin-right:15px;overflow-y:visible}.dg.a.has-save>ul.close-top{margin-top:0}.dg.a.has-save>ul.close-bottom{margin-top:27px}.dg.a.has-save>ul.closed{margin-top:0}.dg.a .save-row{top:0;z-index:1002}.dg.a .save-row.close-top{position:relative}.dg.a .save-row.close-bottom{position:fixed}.dg li{-webkit-transition:height .1s ease-out;-o-transition:height .1s ease-out;-moz-transition:height .1s ease-out;transition:height .1s ease-out;-webkit-transition:overflow .1s linear;-o-transition:overflow .1s linear;-moz-transition:overflow .1s linear;transition:overflow .1s linear}.dg li:not(.folder){cursor:auto;height:27px;line-height:27px;padding:0 4px 0 5px}.dg li.folder{padding:0;border-left:4px solid transparent}.dg li.title{cursor:pointer;margin-left:-4px}.dg .closed li:not(.title),.dg .closed ul li,.dg .closed ul li>*{height:0;overflow:hidden;border:0}.dg .cr{clear:both;padding-left:3px;height:27px;overflow:hidden}.dg .property-name{cursor:default;float:left;clear:left;width:40%;overflow:hidden;text-overflow:ellipsis}.dg .c{float:left;width:60%;position:relative}.dg .c input[type=text]{border:0;margin-top:4px;padding:3px;width:100%;float:right}.dg .has-slider input[type=text]{width:30%;margin-left:0}.dg .slider{float:left;width:66%;margin-left:-5px;margin-right:0;height:19px;margin-top:4px}.dg .slider-fg{height:100%}.dg .c input[type=checkbox]{margin-top:7px}.dg .c select{margin-top:5px}.dg .cr.function,.dg .cr.function .property-name,.dg .cr.function *,.dg .cr.boolean,.dg .cr.boolean *{cursor:pointer}.dg .cr.color{overflow:visible}.dg .selector{display:none;position:absolute;margin-left:-9px;margin-top:23px;z-index:10}.dg .c:hover .selector,.dg .selector.drag{display:block}.dg li.save-row{padding:0}.dg li.save-row .button{display:inline-block;padding:0px 6px}.dg.dialogue{background-color:#222;width:460px;padding:15px;font-size:13px;line-height:15px}#dg-new-constructor{padding:10px;color:#222;font-family:Monaco, monospace;font-size:10px;border:0;resize:none;box-shadow:inset 1px 1px 1px #888;word-wrap:break-word;margin:12px 0;display:block;width:440px;overflow-y:scroll;height:100px;position:relative}#dg-local-explain{display:none;font-size:11px;line-height:17px;border-radius:3px;background-color:#333;padding:8px;margin-top:10px}#dg-local-explain code{font-size:10px}#dat-gui-save-locally{display:none}.dg{color:#eee;font:11px 'Lucida Grande', sans-serif;text-shadow:0 -1px 0 #111}.dg.main::-webkit-scrollbar{width:5px;background:#1a1a1a}.dg.main::-webkit-scrollbar-corner{height:0;display:none}.dg.main::-webkit-scrollbar-thumb{border-radius:5px;background:#676767}.dg li:not(.folder){background:#1a1a1a;border-bottom:1px solid #2c2c2c}.dg li.save-row{line-height:25px;background:#dad5cb;border:0}.dg li.save-row select{margin-left:5px;width:108px}.dg li.save-row .button{margin-left:5px;margin-top:1px;border-radius:2px;font-size:9px;line-height:7px;padding:4px 4px 5px 4px;background:#c5bdad;color:#fff;text-shadow:0 1px 0 #b0a58f;box-shadow:0 -1px 0 #b0a58f;cursor:pointer}.dg li.save-row .button.gears{background:#c5bdad url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAANCAYAAAB/9ZQ7AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAQJJREFUeNpiYKAU/P//PwGIC/ApCABiBSAW+I8AClAcgKxQ4T9hoMAEUrxx2QSGN6+egDX+/vWT4e7N82AMYoPAx/evwWoYoSYbACX2s7KxCxzcsezDh3evFoDEBYTEEqycggWAzA9AuUSQQgeYPa9fPv6/YWm/Acx5IPb7ty/fw+QZblw67vDs8R0YHyQhgObx+yAJkBqmG5dPPDh1aPOGR/eugW0G4vlIoTIfyFcA+QekhhHJhPdQxbiAIguMBTQZrPD7108M6roWYDFQiIAAv6Aow/1bFwXgis+f2LUAynwoIaNcz8XNx3Dl7MEJUDGQpx9gtQ8YCueB+D26OECAAQDadt7e46D42QAAAABJRU5ErkJggg==) 2px 1px no-repeat;height:7px;width:8px}.dg li.save-row .button:hover{background-color:#bab19e;box-shadow:0 -1px 0 #b0a58f}.dg li.folder{border-bottom:0}.dg li.title{padding-left:16px;background:#000 url(data:image/gif;base64,R0lGODlhBQAFAJEAAP////Pz8////////yH5BAEAAAIALAAAAAAFAAUAAAIIlI+hKgFxoCgAOw==) 6px 10px no-repeat;cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.2)}.dg .closed li.title{background-image:url(data:image/gif;base64,R0lGODlhBQAFAJEAAP////Pz8////////yH5BAEAAAIALAAAAAAFAAUAAAIIlGIWqMCbWAEAOw==)}.dg .cr.boolean{border-left:3px solid #806787}.dg .cr.color{border-left:3px solid}.dg .cr.function{border-left:3px solid #e61d5f}.dg .cr.number{border-left:3px solid #2FA1D6}.dg .cr.number input[type=text]{color:#2FA1D6}.dg .cr.string{border-left:3px solid #1ed36f}.dg .cr.string input[type=text]{color:#1ed36f}.dg .cr.function:hover,.dg .cr.boolean:hover{background:#111}.dg .c input[type=text]{background:#303030;outline:none}.dg .c input[type=text]:hover{background:#3c3c3c}.dg .c input[type=text]:focus{background:#494949;color:#fff}.dg .c .slider{background:#303030;cursor:ew-resize}.dg .c .slider-fg{background:#2FA1D6;max-width:100%}.dg .c .slider:hover{background:#3c3c3c}.dg .c .slider:hover .slider-fg{background:#44abda}\n");

css.inject(styleSheet);
var CSS_NAMESPACE = 'dg';
var HIDE_KEY_CODE = 72;
var CLOSE_BUTTON_HEIGHT = 20;
var DEFAULT_DEFAULT_PRESET_NAME = 'Default';
var SUPPORTS_LOCAL_STORAGE = function () {
  try {
    return 'localStorage' in window && window.localStorage !== null;
  } catch (e) {
    return false;
  }
}();
var SAVE_DIALOGUE = void 0;
var autoPlaceVirgin = true;
var autoPlaceContainer = void 0;
var hide = false;
var hideableGuis = [];
var GUI = function GUI(pars) {
  var _this = this;
  var params = pars || {};
  this.domElement = document.createElement('div');
  this.__ul = document.createElement('ul');
  this.domElement.appendChild(this.__ul);
  dom.addClass(this.domElement, CSS_NAMESPACE);
  this.__folders = {};
  this.__controllers = [];
  this.__rememberedObjects = [];
  this.__rememberedObjectIndecesToControllers = [];
  this.__listening = [];
  params = Common.defaults(params, {
    closeOnTop: false,
    autoPlace: true,
    width: GUI.DEFAULT_WIDTH
  });
  params = Common.defaults(params, {
    resizable: params.autoPlace,
    hideable: params.autoPlace
  });
  if (!Common.isUndefined(params.load)) {
    if (params.preset) {
      params.load.preset = params.preset;
    }
  } else {
    params.load = { preset: DEFAULT_DEFAULT_PRESET_NAME };
  }
  if (Common.isUndefined(params.parent) && params.hideable) {
    hideableGuis.push(this);
  }
  params.resizable = Common.isUndefined(params.parent) && params.resizable;
  if (params.autoPlace && Common.isUndefined(params.scrollable)) {
    params.scrollable = true;
  }
  var useLocalStorage = SUPPORTS_LOCAL_STORAGE && localStorage.getItem(getLocalStorageHash(this, 'isLocal')) === 'true';
  var saveToLocalStorage = void 0;
  Object.defineProperties(this,
  {
    parent: {
      get: function get$$1() {
        return params.parent;
      }
    },
    scrollable: {
      get: function get$$1() {
        return params.scrollable;
      }
    },
    autoPlace: {
      get: function get$$1() {
        return params.autoPlace;
      }
    },
    closeOnTop: {
      get: function get$$1() {
        return params.closeOnTop;
      }
    },
    preset: {
      get: function get$$1() {
        if (_this.parent) {
          return _this.getRoot().preset;
        }
        return params.load.preset;
      },
      set: function set$$1(v) {
        if (_this.parent) {
          _this.getRoot().preset = v;
        } else {
          params.load.preset = v;
        }
        setPresetSelectIndex(this);
        _this.revert();
      }
    },
    width: {
      get: function get$$1() {
        return params.width;
      },
      set: function set$$1(v) {
        params.width = v;
        setWidth(_this, v);
      }
    },
    name: {
      get: function get$$1() {
        return params.name;
      },
      set: function set$$1(v) {
        params.name = v;
        if (titleRowName) {
          titleRowName.innerHTML = params.name;
        }
      }
    },
    closed: {
      get: function get$$1() {
        return params.closed;
      },
      set: function set$$1(v) {
        params.closed = v;
        if (params.closed) {
          dom.addClass(_this.__ul, GUI.CLASS_CLOSED);
        } else {
          dom.removeClass(_this.__ul, GUI.CLASS_CLOSED);
        }
        this.onResize();
        if (_this.__closeButton) {
          _this.__closeButton.innerHTML = v ? GUI.TEXT_OPEN : GUI.TEXT_CLOSED;
        }
      }
    },
    load: {
      get: function get$$1() {
        return params.load;
      }
    },
    useLocalStorage: {
      get: function get$$1() {
        return useLocalStorage;
      },
      set: function set$$1(bool) {
        if (SUPPORTS_LOCAL_STORAGE) {
          useLocalStorage = bool;
          if (bool) {
            dom.bind(window, 'unload', saveToLocalStorage);
          } else {
            dom.unbind(window, 'unload', saveToLocalStorage);
          }
          localStorage.setItem(getLocalStorageHash(_this, 'isLocal'), bool);
        }
      }
    }
  });
  if (Common.isUndefined(params.parent)) {
    params.closed = false;
    dom.addClass(this.domElement, GUI.CLASS_MAIN);
    dom.makeSelectable(this.domElement, false);
    if (SUPPORTS_LOCAL_STORAGE) {
      if (useLocalStorage) {
        _this.useLocalStorage = true;
        var savedGui = localStorage.getItem(getLocalStorageHash(this, 'gui'));
        if (savedGui) {
          params.load = JSON.parse(savedGui);
        }
      }
    }
    this.__closeButton = document.createElement('div');
    this.__closeButton.innerHTML = GUI.TEXT_CLOSED;
    dom.addClass(this.__closeButton, GUI.CLASS_CLOSE_BUTTON);
    if (params.closeOnTop) {
      dom.addClass(this.__closeButton, GUI.CLASS_CLOSE_TOP);
      this.domElement.insertBefore(this.__closeButton, this.domElement.childNodes[0]);
    } else {
      dom.addClass(this.__closeButton, GUI.CLASS_CLOSE_BOTTOM);
      this.domElement.appendChild(this.__closeButton);
    }
    dom.bind(this.__closeButton, 'click', function () {
      _this.closed = !_this.closed;
    });
  } else {
    if (params.closed === undefined) {
      params.closed = true;
    }
    var _titleRowName = document.createTextNode(params.name);
    dom.addClass(_titleRowName, 'controller-name');
    var titleRow = addRow(_this, _titleRowName);
    var onClickTitle = function onClickTitle(e) {
      e.preventDefault();
      _this.closed = !_this.closed;
      return false;
    };
    dom.addClass(this.__ul, GUI.CLASS_CLOSED);
    dom.addClass(titleRow, 'title');
    dom.bind(titleRow, 'click', onClickTitle);
    if (!params.closed) {
      this.closed = false;
    }
  }
  if (params.autoPlace) {
    if (Common.isUndefined(params.parent)) {
      if (autoPlaceVirgin) {
        autoPlaceContainer = document.createElement('div');
        dom.addClass(autoPlaceContainer, CSS_NAMESPACE);
        dom.addClass(autoPlaceContainer, GUI.CLASS_AUTO_PLACE_CONTAINER);
        document.body.appendChild(autoPlaceContainer);
        autoPlaceVirgin = false;
      }
      autoPlaceContainer.appendChild(this.domElement);
      dom.addClass(this.domElement, GUI.CLASS_AUTO_PLACE);
    }
    if (!this.parent) {
      setWidth(_this, params.width);
    }
  }
  this.__resizeHandler = function () {
    _this.onResizeDebounced();
  };
  dom.bind(window, 'resize', this.__resizeHandler);
  dom.bind(this.__ul, 'webkitTransitionEnd', this.__resizeHandler);
  dom.bind(this.__ul, 'transitionend', this.__resizeHandler);
  dom.bind(this.__ul, 'oTransitionEnd', this.__resizeHandler);
  this.onResize();
  if (params.resizable) {
    addResizeHandle(this);
  }
  saveToLocalStorage = function saveToLocalStorage() {
    if (SUPPORTS_LOCAL_STORAGE && localStorage.getItem(getLocalStorageHash(_this, 'isLocal')) === 'true') {
      localStorage.setItem(getLocalStorageHash(_this, 'gui'), JSON.stringify(_this.getSaveObject()));
    }
  };
  this.saveToLocalStorageIfPossible = saveToLocalStorage;
  function resetWidth() {
    var root = _this.getRoot();
    root.width += 1;
    Common.defer(function () {
      root.width -= 1;
    });
  }
  if (!params.parent) {
    resetWidth();
  }
};
GUI.toggleHide = function () {
  hide = !hide;
  Common.each(hideableGuis, function (gui) {
    gui.domElement.style.display = hide ? 'none' : '';
  });
};
GUI.CLASS_AUTO_PLACE = 'a';
GUI.CLASS_AUTO_PLACE_CONTAINER = 'ac';
GUI.CLASS_MAIN = 'main';
GUI.CLASS_CONTROLLER_ROW = 'cr';
GUI.CLASS_TOO_TALL = 'taller-than-window';
GUI.CLASS_CLOSED = 'closed';
GUI.CLASS_CLOSE_BUTTON = 'close-button';
GUI.CLASS_CLOSE_TOP = 'close-top';
GUI.CLASS_CLOSE_BOTTOM = 'close-bottom';
GUI.CLASS_DRAG = 'drag';
GUI.DEFAULT_WIDTH = 245;
GUI.TEXT_CLOSED = 'Close Controls';
GUI.TEXT_OPEN = 'Open Controls';
GUI._keydownHandler = function (e) {
  if (document.activeElement.type !== 'text' && (e.which === HIDE_KEY_CODE || e.keyCode === HIDE_KEY_CODE)) {
    GUI.toggleHide();
  }
};
dom.bind(window, 'keydown', GUI._keydownHandler, false);
Common.extend(GUI.prototype,
{
  add: function add(object, property) {
    return _add(this, object, property, {
      factoryArgs: Array.prototype.slice.call(arguments, 2)
    });
  },
  addColor: function addColor(object, property) {
    return _add(this, object, property, {
      color: true
    });
  },
  remove: function remove(controller) {
    this.__ul.removeChild(controller.__li);
    this.__controllers.splice(this.__controllers.indexOf(controller), 1);
    var _this = this;
    Common.defer(function () {
      _this.onResize();
    });
  },
  destroy: function destroy() {
    if (this.parent) {
      throw new Error('Only the root GUI should be removed with .destroy(). ' + 'For subfolders, use gui.removeFolder(folder) instead.');
    }
    if (this.autoPlace) {
      autoPlaceContainer.removeChild(this.domElement);
    }
    var _this = this;
    Common.each(this.__folders, function (subfolder) {
      _this.removeFolder(subfolder);
    });
    dom.unbind(window, 'keydown', GUI._keydownHandler, false);
    removeListeners(this);
  },
  addFolder: function addFolder(name) {
    if (this.__folders[name] !== undefined) {
      throw new Error('You already have a folder in this GUI by the' + ' name "' + name + '"');
    }
    var newGuiParams = { name: name, parent: this };
    newGuiParams.autoPlace = this.autoPlace;
    if (this.load &&
    this.load.folders &&
    this.load.folders[name]) {
      newGuiParams.closed = this.load.folders[name].closed;
      newGuiParams.load = this.load.folders[name];
    }
    var gui = new GUI(newGuiParams);
    this.__folders[name] = gui;
    var li = addRow(this, gui.domElement);
    dom.addClass(li, 'folder');
    return gui;
  },
  removeFolder: function removeFolder(folder) {
    this.__ul.removeChild(folder.domElement.parentElement);
    delete this.__folders[folder.name];
    if (this.load &&
    this.load.folders &&
    this.load.folders[folder.name]) {
      delete this.load.folders[folder.name];
    }
    removeListeners(folder);
    var _this = this;
    Common.each(folder.__folders, function (subfolder) {
      folder.removeFolder(subfolder);
    });
    Common.defer(function () {
      _this.onResize();
    });
  },
  open: function open() {
    this.closed = false;
  },
  close: function close() {
    this.closed = true;
  },
  onResize: function onResize() {
    var root = this.getRoot();
    if (root.scrollable) {
      var top = dom.getOffset(root.__ul).top;
      var h = 0;
      Common.each(root.__ul.childNodes, function (node) {
        if (!(root.autoPlace && node === root.__save_row)) {
          h += dom.getHeight(node);
        }
      });
      if (window.innerHeight - top - CLOSE_BUTTON_HEIGHT < h) {
        dom.addClass(root.domElement, GUI.CLASS_TOO_TALL);
        root.__ul.style.height = window.innerHeight - top - CLOSE_BUTTON_HEIGHT + 'px';
      } else {
        dom.removeClass(root.domElement, GUI.CLASS_TOO_TALL);
        root.__ul.style.height = 'auto';
      }
    }
    if (root.__resize_handle) {
      Common.defer(function () {
        root.__resize_handle.style.height = root.__ul.offsetHeight + 'px';
      });
    }
    if (root.__closeButton) {
      root.__closeButton.style.width = root.width + 'px';
    }
  },
  onResizeDebounced: Common.debounce(function () {
    this.onResize();
  }, 50),
  remember: function remember() {
    if (Common.isUndefined(SAVE_DIALOGUE)) {
      SAVE_DIALOGUE = new CenteredDiv();
      SAVE_DIALOGUE.domElement.innerHTML = saveDialogContents;
    }
    if (this.parent) {
      throw new Error('You can only call remember on a top level GUI.');
    }
    var _this = this;
    Common.each(Array.prototype.slice.call(arguments), function (object) {
      if (_this.__rememberedObjects.length === 0) {
        addSaveMenu(_this);
      }
      if (_this.__rememberedObjects.indexOf(object) === -1) {
        _this.__rememberedObjects.push(object);
      }
    });
    if (this.autoPlace) {
      setWidth(this, this.width);
    }
  },
  getRoot: function getRoot() {
    var gui = this;
    while (gui.parent) {
      gui = gui.parent;
    }
    return gui;
  },
  getSaveObject: function getSaveObject() {
    var toReturn = this.load;
    toReturn.closed = this.closed;
    if (this.__rememberedObjects.length > 0) {
      toReturn.preset = this.preset;
      if (!toReturn.remembered) {
        toReturn.remembered = {};
      }
      toReturn.remembered[this.preset] = getCurrentPreset(this);
    }
    toReturn.folders = {};
    Common.each(this.__folders, function (element, key) {
      toReturn.folders[key] = element.getSaveObject();
    });
    return toReturn;
  },
  save: function save() {
    if (!this.load.remembered) {
      this.load.remembered = {};
    }
    this.load.remembered[this.preset] = getCurrentPreset(this);
    markPresetModified(this, false);
    this.saveToLocalStorageIfPossible();
  },
  saveAs: function saveAs(presetName) {
    if (!this.load.remembered) {
      this.load.remembered = {};
      this.load.remembered[DEFAULT_DEFAULT_PRESET_NAME] = getCurrentPreset(this, true);
    }
    this.load.remembered[presetName] = getCurrentPreset(this);
    this.preset = presetName;
    addPresetOption(this, presetName, true);
    this.saveToLocalStorageIfPossible();
  },
  revert: function revert(gui) {
    Common.each(this.__controllers, function (controller) {
      if (!this.getRoot().load.remembered) {
        controller.setValue(controller.initialValue);
      } else {
        recallSavedValue(gui || this.getRoot(), controller);
      }
      if (controller.__onFinishChange) {
        controller.__onFinishChange.call(controller, controller.getValue());
      }
    }, this);
    Common.each(this.__folders, function (folder) {
      folder.revert(folder);
    });
    if (!gui) {
      markPresetModified(this.getRoot(), false);
    }
  },
  listen: function listen(controller) {
    var init = this.__listening.length === 0;
    this.__listening.push(controller);
    if (init) {
      updateDisplays(this.__listening);
    }
  },
  updateDisplay: function updateDisplay() {
    Common.each(this.__controllers, function (controller) {
      controller.updateDisplay();
    });
    Common.each(this.__folders, function (folder) {
      folder.updateDisplay();
    });
  }
});
function addRow(gui, newDom, liBefore) {
  var li = document.createElement('li');
  if (newDom) {
    li.appendChild(newDom);
  }
  if (liBefore) {
    gui.__ul.insertBefore(li, liBefore);
  } else {
    gui.__ul.appendChild(li);
  }
  gui.onResize();
  return li;
}
function removeListeners(gui) {
  dom.unbind(window, 'resize', gui.__resizeHandler);
  if (gui.saveToLocalStorageIfPossible) {
    dom.unbind(window, 'unload', gui.saveToLocalStorageIfPossible);
  }
}
function markPresetModified(gui, modified) {
  var opt = gui.__preset_select[gui.__preset_select.selectedIndex];
  if (modified) {
    opt.innerHTML = opt.value + '*';
  } else {
    opt.innerHTML = opt.value;
  }
}
function augmentController(gui, li, controller) {
  controller.__li = li;
  controller.__gui = gui;
  Common.extend(controller,                                   {
    options: function options(_options) {
      if (arguments.length > 1) {
        var nextSibling = controller.__li.nextElementSibling;
        controller.remove();
        return _add(gui, controller.object, controller.property, {
          before: nextSibling,
          factoryArgs: [Common.toArray(arguments)]
        });
      }
      if (Common.isArray(_options) || Common.isObject(_options)) {
        var _nextSibling = controller.__li.nextElementSibling;
        controller.remove();
        return _add(gui, controller.object, controller.property, {
          before: _nextSibling,
          factoryArgs: [_options]
        });
      }
    },
    name: function name(_name) {
      controller.__li.firstElementChild.firstElementChild.innerHTML = _name;
      return controller;
    },
    listen: function listen() {
      controller.__gui.listen(controller);
      return controller;
    },
    remove: function remove() {
      controller.__gui.remove(controller);
      return controller;
    }
  });
  if (controller instanceof NumberControllerSlider) {
    var box = new NumberControllerBox(controller.object, controller.property, { min: controller.__min, max: controller.__max, step: controller.__step });
    Common.each(['updateDisplay', 'onChange', 'onFinishChange', 'step'], function (method) {
      var pc = controller[method];
      var pb = box[method];
      controller[method] = box[method] = function () {
        var args = Array.prototype.slice.call(arguments);
        pb.apply(box, args);
        return pc.apply(controller, args);
      };
    });
    dom.addClass(li, 'has-slider');
    controller.domElement.insertBefore(box.domElement, controller.domElement.firstElementChild);
  } else if (controller instanceof NumberControllerBox) {
    var r = function r(returned) {
      if (Common.isNumber(controller.__min) && Common.isNumber(controller.__max)) {
        var oldName = controller.__li.firstElementChild.firstElementChild.innerHTML;
        var wasListening = controller.__gui.__listening.indexOf(controller) > -1;
        controller.remove();
        var newController = _add(gui, controller.object, controller.property, {
          before: controller.__li.nextElementSibling,
          factoryArgs: [controller.__min, controller.__max, controller.__step]
        });
        newController.name(oldName);
        if (wasListening) newController.listen();
        return newController;
      }
      return returned;
    };
    controller.min = Common.compose(r, controller.min);
    controller.max = Common.compose(r, controller.max);
  } else if (controller instanceof BooleanController) {
    dom.bind(li, 'click', function () {
      dom.fakeEvent(controller.__checkbox, 'click');
    });
    dom.bind(controller.__checkbox, 'click', function (e) {
      e.stopPropagation();
    });
  } else if (controller instanceof FunctionController) {
    dom.bind(li, 'click', function () {
      dom.fakeEvent(controller.__button, 'click');
    });
    dom.bind(li, 'mouseover', function () {
      dom.addClass(controller.__button, 'hover');
    });
    dom.bind(li, 'mouseout', function () {
      dom.removeClass(controller.__button, 'hover');
    });
  } else if (controller instanceof ColorController) {
    dom.addClass(li, 'color');
    controller.updateDisplay = Common.compose(function (val) {
      li.style.borderLeftColor = controller.__color.toString();
      return val;
    }, controller.updateDisplay);
    controller.updateDisplay();
  }
  controller.setValue = Common.compose(function (val) {
    if (gui.getRoot().__preset_select && controller.isModified()) {
      markPresetModified(gui.getRoot(), true);
    }
    return val;
  }, controller.setValue);
}
function recallSavedValue(gui, controller) {
  var root = gui.getRoot();
  var matchedIndex = root.__rememberedObjects.indexOf(controller.object);
  if (matchedIndex !== -1) {
    var controllerMap = root.__rememberedObjectIndecesToControllers[matchedIndex];
    if (controllerMap === undefined) {
      controllerMap = {};
      root.__rememberedObjectIndecesToControllers[matchedIndex] = controllerMap;
    }
    controllerMap[controller.property] = controller;
    if (root.load && root.load.remembered) {
      var presetMap = root.load.remembered;
      var preset = void 0;
      if (presetMap[gui.preset]) {
        preset = presetMap[gui.preset];
      } else if (presetMap[DEFAULT_DEFAULT_PRESET_NAME]) {
        preset = presetMap[DEFAULT_DEFAULT_PRESET_NAME];
      } else {
        return;
      }
      if (preset[matchedIndex] && preset[matchedIndex][controller.property] !== undefined) {
        var value = preset[matchedIndex][controller.property];
        controller.initialValue = value;
        controller.setValue(value);
      }
    }
  }
}
function _add(gui, object, property, params) {
  if (object[property] === undefined) {
    throw new Error('Object "' + object + '" has no property "' + property + '"');
  }
  var controller = void 0;
  if (params.color) {
    controller = new ColorController(object, property);
  } else {
    var factoryArgs = [object, property].concat(params.factoryArgs);
    controller = ControllerFactory.apply(gui, factoryArgs);
  }
  if (params.before instanceof Controller) {
    params.before = params.before.__li;
  }
  recallSavedValue(gui, controller);
  dom.addClass(controller.domElement, 'c');
  var name = document.createElement('span');
  dom.addClass(name, 'property-name');
  name.innerHTML = controller.property;
  var container = document.createElement('div');
  container.appendChild(name);
  container.appendChild(controller.domElement);
  var li = addRow(gui, container, params.before);
  dom.addClass(li, GUI.CLASS_CONTROLLER_ROW);
  if (controller instanceof ColorController) {
    dom.addClass(li, 'color');
  } else {
    dom.addClass(li, _typeof(controller.getValue()));
  }
  augmentController(gui, li, controller);
  gui.__controllers.push(controller);
  return controller;
}
function getLocalStorageHash(gui, key) {
  return document.location.href + '.' + key;
}
function addPresetOption(gui, name, setSelected) {
  var opt = document.createElement('option');
  opt.innerHTML = name;
  opt.value = name;
  gui.__preset_select.appendChild(opt);
  if (setSelected) {
    gui.__preset_select.selectedIndex = gui.__preset_select.length - 1;
  }
}
function showHideExplain(gui, explain) {
  explain.style.display = gui.useLocalStorage ? 'block' : 'none';
}
function addSaveMenu(gui) {
  var div = gui.__save_row = document.createElement('li');
  dom.addClass(gui.domElement, 'has-save');
  gui.__ul.insertBefore(div, gui.__ul.firstChild);
  dom.addClass(div, 'save-row');
  var gears = document.createElement('span');
  gears.innerHTML = '&nbsp;';
  dom.addClass(gears, 'button gears');
  var button = document.createElement('span');
  button.innerHTML = 'Save';
  dom.addClass(button, 'button');
  dom.addClass(button, 'save');
  var button2 = document.createElement('span');
  button2.innerHTML = 'New';
  dom.addClass(button2, 'button');
  dom.addClass(button2, 'save-as');
  var button3 = document.createElement('span');
  button3.innerHTML = 'Revert';
  dom.addClass(button3, 'button');
  dom.addClass(button3, 'revert');
  var select = gui.__preset_select = document.createElement('select');
  if (gui.load && gui.load.remembered) {
    Common.each(gui.load.remembered, function (value, key) {
      addPresetOption(gui, key, key === gui.preset);
    });
  } else {
    addPresetOption(gui, DEFAULT_DEFAULT_PRESET_NAME, false);
  }
  dom.bind(select, 'change', function () {
    for (var index = 0; index < gui.__preset_select.length; index++) {
      gui.__preset_select[index].innerHTML = gui.__preset_select[index].value;
    }
    gui.preset = this.value;
  });
  div.appendChild(select);
  div.appendChild(gears);
  div.appendChild(button);
  div.appendChild(button2);
  div.appendChild(button3);
  if (SUPPORTS_LOCAL_STORAGE) {
    var explain = document.getElementById('dg-local-explain');
    var localStorageCheckBox = document.getElementById('dg-local-storage');
    var saveLocally = document.getElementById('dg-save-locally');
    saveLocally.style.display = 'block';
    if (localStorage.getItem(getLocalStorageHash(gui, 'isLocal')) === 'true') {
      localStorageCheckBox.setAttribute('checked', 'checked');
    }
    showHideExplain(gui, explain);
    dom.bind(localStorageCheckBox, 'change', function () {
      gui.useLocalStorage = !gui.useLocalStorage;
      showHideExplain(gui, explain);
    });
  }
  var newConstructorTextArea = document.getElementById('dg-new-constructor');
  dom.bind(newConstructorTextArea, 'keydown', function (e) {
    if (e.metaKey && (e.which === 67 || e.keyCode === 67)) {
      SAVE_DIALOGUE.hide();
    }
  });
  dom.bind(gears, 'click', function () {
    newConstructorTextArea.innerHTML = JSON.stringify(gui.getSaveObject(), undefined, 2);
    SAVE_DIALOGUE.show();
    newConstructorTextArea.focus();
    newConstructorTextArea.select();
  });
  dom.bind(button, 'click', function () {
    gui.save();
  });
  dom.bind(button2, 'click', function () {
    var presetName = prompt('Enter a new preset name.');
    if (presetName) {
      gui.saveAs(presetName);
    }
  });
  dom.bind(button3, 'click', function () {
    gui.revert();
  });
}
function addResizeHandle(gui) {
  var pmouseX = void 0;
  gui.__resize_handle = document.createElement('div');
  Common.extend(gui.__resize_handle.style, {
    width: '6px',
    marginLeft: '-3px',
    height: '200px',
    cursor: 'ew-resize',
    position: 'absolute'
  });
  function drag(e) {
    e.preventDefault();
    gui.width += pmouseX - e.clientX;
    gui.onResize();
    pmouseX = e.clientX;
    return false;
  }
  function dragStop() {
    dom.removeClass(gui.__closeButton, GUI.CLASS_DRAG);
    dom.unbind(window, 'mousemove', drag);
    dom.unbind(window, 'mouseup', dragStop);
  }
  function dragStart(e) {
    e.preventDefault();
    pmouseX = e.clientX;
    dom.addClass(gui.__closeButton, GUI.CLASS_DRAG);
    dom.bind(window, 'mousemove', drag);
    dom.bind(window, 'mouseup', dragStop);
    return false;
  }
  dom.bind(gui.__resize_handle, 'mousedown', dragStart);
  dom.bind(gui.__closeButton, 'mousedown', dragStart);
  gui.domElement.insertBefore(gui.__resize_handle, gui.domElement.firstElementChild);
}
function setWidth(gui, w) {
  gui.domElement.style.width = w + 'px';
  if (gui.__save_row && gui.autoPlace) {
    gui.__save_row.style.width = w + 'px';
  }
  if (gui.__closeButton) {
    gui.__closeButton.style.width = w + 'px';
  }
}
function getCurrentPreset(gui, useInitialValues) {
  var toReturn = {};
  Common.each(gui.__rememberedObjects, function (val, index) {
    var savedValues = {};
    var controllerMap = gui.__rememberedObjectIndecesToControllers[index];
    Common.each(controllerMap, function (controller, property) {
      savedValues[property] = useInitialValues ? controller.initialValue : controller.getValue();
    });
    toReturn[index] = savedValues;
  });
  return toReturn;
}
function setPresetSelectIndex(gui) {
  for (var index = 0; index < gui.__preset_select.length; index++) {
    if (gui.__preset_select[index].value === gui.preset) {
      gui.__preset_select.selectedIndex = index;
    }
  }
}
function updateDisplays(controllerArray) {
  if (controllerArray.length !== 0) {
    requestAnimationFrame$1.call(window, function () {
      updateDisplays(controllerArray);
    });
  }
  Common.each(controllerArray, function (c) {
    c.updateDisplay();
  });
}

var index = {
  color: {
    Color: Color,
    math: ColorMath,
    interpret: interpret
  },
  controllers: {
    Controller: Controller,
    BooleanController: BooleanController,
    OptionController: OptionController,
    StringController: StringController,
    NumberController: NumberController,
    NumberControllerBox: NumberControllerBox,
    NumberControllerSlider: NumberControllerSlider,
    FunctionController: FunctionController,
    ColorController: ColorController
  },
  dom: {
    dom: dom
  },
  gui: {
    GUI: GUI
  },
  GUI: GUI
};

return index;

})));
//# sourceMappingURL=dat.gui.js.map


/***/ }),
/* 9 */
/***/ (function(module, exports) {

module.exports = "precision highp float;\r\nprecision highp int;\r\nprecision highp sampler2D;\r\nuniform mat4 uShortBoxInvMatrix;\r\nuniform mat3 uShortBoxNormalMatrix;\r\nuniform mat4 uTallBoxInvMatrix;\r\nuniform mat3 uTallBoxNormalMatrix;\r\n#include <pathtracing_uniforms_and_defines>\r\n#define N_QUADS 6\r\n#define N_BOXES 2\r\nstruct Ray { vec3 origin; vec3 direction; };\r\nstruct Quad { vec3 normal; vec3 v0; vec3 v1; vec3 v2; vec3 v3; vec3 emission; vec3 color; int type; };\r\nstruct Box { vec3 minCorner; vec3 maxCorner; vec3 emission; vec3 color; int type; };\r\nstruct Intersection { vec3 normal; vec3 emission; vec3 color; int type; };\r\nQuad quads[N_QUADS];\r\nBox boxes[N_BOXES];\r\n#include <pathtracing_random_functions>\r\n#include <pathtracing_quad_intersect>\r\n#include <pathtracing_box_intersect>\r\n\r\n//-----------------------------------------------------------------------\r\nfloat SceneIntersect(Ray r, inout Intersection intersec)\r\n\r\n//-----------------------------------------------------------------------\r\n{\r\n\tvec3 normal;\r\n\tfloat d;\r\n\tfloat t = INFINITY;\r\n\r\n\t// clear fields out\r\n\tintersec.normal = vec3(0);\r\n\tintersec.emission = vec3(0);\r\n\tintersec.color = vec3(0);\r\n\tintersec.type = -1;\r\n\r\n\tfor (int i = 0; i < N_QUADS; i++)\r\n\t{\r\n\t\td = QuadIntersect(quads[i].v0, quads[i].v1, quads[i].v2, quads[i].v3, quads[i].normal, r);\r\n\t\tif (d < t) {\r\n\t\t\tt = d;\r\n\t\t\tintersec.normal = quads[i].normal;\r\n\t\t\tintersec.emission = quads[i].emission;\r\n\t\t\tintersec.color = quads[i].color;\r\n\t\t\tintersec.type = quads[i].type;\r\n\t\t}\r\n\t}\r\n\r\n\r\n\t// TALL MIRROR BOX\r\n\tRay rObj;\r\n\t// transform ray into Tall Box's object space\r\n\trObj.origin = vec3(uTallBoxInvMatrix * vec4(r.origin, 1.0));\r\n\trObj.direction = vec3(uTallBoxInvMatrix * vec4(r.direction, 0.0));\r\n\td = BoxIntersect(boxes[0].minCorner, boxes[0].maxCorner, rObj, normal);\r\n\r\n\tif (d < t) {\r\n\t\tt = d;\r\n\r\n\t\t// transfom normal back into world space\r\n\t\tnormal = vec3(uTallBoxNormalMatrix * normal);\r\n\r\n\t\tintersec.normal = normalize(normal);\r\n\t\tintersec.emission = boxes[0].emission;\r\n\t\tintersec.color = boxes[0].color;\r\n\t\tintersec.type = boxes[0].type;\r\n\t}\r\n\r\n\r\n\t// SHORT DIFFUSE WHITE BOX\r\n\t// transform ray into Short Box's object space\r\n\trObj.origin = vec3(uShortBoxInvMatrix * vec4(r.origin, 1.0));\r\n\trObj.direction = vec3(uShortBoxInvMatrix * vec4(r.direction, 0.0));\r\n\td = BoxIntersect(boxes[1].minCorner, boxes[1].maxCorner, rObj, normal);\r\n\r\n\tif (d < t) {\r\n\t\tt = d;\r\n\r\n\t\t// transfom normal back into world space\r\n\t\tnormal = vec3(uShortBoxNormalMatrix * normal);\r\n\r\n\t\tintersec.normal = normalize(normal);\r\n\t\tintersec.emission = boxes[1].emission;\r\n\t\tintersec.color = boxes[1].color;\r\n\t\tintersec.type = boxes[1].type;\r\n\t}\r\n\r\n\r\n\treturn t;\r\n}\r\n\r\nvec3 calcDirectLightingQuad_MultiMethod(vec3 mask, vec3 x, vec3 nl, Quad light, inout float seed, inout bool lightFound)\r\n{\r\n\tvec3 dirLight = vec3(0.0);\r\n\tIntersection shadowIntersec;\r\n\tvec3 randPointOnLight;\r\n\trandPointOnLight.x = mix(light.v0.x, light.v1.x, rand(seed));\r\n\trandPointOnLight.y = light.v0.y;\r\n\trandPointOnLight.z = mix(light.v0.z, light.v3.z, rand(seed));\r\n\tvec3 srDir = normalize(randPointOnLight - x);\r\n\tfloat nlDotSrDir = max(dot(nl, srDir), 0.01);\r\n\r\n\t// cast shadow ray from intersection point\t\r\n\tRay shadowRay = Ray(x, srDir);\r\n\tshadowRay.origin += nl * 2.0; // larger dimensions of this scene require greater offsets\r\n\tfloat st = SceneIntersect(shadowRay, shadowIntersec);\r\n\tif (shadowIntersec.type == LIGHT) {\r\n\t\tlightFound = true;\r\n\t\tfloat r2 = distance(light.v0, light.v1) * distance(light.v0, light.v3);\r\n\t\tvec3 d = randPointOnLight - shadowRay.origin;\r\n\t\tfloat d2 = dot(d, d);\r\n\t\tfloat weight = dot(-srDir, normalize(shadowIntersec.normal)) * r2 / d2;\r\n\t\tdirLight = mask * light.emission * nlDotSrDir * clamp(weight, 0.0, 1.0);\r\n\t}\r\n\treturn dirLight;\r\n}\r\n#define EYEPATH_LENGTH      4\r\n#define CAUSTICPATH_LENGTH  2\r\n#define LIGHTPATH_LENGTH    1\r\n//-----------------------------------------------------------------------\r\nvec3 CalculateRadiance(Ray r, inout float seed)\r\n//-----------------------------------------------------------------------\r\n{\r\n\tIntersection intersec;\r\n\tvec3 accumCol = vec3(0);\r\n\tvec3 maskEyePath = vec3(1);\r\n\tvec3 maskLightPath = vec3(1);\r\n\tvec3 eyeX = vec3(0);\r\n\tvec3 lightX = vec3(0);\r\n\tvec3 firstX = vec3(0);\r\n\tvec3 nlFirst = vec3(0);\r\n\tvec3 nl, n, x;\r\n\tvec3 nlEyePath = vec3(0);\r\n\tvec3 nlLightPath = vec3(0);\r\n\tfloat t = INFINITY;\r\n\tbool bounceIsSpecular = true;\r\n\tbool diffuseReached = false;\r\n\tbool lightFound = false;\r\n\tbool exitEarly = false;\r\n\r\n\t// Eye path tracing (from Camera) ///////////////////////////////////////////////////////////////////////////\r\n\r\n\tfor (int depth = 0; depth < EYEPATH_LENGTH; depth++)\r\n\t{\r\n\r\n\t\tt = SceneIntersect(r, intersec);\r\n\r\n\t\tif (t == INFINITY) {\r\n\t\t\texitEarly = true;\r\n\t\t\tbreak;\r\n\t\t}\r\n\r\n\t\tif (intersec.type == LIGHT) {\r\n\t\t\tif (bounceIsSpecular) {\r\n\t\t\t\taccumCol += maskEyePath * intersec.emission;\r\n\t\t\t\texitEarly = true;\r\n\t\t\t}\r\n\r\n\t\t\tbreak;\r\n\t\t}\r\n\r\n\t\t// useful data \r\n\t\tn = normalize(intersec.normal);\r\n\t\tnl = dot(n, r.direction) < 0.0 ? normalize(n) : normalize(n * -1.0);\r\n\t\tx = r.origin + r.direction * t;\r\n\r\n\r\n\t\tif (intersec.type == DIFF) // Ideal DIFFUSE reflection\r\n\t\t{\r\n\t\t\tdiffuseReached = true;\r\n\t\t\tbounceIsSpecular = false;\r\n\t\t\tmaskEyePath *= intersec.color;\r\n\t\t\teyeX = x + nl * 2.0;\r\n\t\t\tnlEyePath = nl;\r\n\t\t\tif (depth == 0) {\r\n\t\t\t\tfirstX = eyeX;\r\n\t\t\t\tnlFirst = nlEyePath;\r\n\t\t\t}\r\n\t\t\taccumCol += 1.0 * calcDirectLightingQuad_MultiMethod(maskEyePath, x, nl, quads[5], seed, lightFound);\r\n\r\n\t\t\t// Russian roulette\r\n\t\t\tif (rand(seed) < 0.3 || depth > 2)\r\n\t\t\t\tbreak;\r\n\r\n\t\t\t// choose random Diffuse sample vector\r\n\t\t\tr = Ray(x, randomCosWeightedDirectionInHemisphere(nl, seed));\r\n\t\t\tr.origin += r.direction * 2.0;\r\n\t\t\teyeX = r.origin;\r\n\r\n\t\t\tcontinue;\r\n\t\t}\r\n\r\n\t\tif (intersec.type == SPEC)  // Ideal SPECULAR reflection\r\n\t\t{\r\n\t\t\tmaskEyePath *= intersec.color;\r\n\t\t\tr = Ray(x, reflect(r.direction, nl));\r\n\t\t\tr.origin += r.direction * 2.0;\r\n\r\n\t\t\tcontinue;\r\n\t\t}\r\n\r\n\t} // end for (int depth = 0; depth < EYEPATH_LENGTH; depth++)\r\n\r\n\tif (exitEarly || !diffuseReached)\r\n\t\treturn accumCol;\r\n\tr.origin = firstX;\r\n\tvec3 randVec = vec3(rand(seed) * 2.0 - 1.0, rand(seed) * 2.0 - 1.0, rand(seed) * 2.0 - 1.0);\r\n\tvec3 offset = vec3(randVec.x * 82.0, randVec.y * 170.0, randVec.z * 80.0);\r\n\tvec3 target = vec3(180.0 + offset.x, 170.0 + offset.y, -350.0 + offset.z);\r\n\tvec3 causticDirection = normalize(target - r.origin);\r\n\tr.direction = causticDirection;\r\n\texitEarly = false;\r\n\tfor (int depth = 0; depth < CAUSTICPATH_LENGTH; depth++)\r\n\t{\r\n\r\n\t\tt = SceneIntersect(r, intersec);\r\n\r\n\t\tif (t == INFINITY) {\r\n\t\t\tbreak;\r\n\t\t}\r\n\r\n\t\tif (intersec.type == LIGHT) {\r\n\t\t\tif (depth == 1) {\r\n\t\t\t\taccumCol += 0.7 * maskEyePath * intersec.emission * max(0.0, dot(nlFirst, causticDirection));\r\n\t\t\t\texitEarly = true;\r\n\t\t\t}\r\n\r\n\t\t\tbreak;\r\n\t\t}\r\n\r\n\t\t// useful data \r\n\t\tn = normalize(intersec.normal);\r\n\t\tnl = dot(n, r.direction) < 0.0 ? normalize(n) : normalize(n * -1.0);\r\n\t\tx = r.origin + r.direction * t;\r\n\r\n\t\tif (intersec.type == DIFF) // Ideal DIFFUSE reflection\r\n\t\t{\r\n\t\t\tbreak;\r\n\t\t}\r\n\r\n\t\tif (intersec.type == SPEC)  // Ideal SPECULAR reflection\r\n\t\t{\r\n\t\t\tmaskEyePath *= intersec.color;\r\n\t\t\tr = Ray(x, reflect(r.direction, nl));\r\n\t\t\tr.origin += r.direction * 2.0;\r\n\r\n\t\t\tcontinue;\r\n\t\t}\r\n\r\n\t} // end for (int depth = 0; depth < CAUSTICPATH_LENGTH; depth++)\r\n\r\n\tif (exitEarly || lightFound)\r\n\t\treturn accumCol;\r\n\t// Light path tracing (from Light sources) ////////////////////////////////////////////////////////////////////\r\n\tvec3 randPointOnLight;\r\n\trandPointOnLight.x = mix(quads[5].v0.x, quads[5].v1.x, rand(seed));\r\n\trandPointOnLight.y = quads[5].v0.y;\r\n\trandPointOnLight.z = mix(quads[5].v0.z, quads[5].v3.z, rand(seed));\r\n\tvec3 randLightDir = randomCosWeightedDirectionInHemisphere(quads[5].normal, seed);\r\n\trandLightDir = normalize(randLightDir);\r\n\tr = Ray(randPointOnLight, randLightDir);\r\n\tr.origin += r.direction * 2.0;\r\n\tlightX = r.origin;\r\n\tmaskLightPath = quads[5].emission;\r\n\tnlLightPath = quads[5].normal;\r\n\r\n\r\n\tfor (int depth = 0; depth < LIGHTPATH_LENGTH; depth++)\r\n\t{\r\n\r\n\t\tt = SceneIntersect(r, intersec);\r\n\r\n\t\tif (t == INFINITY) {\r\n\t\t\tbreak;\r\n\t\t}\r\n\r\n\t\t// useful data \r\n\t\tn = normalize(intersec.normal);\r\n\t\tnl = dot(n, r.direction) < 0.0 ? normalize(n) : normalize(n * -1.0);\r\n\t\tx = r.origin + r.direction * t;\r\n\r\n\r\n\t\tif (intersec.type == DIFF) // Ideal DIFFUSE reflection\r\n\t\t{\r\n\t\t\tmaskLightPath *= max(0.0, dot(-r.direction, nl));\r\n\t\t\tmaskLightPath *= intersec.color;\r\n\t\t\tlightX = x + nl * 2.0;\r\n\t\t\tnlLightPath = nl;\r\n\t\t\tdiffuseReached = true;\r\n\r\n\t\t\tbreak;\r\n\t\t}\r\n\r\n\t\tif (intersec.type == SPEC)  // Ideal SPECULAR reflection\r\n\t\t{\r\n\t\t\tbreak;\r\n\t\t}\r\n\r\n\t} // end for (int depth = 0; depth < LIGHTPATH_LENGTH; depth++)\r\n\r\n\tif (!diffuseReached)\r\n\t\treturn accumCol;\r\n\t// if we made it this far, the light ray has reached a diffuse surface that we can \r\n\t// sample from, and light source has not yet been found by directLighting (we are in shadow)\r\n\t// Connect Camera path and Light path ////////////////////////////////////////////////////////////\r\n\r\n\tRay connectRay = Ray(eyeX, normalize(lightX - eyeX));\r\n\tfloat connectDist = distance(eyeX, lightX);\r\n\tfloat c = SceneIntersect(connectRay, intersec);\r\n\tif (c > (connectDist - 1.0)) {\r\n\t\tmaskLightPath *= max(0.0, dot(-connectRay.direction, nlLightPath));\r\n\t\tmaskEyePath *= max(0.0, dot(connectRay.direction, nlEyePath));\r\n\t\taccumCol += 0.1 * (maskEyePath * maskLightPath);\r\n\t}\r\n\r\n\treturn accumCol;\r\n}\r\n//-----------------------------------------------------------------------\r\nvoid SetupScene(void)\r\n//-----------------------------------------------------------------------\r\n{\r\n\tvec3 z = vec3(0);// No color value, Black\r\n\tvec3 L1 = vec3(1.0, 0.7, 0.38) * 15.0;// Bright Yellowish light\r\n\r\n\tquads[0] = Quad(vec3(0.0, 0.0, 1.0), vec3(0.0, 0.0, -559.2), vec3(549.6, 0.0, -559.2), vec3(549.6, 548.8, -559.2), vec3(0.0, 548.8, -559.2), z, vec3(1), DIFF);// Back Wall\r\n\tquads[1] = Quad(vec3(1.0, 0.0, 0.0), vec3(0.0, 0.0, 0.0), vec3(0.0, 0.0, -559.2), vec3(0.0, 548.8, -559.2), vec3(0.0, 548.8, 0.0), z, vec3(0.7, 0.12, 0.05), DIFF);// Left Wall Red\r\n\tquads[2] = Quad(vec3(-1.0, 0.0, 0.0), vec3(549.6, 0.0, -559.2), vec3(549.6, 0.0, 0.0), vec3(549.6, 548.8, 0.0), vec3(549.6, 548.8, -559.2), z, vec3(0.2, 0.4, 0.36), DIFF);// Right Wall Green\r\n\tquads[3] = Quad(vec3(0.0, -1.0, 0.0), vec3(0.0, 548.8, -559.2), vec3(549.6, 548.8, -559.2), vec3(549.6, 548.8, 0.0), vec3(0.0, 548.8, 0.0), z, vec3(1), DIFF);// Ceiling\r\n\tquads[4] = Quad(vec3(0.0, 1.0, 0.0), vec3(0.0, 0.0, 0.0), vec3(549.6, 0.0, 0.0), vec3(549.6, 0.0, -559.2), vec3(0.0, 0.0, -559.2), z, vec3(1), DIFF);// Floor\r\n\tquads[5] = Quad(vec3(0.0, -1.0, 0.0), vec3(213.0, 548.0, -332.0), vec3(343.0, 548.0, -332.0), vec3(343.0, 548.0, -227.0), vec3(213.0, 548.0, -227.0), L1, z, LIGHT);// Area Light Rectangle in ceiling\r\n\r\n\tboxes[0] = Box(vec3(-82.0, -170.0, -80.0), vec3(82.0, 170.0, 80.0), z, vec3(1), SPEC);// Tall Mirror Box Left\r\n\tboxes[1] = Box(vec3(-86.0, -85.0, -80.0), vec3(86.0, 85.0, 80.0), z, vec3(1), DIFF);// Short Diffuse Box Right\r\n}\r\n#include <pathtracing_main>\r\n"

/***/ }),
/* 10 */
/***/ (function(module, exports) {

module.exports = "#include <pathtracing_uniforms_and_defines>\r\n\r\n#define PIXEL_SAMPLES \t\t1\t\t//samples per pixel. Increase for better image quality\r\n#define MAX_DEPTH\t\t\t5\t\t//GI depth\r\n#define CLAMP_VALUE\t\t\t4.0\t\t//biased rendering\r\n\r\n#define SPHERE_LIGHT\r\n#define BOX\r\n\r\n//used macros and constants\r\n// #define PI \t\t\t\t3.1415926\r\n// #define TWO_PI \t\t\t6.2831852\r\n// #define FOUR_PI \t\t\t12.566370\r\n#define INV_PI \t\t\t\t0.3183099\r\n#define INV_TWO_PI \t\t\t0.1591549\r\n#define INV_FOUR_PI \t\t0.0795775\r\n#define EPSILON \t\t\t0.0001 \r\n#define EQUAL_FLT(a,b,eps)\t(((a)>((b)-(eps))) && ((a)<((b)+(eps))))\r\n#define IS_ZERO(a) \t\t\tEQUAL_FLT(a,0.0,EPSILON)\r\n//********************************************\r\n\r\nvec3 orthogonalize(in vec3 n, in vec3 v) {\r\n    return v - n * dot(n, v);\r\n}\r\n\r\n// random number generator **********\r\n// taken from iq :)\r\nfloat seed;\t//seed initialized in main\r\nfloat rnd() { return fract(sin(seed++)*43758.5453123); }\r\n//***********************************\r\n\r\n//////////////////////////////////////////////////////////////////////////\r\n// Converting PDF from Solid angle to Area\r\nfloat PdfWtoA( float aPdfW, float aDist2, float aCosThere ){\r\n    return aDist2 == 0.0 ? 0.0 : aPdfW * abs(aCosThere) / aDist2;\r\n}\r\n\r\n// Converting PDF between from Area to Solid angle\r\nfloat PdfAtoW( float aPdfA, float aDist2, float aCosThere ){\r\n    return abs(aCosThere) == 0.0 ? 0.0 : aPdfA * aDist2 / abs(aCosThere);\r\n}\r\n\r\nfloat misWeight( in float a, in float b ) {\r\n    float a2 = a*a;\r\n    float b2 = b*b;\r\n    float a2b2 = a2 + b2;\r\n    return a2 / a2b2;\r\n}\r\n//////////////////////////////////////////////////////////////////////////\r\n\r\nvec3 toVec3( vec4 v ) {\r\n    return v.w == 0.0 ? v.xyz : v.xyz*(1.0/v.w);\r\n}\r\n\r\nmat3 mat3Inverse( in mat3 m ) {\r\n#if __VERSION__ >= 300\r\n    return inverse(m);\t//webGL 2.0\r\n#else\r\n    return mat3(\tvec3( m[0][0], m[1][0], m[2][0] ),\r\n\t\t\t\t\tvec3( m[0][1], m[1][1], m[2][1] ),\r\n                    vec3( m[0][2], m[1][2], m[2][2] ) );\r\n#endif\r\n}\r\n\r\n//fast inverse for orthogonal matrices\r\nmat4 mat4Inverse( in mat4 m ) {\r\n#if __VERSION__ >= 300\r\n    return inverse(m);\t//webGL 2.0\r\n#else\r\n    mat3 rotate_inv = mat3(\tvec3( m[0][0], m[1][0], m[2][0] ),\r\n                          \tvec3( m[0][1], m[1][1], m[2][1] ),\r\n                          \tvec3( m[0][2], m[1][2], m[2][2] ) );\r\n    \r\n    return mat4(\tvec4( rotate_inv[0], 0.0 ),\r\n                \tvec4( rotate_inv[1], 0.0 ),\r\n                \tvec4( rotate_inv[2], 0.0 ),\r\n              \t\tvec4( (-rotate_inv)*m[3].xyz, 1.0 ) );\r\n#endif\r\n}\r\n      \r\nstruct SurfaceHitInfo {\r\n    vec3 position_;\r\n\tvec3 normal_;\r\n    vec3 tangent_;\r\n    vec2 uv_;\r\n    int mtl_id_;\r\n};\r\n    \r\n#define SURFACE_ID_BASE\t0\r\n#define LIGHT_ID_BASE\t64\r\n\r\n#define MTL_LIGHT \t\t0\r\n#define MTL_DIFFUSE\t\t1\r\n    \r\n\r\n#define OBJ_PLANE\t\t0\r\n#define OBJ_SPHERE\t\t1\r\n#define OBJ_CYLINDER\t2\r\n#define OBJ_AABB\t\t3\r\n#define OBJ_DISK\t\t4\r\n#define OBJ_BUNNY\t\t5\r\n    \r\nstruct Object {\r\n    int type_;\r\n    int mtl_id_;\r\n    mat4 transform_;\r\n    mat4 transform_inv_;\r\n    \r\n    float params_[6];\r\n};\r\n\r\n//Weighted sum of Lambertian and Blinn brdfs\r\nstruct Material {\r\n    int type_; // 0 - diffuse, 1 - mirror, \r\n    vec3 color_;\r\n};\r\n    \r\nstruct Light {\r\n    vec3 color_;\r\n    float intensity_;\r\n};\r\n    \r\nstruct Ray {\r\n    vec3 origin;\r\n    vec3 direction;\r\n};\r\n    \r\nstruct Camera {\r\n    mat3 rotate;\r\n    vec3 pos;\r\n    float fovV;\r\n    float focusDist;\r\n};\r\n    \r\nstruct LightSamplingRecord {\r\n    vec3 w;\r\n    float d;\r\n    float pdf;\r\n};\r\n    \r\n// ************ SCENE ***************\r\n \r\n#ifdef BOX\r\n#define N_OBJECTS 7\r\n#define N_MATERIALS 5\r\n#else\r\n#define N_OBJECTS 6\r\n#define N_MATERIALS 4\r\n#endif\r\n\r\nLight lights[2];\r\nMaterial materials[N_MATERIALS];\r\nObject objects[N_OBJECTS];\r\nCamera camera;\r\n//***********************************\r\nMaterial getMaterial(int i) {\r\n#if __VERSION__ >= 300\r\n    return materials[i];\t//webGL 2.0\r\n#else\r\n    if(i==0) return materials[0]; \r\n    if(i==1) return materials[1];\r\n    if(i==2) return materials[2];\r\n    if(i==4) return materials[4];\r\n    return materials[3];\r\n#endif \r\n}\r\n\r\nLight getLight(int i) {\r\n    if(i==0) return lights[0]; else\r\n        return lights[1];\r\n    //return lights[i];\r\n}\r\n\r\nvec3 getColor(vec2 uv, int tex) {\r\n    if(tex==0)\treturn vec3(0.8, 0.5, 0.3);\r\n    if(tex==1)\treturn vec3(0.5, 0.5, 0.6);\r\n\t\t\t\treturn vec3(0.7, 0.7, 0.7);\r\n}\r\n\r\nvec3 getNormal(vec2 uv, int tex ) {\r\n    return vec3(0.0, 0.0, 1.0);\r\n}\r\n\r\nvec3 getRadiance(vec2 uv) {\r\n    return /*getColor(uv, 2)*lights[0].color_**/vec3(1.0, 1.0, 1.0)*lights[0].intensity_;\r\n}\r\n\r\nvoid createMaterial( int type, vec3 c, out Material mtl) { mtl.type_ = type; mtl.color_ = c;}\r\n\r\nvoid createLight(vec3 color, float intensity, out Light light) {\r\n    light.color_ = color;\r\n    light.intensity_ = intensity;\r\n}\r\n\r\nvoid createAABB( mat4 transform, vec3 bound_min, vec3 bound_max, int mtl, out Object obj) {\r\n    vec3 xAcis = normalize( vec3( 0.9, 0.0, 0.2 ) );\r\n    vec3 yAcis = vec3( 0.0, 1.0, 0.0 );\r\n    obj.type_ = OBJ_AABB;\r\n    obj.mtl_id_ = mtl;\r\n    obj.transform_ = transform;\r\n    obj.transform_inv_ = mat4Inverse( obj.transform_ );\r\n    obj.params_[0] = bound_min.x;\r\n    obj.params_[1] = bound_min.y;\r\n    obj.params_[2] = bound_min.z;\r\n    obj.params_[3] = bound_max.x;\r\n    obj.params_[4] = bound_max.y;\r\n    obj.params_[5] = bound_max.z;\r\n}\r\n\r\nvoid createPlane(mat4 transform, float minX, float minY, float maxX, float maxY, int mtl, out Object obj) {\r\n    obj.type_ = OBJ_PLANE;\r\n    obj.mtl_id_ = mtl;\r\n    obj.transform_ = transform;\r\n    obj.transform_inv_ = mat4Inverse( obj.transform_ );\r\n    obj.params_[0] = minX;\t\t\t//min x\r\n    obj.params_[1] = minY;\t\t\t//min y\r\n    obj.params_[2] = maxX;\t\t\t//max x\r\n    obj.params_[3] = maxY;\t\t\t//max y\r\n    obj.params_[4] = 0.0;\t\t//not used\r\n    obj.params_[5] = 0.0;\t\t//not used\r\n}\r\n\r\nvoid createDisk(mat4 transform, float r, float R, int mtl, out Object obj) {\r\n    obj.type_ = OBJ_DISK;\r\n    obj.mtl_id_ = mtl;\r\n    obj.transform_ = transform;\r\n    obj.transform_inv_ = mat4Inverse( obj.transform_ );\r\n    obj.params_[0] = r*r;\r\n    obj.params_[1] = R*R;\r\n}\r\n\r\nvoid createSphere(mat4 transform, float r, int mtl, out Object obj) {\r\n    obj.type_ = OBJ_SPHERE;\r\n    obj.mtl_id_ = mtl;\r\n    obj.transform_ = transform;\r\n    obj.transform_inv_ = mat4Inverse( obj.transform_ );\r\n    obj.params_[0] = r;\t\t\t//radius\r\n    obj.params_[1] = r*r;\t\t//radius^2\r\n    obj.params_[2] = 0.0;\t\t//not used\r\n    obj.params_[3] = 0.0;\t\t//not used\r\n    obj.params_[4] = 0.0;\t\t//not used \r\n    obj.params_[5] = 0.0;\t\t//not used\r\n}\r\n\r\nvoid createCylinder(mat4 transform, float r, float minZ, float maxZ, float maxTheta, int mtl, out Object obj) {\r\n    obj.type_ = OBJ_CYLINDER;\r\n    obj.mtl_id_ = mtl;\r\n    obj.transform_ = transform;\r\n    obj.transform_inv_ = mat4Inverse( obj.transform_ );\r\n    obj.params_[0] = r;\t\t\t//radius\r\n    obj.params_[1] = minZ;\t\t//min z\r\n    obj.params_[2] = maxZ;\t\t//max z\r\n    obj.params_[3] = maxTheta;\t//max phi\r\n    obj.params_[4] = 0.0;\t\t//not used\r\n    obj.params_[5] = 0.0;\t\t//not used\r\n}\r\n\r\nvoid createBunny(mat4 transform, int mtl, out Object obj) {\r\n    obj.type_ = OBJ_BUNNY;\r\n    obj.mtl_id_ = mtl;\r\n    obj.transform_ = transform;\r\n    obj.transform_inv_ = mat4Inverse( obj.transform_ );\r\n    obj.params_[0] = 0.0;\t\t//not used\r\n    obj.params_[1] = 0.0;\t\t//not used\r\n    obj.params_[2] = 0.0;\t\t//not used\r\n    obj.params_[3] = 0.0;\t    //not used\r\n    obj.params_[4] = 0.0;\t\t//not used\r\n    obj.params_[5] = 0.0;\t\t//not used\r\n}\r\n\r\nmat4 createCS(vec3 p, vec3 z, vec3 x) {\r\n    z = normalize(z);\r\n    vec3 y = normalize(cross(z,x));\r\n    x = cross(y,z);\r\n    \r\n    return mat4(\tvec4( x, 0.0 ), \r\n    \t\t\t \tvec4( y, 0.0 ),\r\n    \t\t\t\tvec4( z, 0.0 ),\r\n    \t\t\t\tvec4( p, 1.0 ));\r\n}\r\n\r\n// Geometry functions ***********************************************************\r\nvec2 uniformPointWithinCircle( in float radius, in float Xi1, in float Xi2 ) {\r\n    float r = radius*sqrt(1.0 - Xi1);\r\n    float theta = Xi2*TWO_PI;\r\n\treturn vec2( r*cos(theta), r*sin(theta) );\r\n}\r\n\r\nvec3 uniformDirectionWithinCone( in vec3 d, in float phi, in float sina, in float cosa ) {    \r\n\tvec3 w = normalize(d);\r\n    vec3 u = normalize(cross(w.yzx, w));\r\n    vec3 v = cross(w, u);\r\n\treturn (u*cos(phi) + v*sin(phi)) * sina + w * cosa;\r\n}\r\n\r\n//taken from: https://www.shadertoy.com/view/4sSSW3\r\nvoid basis(in vec3 n, out vec3 f, out vec3 r) {\r\n    if(n.z < -0.999999) {\r\n        f = vec3(0 , -1, 0);\r\n        r = vec3(-1, 0, 0);\r\n    } else {\r\n    \tfloat a = 1./(1. + n.z);\r\n    \tfloat b = -n.x*n.y*a;\r\n    \tf = vec3(1. - n.x*n.x*a, b, -n.x);\r\n    \tr = vec3(b, 1. - n.y*n.y*a , -n.y);\r\n    }\r\n}\r\n\r\nmat3 mat3FromNormal(in vec3 n) {\r\n    vec3 x;\r\n    vec3 y;\r\n    basis(n, x, y);\r\n    return mat3(x,y,n);\r\n}\r\n\r\nvoid cartesianToSpherical(in vec3 xyz, out float rho, out float phi, out float theta ) {\r\n    rho = sqrt((xyz.x * xyz.x) + (xyz.y * xyz.y) + (xyz.z * xyz.z));\r\n    phi = asin(xyz.y / rho);\r\n\ttheta = atan( xyz.z, xyz.x );\r\n}\r\n\r\nvec3 sphericalToCartesian( in float rho, in float phi, in float theta ) {\r\n    float sinTheta = sin(theta);\r\n    return vec3( sinTheta*cos(phi), sinTheta*sin(phi), cos(theta) )*rho;\r\n}\r\n\r\nvec3 sampleHemisphereCosWeighted( in float Xi1, in float Xi2 ) {\r\n    float theta = acos(sqrt(1.0-Xi1));\r\n    float phi = TWO_PI * Xi2;\r\n\r\n    return sphericalToCartesian( 1.0, phi, theta );\r\n}\r\n\r\nvec3 randomDirection( in float Xi1, in float Xi2 ) {\r\n    float theta = acos(1.0 - 2.0*Xi1);\r\n    float phi = TWO_PI * Xi2;\r\n    \r\n    return sphericalToCartesian( 1.0, phi, theta );\r\n}\r\n//*****************************************************************************\r\n\r\n// ************************   Scattering functions  *************************\r\nbool sameHemisphere(in vec3 n, in vec3 a, in vec3 b){\r\n\treturn ((dot(n,a)*dot(n,b))>0.0);\r\n}\r\n\r\nbool sameHemisphere(in vec3 a, in vec3 b){\r\n\treturn (a.z*b.z>0.0);\r\n}\r\n\r\nvec3 mtlEval(Material mtl, in vec3 Ng, in vec3 Ns, in vec3 Ee, in vec3 L) {\r\n    if(mtl.type_ == 1) return vec3(0.0);\r\n\r\n    return \tvec3(INV_PI) * mtl.color_;\r\n}\r\n\r\n\r\n\r\nvec3 mtlSample(Material mtl, in vec3 Ng, in vec3 Ns, in vec3 Ee, in float Xi1, in float Xi2, out vec3 L, out float pdf) {\r\n    if(mtl.type_ == 0) {\r\n        mat3 trans = mat3FromNormal(Ns);\r\n        //mat3 inv_trans = mat3Inverse( trans );\r\n\r\n        //convert directions to local space\r\n        //vec3 E_local = inv_trans * Ee;\r\n        vec3 L_local;\r\n        \r\n    \t//if (E_local.z == 0.0) return vec3(0.);\r\n        \r\n        L_local = sampleHemisphereCosWeighted( Xi1, Xi2 );\r\n        pdf = INV_PI * L_local.z;\r\n        \r\n        //convert directions to global space\r\n    \tL = trans*L_local;\r\n    } else {\r\n        L = reflect(-Ee, Ns);\r\n        pdf = 1.0;\r\n        return vec3(1.0);\r\n    }\r\n    \r\n    if(!sameHemisphere(Ns, Ee, L) || !sameHemisphere(Ng, Ee, L)) {\r\n        pdf = 0.0;\r\n    }\r\n    \r\n    return mtlEval(mtl, Ng, Ns, Ee, L);\r\n}\r\n\r\nfloat mtlPdf(Material mtl, in vec3 Ng, in vec3 Ns, in vec3 Ee, in vec3 L) {\r\n    \r\n    if(mtl.type_ == 0) {\r\n        mat3 trans = mat3FromNormal(Ns);\r\n        mat3 inv_trans = mat3Inverse( trans );\r\n\r\n        vec3 E_local = inv_trans * Ee;\r\n        vec3 L_local = inv_trans * L;\r\n\r\n        if(!sameHemisphere(Ng, E_local, L_local)) {\r\n            return 0.0;\r\n        }\r\n        \r\n        return abs(L_local.z)*INV_PI;\r\n    } else {\r\n        return 0.0;\r\n    }\r\n}\r\n\r\n\r\n\r\n// ************************  INTERSECTION FUNCTIONS **************************\r\n\r\nbool solveQuadratic(float A, float B, float C, out float t0, out float t1) {\r\n\tfloat discrim = B*B-4.0*A*C;\r\n    \r\n\tif ( discrim <= 0.0 )\r\n        return false;\r\n    \r\n\tfloat rootDiscrim = sqrt( discrim );\r\n    \r\n    float t_0 = (-B-rootDiscrim)/(2.0*A);\r\n    float t_1 = (-B+rootDiscrim)/(2.0*A);\r\n    \r\n    t0 = min( t_0, t_1 );\r\n    t1 = max( t_0, t_1 );\r\n    \r\n\treturn true;\r\n}\r\n\r\nbool rayAABBIntersection( in Ray ray, float minX, float minY, float minZ, float maxX, float maxY, float maxZ, out float t, out SurfaceHitInfo isect ) {\r\n    vec3 boxMin = vec3( minX, minY, minZ );\r\n    vec3 boxMax = vec3( maxX, maxY, maxZ );\r\n    \r\n    vec3 OMIN = ( boxMin - ray.origin ) / ray.direction;\r\n    vec3 OMAX = ( boxMax - ray.origin ) / ray.direction;\r\n    vec3 MAX = max ( OMAX, OMIN );\r\n    vec3 MIN = min ( OMAX, OMIN );\r\n    float t1 = min ( MAX.x, min ( MAX.y, MAX.z ) );\r\n    t = max ( max ( MIN.x, 0.0 ), max ( MIN.y, MIN.z ) );\r\n    \r\n    if ( t1 <= t )\r\n        return false;\r\n    \r\n    isect.position_ = ray.origin + ray.direction*t;\r\n    if( isect.position_.x < minX - EPSILON ) {\r\n        isect.normal_ =  vec3( -1.0, 0.0, 0.0 );\r\n    } else if( isect.position_.x > maxX - EPSILON ) {\r\n        isect.normal_ =  vec3( 1.0, 0.0, 0.0 );\r\n    } else if( isect.position_.y < minY - EPSILON ) {\r\n        isect.normal_ =  vec3( 0.0, -1.0, 0.0 );\r\n    } else if( isect.position_.y > maxY - EPSILON ) {\r\n        isect.normal_ =  vec3( 0.0, 1.0, 0.0 );\r\n    } else if( isect.position_.z < minZ - EPSILON ) {\r\n        isect.normal_ =  vec3( 0.0, 0.0, -1.0 );\r\n    } else /*if( isect.position_.z > maxZ - EPSILON ) )*/ {\r\n        isect.normal_ =  vec3( 0.0, 0.0, 1.0 );\r\n    }\r\n    \r\n    return true;\r\n}\r\n\r\nbool iSphere(in Ray ray, in vec3 sph_o, in float sph_r2, out float t0, out float t1) {\r\n    vec3 L = ray.origin - sph_o;\r\n    float a = dot( ray.direction, ray.direction );\r\n    float b = 2.0 * dot( ray.direction, L );\r\n    float c = dot( L, L ) - sph_r2;\r\n    return solveQuadratic(a, b, c, t0, t1);\r\n}\r\n\r\nbool raySphereIntersection( in Ray ray, in float radiusSquared, out float t, out SurfaceHitInfo isect ) {\r\n    float t0, t1;\r\n    if (!iSphere(ray, vec3(.0), radiusSquared, t0, t1))\r\n\t\treturn false;\r\n    \r\n    t = mix(mix(-1.0, t1, float(t1 > 0.0)), t0, float(t0 > 0.0));\r\n    \r\n    isect.position_ = ray.origin + ray.direction*t;\r\n    isect.normal_ = normalize( isect.position_ );\r\n\t\r\n\treturn (t != -1.0);\r\n}\r\n\r\nbool rayAAPlaneIntersection( in Ray ray, in float min_x, in float min_y, in float max_x, in float max_y, out float t, out SurfaceHitInfo isect ) {\r\n    if ( ray.direction.z == 0.0 )\r\n    \treturn false;\r\n    \r\n    t = ( -ray.origin.z ) / ray.direction.z;\r\n    \r\n    isect.position_ = ray.origin + ray.direction*t;\r\n    isect.normal_ \t= vec3( 0.0, 0.0, 1.0 );\r\n    return\t(isect.position_.x > min_x) &&\r\n       \t\t(isect.position_.x < max_x) &&\r\n      \t\t(isect.position_.y > min_y) &&\r\n      \t\t(isect.position_.y < max_y);\r\n}\r\n\r\nbool iCylinder(in Ray r, float radius, out float t0, out float t1) {\r\n\tfloat a = r.direction.x*r.direction.x + r.direction.y*r.direction.y;\r\n\tfloat b = 2.0 * (r.direction.x*r.origin.x + r.direction.y*r.origin.y);\r\n\tfloat c = r.origin.x*r.origin.x + r.origin.y*r.origin.y - radius*radius;\r\n\treturn solveQuadratic(a, b, c, t0, t1);\r\n}\r\n\r\nbool rayCylinderIntersection( in Ray r, in float radius, in float minZ, in float maxZ, in float maxPhi, out float t, out SurfaceHitInfo isect ) {\r\n\tfloat phi;\r\n\tvec3 phit;\r\n\tfloat t0, t1;\r\n    \r\n\tif (!iCylinder(r, radius, t0, t1))\r\n\t\treturn false;\r\n\r\n    if ( t1 < 0.0 )\r\n        return false;\r\n    \r\n\tt = t0;\r\n    \r\n\tif (t0 < 0.0)\r\n\t\tt = t1;\r\n\r\n\t// Compute cylinder hit point and $\\phi$\r\n\tphit = r.origin + r.direction*t;\r\n\tphi = atan(phit.y,phit.x);\r\n    phi += PI;\r\n    \r\n\tif (phi < 0.0)\r\n        phi += TWO_PI;\r\n \r\n\t// Test cylinder intersection against clipping parameters\r\n\tif ( (phit.z < minZ) || (phit.z > maxZ) || (phi > maxPhi) ) {\r\n\t\tif (t == t1)\r\n            return false;\r\n\t\tt = t1;\r\n\t\t// Compute cylinder hit point and $\\phi$\r\n\t\tphit = r.origin + r.direction*t;\r\n\t\tphi = atan(phit.y,phit.x);\r\n        phi += PI;\r\n\r\n\t\tif ( (phit.z < minZ) || (phit.z > maxZ) || (phi > maxPhi) )\r\n\t\t\treturn false;\r\n\t}\r\n    \r\n    isect.position_ = phit;\r\n    isect.normal_ = normalize( vec3( phit.xy, 0.0 ) );\r\n    \r\n\treturn true;\r\n}\r\n\r\n// Distance from p to sphere of radius s (centered at origin)\r\nfloat sdSphere( vec3 p, float s )\r\n{\r\n    return length(p)-s;\r\n}\r\n\r\nfloat map( in vec3 pos )\r\n{\r\n    float a = 15.0;\r\n    return 0.2 * sdSphere( pos, 1.3 )\r\n                           + 0.03*sin(a*pos.x)*sin(a*pos.y)*sin(a*pos.z);\r\n}\r\n\r\nvec3 calcNormal( in vec3 pos )\r\n{\r\n    // epsilon = a small number\r\n    vec2 e = vec2(1.0,-1.0)*0.5773*0.0002;\r\n    \r\n    return normalize( e.xyy*map( pos + e.xyy ) + \r\n\t\t\t\t\t  e.yyx*map( pos + e.yyx ) + \r\n\t\t\t\t\t  e.yxy*map( pos + e.yxy ) + \r\n\t\t\t\t\t  e.xxx*map( pos + e.xxx ) );\r\n}\r\n\r\n// Cast a ray from origin ro in direction rd until it hits an object.\r\n// Return (t,m) where t is distance traveled along the ray, and m\r\n// is the material of the object hit.\r\nbool castRay( in Ray ray, out float t, out vec3 n ){\r\n    float tmin = 0.0;\r\n    float tmax = 100.0;\r\n    \r\n    if(!iSphere(ray, vec3(0.), 2.25, tmin, tmax))return false;\r\n    tmin = max(tmin, 0.0);\r\n    \r\n    t = tmin;\r\n    for( int i=0; i<256; i++ )\r\n    {\r\n\t    float precis = 0.0002*t;\r\n        vec3 p = ray.origin + ray.direction*t;\r\n        float d = map( p );\r\n\t    \r\n        if( d<precis || t>tmax ) break;\r\n        t += d;\r\n    }\r\n    \r\n    n = calcNormal( ray.origin + ray.direction*t );\r\n    bool res = t > tmin && t < tmax;\r\n    \r\n    return res;\r\n}\r\n\r\nbool rayBunnyIntersection( in Ray ray, in bool forShadowTest, out float t, out SurfaceHitInfo isect ) {\r\n    bool res = castRay( ray, t, isect.normal_ );\r\n    isect.position_ = ray.origin + ray.direction*t;\r\n    return res;\r\n}\r\n\r\nbool rayObjectIntersect( in Ray ray, in Object obj, in float distMin, in float distMax, in bool forShadowTest, out SurfaceHitInfo hit, out float dist ) {\r\n    bool hitResult = false;\r\n    float t;\r\n    SurfaceHitInfo currentHit;\r\n\r\n    //Convert ray to object space\r\n    Ray rayLocal;\r\n    rayLocal.origin = toVec3( obj.transform_inv_*vec4( ray.origin, 1.0 ) );\r\n    rayLocal.direction \t= toVec3( obj.transform_inv_*vec4( ray.direction   , 0.0 ) );\r\n\r\n    if( obj.type_ == OBJ_PLANE ) {\r\n        hitResult = rayAAPlaneIntersection( rayLocal, obj.params_[0], obj.params_[1], obj.params_[2], obj.params_[3], t, currentHit );\r\n    } else if( obj.type_ == OBJ_SPHERE ) {\r\n        hitResult = raySphereIntersection( \trayLocal, obj.params_[1], t, currentHit );\r\n    } else if( obj.type_ == OBJ_CYLINDER ) {\r\n        hitResult = rayCylinderIntersection(rayLocal, obj.params_[0], obj.params_[1], obj.params_[2], obj.params_[3], t, currentHit );\r\n    } else if( obj.type_ == OBJ_AABB ) {\r\n        hitResult = rayAABBIntersection( rayLocal, obj.params_[0], obj.params_[1], obj.params_[2], obj.params_[3], obj.params_[4], obj.params_[5], t, currentHit );\r\n    } else if( obj.type_ == OBJ_BUNNY ) {\r\n        hitResult = rayBunnyIntersection( rayLocal, forShadowTest, t, currentHit );\r\n    }\r\n\r\n    if( hitResult && ( t > distMin ) && ( t < distMax ) ) {\r\n        //Convert results to world space\r\n        currentHit.position_ = toVec3( obj.transform_*vec4( currentHit.position_, 1.0 ) );\r\n        currentHit.normal_   = toVec3( obj.transform_*vec4( currentHit.normal_  , 0.0 ) );\r\n        currentHit.tangent_  = toVec3( obj.transform_*vec4( currentHit.tangent_ , 0.0 ) );\r\n\r\n        dist = t;\r\n        hit = currentHit;\r\n        hit.mtl_id_ = obj.mtl_id_;\r\n        \r\n        return true;\r\n    } else {\r\n    \treturn false;\r\n    }\r\n}\r\n\r\n#define CHECK_OBJ( obj ) { SurfaceHitInfo currentHit; float currDist; if( rayObjectIntersect( ray, obj, distMin, nearestDist, forShadowTest, currentHit, currDist ) && ( currDist < nearestDist ) ) { nearestDist = currDist; hit = currentHit; } }\r\nbool raySceneIntersection( in Ray ray, in float distMin, in bool forShadowTest, out SurfaceHitInfo hit, out float nearestDist ) {\r\n    nearestDist = 10000.0;\r\n    \r\n    for(int i=0; i<N_OBJECTS; i++ ) {\r\n        CHECK_OBJ( objects[i] );\r\n    }\r\n    return ( nearestDist < 1000.0 );\r\n}\r\n// ***************************************************************************\r\n\r\n\r\nvoid initScene() {\r\n    \r\n    //create lights\r\n    createLight(vec3(1.0, 1.0, 0.9), 140.0, lights[0]);\r\n    \r\n    //Create materials\r\n    createMaterial(0, vec3(1.0, 1.0, 1.0), materials[0]);\r\n    createMaterial(0, vec3(0.85, 0.85, 0.85), materials[1]);\r\n    createMaterial(1, vec3(1.0, 0.5, 1.0), materials[2]);\r\n    createMaterial(0, vec3(0.5, 0.5, 1.0), materials[3]);\r\n#ifdef BOX\r\n    createMaterial(0, vec3(0.96, 0.02, 0.05), materials[4]);\r\n#endif\r\n    \r\n    //init lights\r\n    float r = 0.3;\r\n    float xFactor = (uMouse.x==0.0)?0.0:2.0*(uMouse.x/uResolution.x) - 1.0;\r\n    float yFactor = (uMouse.y==0.0)?0.0:2.0*(uMouse.y/uResolution.y) - 1.0;\r\n    float x = xFactor*7.0;\r\n    float z = -3.0-yFactor*5.0;\r\n    float a = -2.2;\r\n    mat4 trans = createCS(\tvec3(x, 3.0, z),\r\n                          \tvec3(0.0, sin(a), cos(a)),\r\n                  \t\t\tvec3(1.0, 0.0, 0.0));\r\n#ifdef SPHERE_LIGHT\r\n    createSphere(trans, r, LIGHT_ID_BASE+0, objects[0] );\r\n#else\r\n    float aa = 2.0 * r;\r\n    float bb = 3.0 * r;\r\n    createPlane(trans, -bb, -aa, bb, aa, LIGHT_ID_BASE+0, objects[0]);\r\n#endif\r\n    \r\n    \r\n    //plane 1\r\n    trans = mat4(\tvec4( 1.0, 0.0, 0.0, 0.0 ),\r\n                    vec4( 0.0, 1.0, 0.0, 0.0 ),\r\n                    vec4( 0.0, 0.0, 1.0, 0.0 ),\r\n                    vec4( 0.0, 5.0, -10.0, 1.0 ));\r\n    createPlane(trans, -10.0, -2.0, 10.0, 4.0, SURFACE_ID_BASE+1, objects[1]);\r\n   \r\n    //plane 2\r\n    trans = mat4(\tvec4( 1.0, 0.0, 0.0, 0.0 ),\r\n                    vec4( 0.0, 0.0, -1.0, 0.0 ),\r\n                    vec4( 0.0, -1.0, 0.0, 0.0 ),\r\n                    vec4( 0.0, -1.0, -4.0, 1.0 ));\r\n    createPlane(trans, -10.0, -4.0, 10.0, 2.0, SURFACE_ID_BASE+1, objects[2]);\r\n \r\n    //Cylinder\r\n    trans = mat4(\tvec4( 0.0, 1.0, 0.0, 0.0 ),\r\n                    vec4( 0.0, 0.0, 1.0, 0.0 ),\r\n                    vec4( 1.0, 0.0, 0.0, 0.0 ),\r\n                    vec4( -0.0, 3.0, -6.0, 1.0 ));\r\n    createCylinder(trans, 4.0, -10.0, 10.0, PI/2.0, SURFACE_ID_BASE+1, objects[3] );\r\n    \r\n    trans = mat4( \tvec4( 1.0, 0.0, 0.0, 0.0 ),\r\n                    vec4( 0.0, 1.0, 0.0, 0.0 ),\r\n                    vec4( 0.0, 0.0, 1.0, 0.0 ),\r\n                    vec4( -2.0, 0.3, -4.5, 1.0 ));\r\n    createBunny(trans, SURFACE_ID_BASE+2, objects[4]);\r\n    \r\n    vec3 xvec = normalize(vec3(0.8, 0.2, -0.1));\r\n    trans = createCS(\tvec3(2.0, 0.3, -4.5),\r\n                        xvec,\r\n                  \t\tvec3(0.0, 1.0, 0.0));\r\n    createBunny(trans, SURFACE_ID_BASE+3, objects[5]);\r\n    \r\n#ifdef BOX\r\n    //box\r\n    xvec = normalize(vec3(0.8, 0.0, -0.25));\r\n    trans = createCS(\tvec3(0.0, -0.5, -2.5),\r\n                        xvec,\r\n                  \t\tvec3(0.0, 1.0, 0.0));\r\n    createAABB( trans, -vec3(0.5), vec3(0.5), SURFACE_ID_BASE+4, objects[6]);\r\n#endif\r\n}\r\n\r\n///////////////////////////////////////////////////////////////////////\r\nvoid initCamera( \tin vec3 pos,\r\n                \tin vec3 target,\r\n                \tin vec3 upDir,\r\n                \tin float fovV,\r\n                \tin float focus_dist\r\n               ) {\r\n    camera.pos = vec3( 0.3, 3.0, 4.8 );\r\n    \r\n    target = vec3( 0.0, 0.4, -5.0 );\r\n    \r\n\tvec3 back = normalize( camera.pos-target );\r\n\tvec3 right = normalize( cross( upDir, back ) );\r\n\tvec3 up = cross( back, right );\r\n    camera.rotate[0] = right;\r\n    camera.rotate[1] = up;\r\n    camera.rotate[2] = back;\r\n    camera.fovV = fovV;\r\n    camera.focusDist = focus_dist;\r\n}\r\n\r\nRay genRay( in vec2 pixel, in float Xi1, in float Xi2 ) {\r\n    Ray ray;\r\n\r\n    vec2 iPlaneSize=2.*tan(0.5*camera.fovV)*vec2(uResolution.x/uResolution.y,1.);\r\n\tvec2 ixy=(pixel/uResolution.xy - 0.5)*iPlaneSize;\r\n    \r\n    ray.origin = camera.pos;\r\n    ray.direction = camera.rotate*normalize(vec3(ixy.x,ixy.y,-1.0));\r\n\r\n\treturn ray;\r\n}\r\n\r\n#ifdef SPHERE_LIGHT\r\nvec3 sampleLightSource( \tin vec3 x,\r\n                          \tfloat Xi1, float Xi2,\r\n                          \tout LightSamplingRecord sampleRec ) {\r\n    float sph_r2 = objects[0].params_[1];\r\n    vec3 sph_p = toVec3( objects[0].transform_*vec4(vec3(0.0,0.0,0.0), 1.0) );\r\n    \r\n    vec3 w = sph_p - x;\t\t\t//direction to light center\r\n\tfloat dc_2 = dot(w, w);\t\t//squared distance to light center\r\n    float dc = sqrt(dc_2);\t\t//distance to light center\r\n    \r\n    \r\n    float sin_theta_max_2 = sph_r2 / dc_2;\r\n\tfloat cos_theta_max = sqrt( 1.0 - clamp( sin_theta_max_2, 0.0, 1.0 ) );\r\n    float cos_theta = mix( cos_theta_max, 1.0, Xi1 );\r\n    float sin_theta_2 = 1.0 - cos_theta*cos_theta;\r\n    float sin_theta = sqrt(sin_theta_2);\r\n    sampleRec.w = uniformDirectionWithinCone( w, TWO_PI*Xi2, sin_theta, cos_theta );\r\n    sampleRec.pdf = 1.0/( TWO_PI * (1.0 - cos_theta_max) );\r\n        \r\n    //Calculate intersection distance\r\n\t//http://ompf2.com/viewtopic.php?f=3&t=1914\r\n    sampleRec.d = dc*cos_theta - sqrt(sph_r2 - dc_2*sin_theta_2);\r\n    \r\n    return lights[0].color_*lights[0].intensity_;\r\n}\r\n\r\nfloat sampleLightSourcePdf( in vec3 x,\r\n                            in vec3 wi,\r\n                           \tin float d,\r\n                            in float cosAtLight ) {\r\n    float sph_r2 = objects[0].params_[1];\r\n    vec3 sph_p = toVec3( objects[0].transform_*vec4(vec3(0.0,0.0,0.0), 1.0) );\r\n    float solidangle;\r\n    vec3 w = sph_p - x;\t\t\t//direction to light center\r\n\tfloat dc_2 = dot(w, w);\t\t//squared distance to light center\r\n    float dc = sqrt(dc_2);\t\t//distance to light center\r\n    \r\n    if( dc_2 > sph_r2 ) {\r\n    \tfloat sin_theta_max_2 = clamp( sph_r2 / dc_2, 0.0, 1.0);\r\n\t\tfloat cos_theta_max = sqrt( 1.0 - sin_theta_max_2 );\r\n    \tsolidangle = TWO_PI * (1.0 - cos_theta_max);\r\n    } else { \r\n    \tsolidangle = FOUR_PI;\r\n    }\r\n    \r\n    return 1.0/solidangle;\r\n}\r\n#else\r\nvec3 sampleLightSource(\t\tin vec3 x,\r\n                          \tfloat Xi1, float Xi2,\r\n                       out LightSamplingRecord sampleRec) {\r\n    float min_x = objects[0].params_[0];\t\t\t//min x\r\n    float min_y = objects[0].params_[1];\t\t\t//min y\r\n    float max_x = objects[0].params_[2];\t\t\t//max x\r\n    float max_y = objects[0].params_[3];\t\t\t//max y\r\n    float dim_x = max_x - min_x;\r\n    float dim_y = max_y - min_y;\r\n    vec3 p_local = vec3(min_x + dim_x*Xi1, min_y + dim_y*Xi2, 0.0);\r\n    vec3 n_local = vec3(0.0, 0.0, 1.0);\r\n    vec3 p_global = toVec3( objects[0].transform_*vec4(p_local, 1.0) );\r\n    vec3 n_global = toVec3( objects[0].transform_*vec4(n_local, 0.0) );\r\n    \r\n    float pdfA = 1.0 / (dim_x*dim_y);\r\n    sampleRec.w = p_global - x;\r\n    sampleRec.d = length(sampleRec.w);\r\n    sampleRec.w = normalize(sampleRec.w);\r\n    float cosAtLight = dot(n_global, -sampleRec.w);\r\n    vec3 L = cosAtLight>0.0?getRadiance(vec2(Xi1,Xi2)):vec3(0.0);\r\n    sampleRec.pdf = PdfAtoW(pdfA, sampleRec.d*sampleRec.d, cosAtLight);\r\n    \r\n\treturn L*0.3;\r\n}\r\n\r\nfloat sampleLightSourcePdf( in vec3 x,\r\n                               in vec3 wi,\r\n                             \tfloat d,\r\n                              \tfloat cosAtLight\r\n                             ) {\r\n    float min_x = objects[0].params_[0];\t\t\t//min x\r\n    float min_y = objects[0].params_[1];\t\t\t//min y\r\n    float max_x = objects[0].params_[2];\t\t\t//max x\r\n    float max_y = objects[0].params_[3];\t\t\t//max y\r\n    float dim_x = max_x - min_x;\r\n    float dim_y = max_y - min_y;\r\n    float pdfA = 1.0 / (dim_x*dim_y);\r\n    return PdfAtoW(pdfA, d*d, cosAtLight);\r\n}\r\n#endif\r\n\r\nbool isLightVisible( Ray shadowRay ) {\r\n    float distToHit;\r\n    SurfaceHitInfo tmpHit;\r\n    \r\n    raySceneIntersection( shadowRay, EPSILON, true, tmpHit, distToHit );\r\n    \r\n    return ( tmpHit.mtl_id_ >= LIGHT_ID_BASE );\r\n}\r\n\r\nvec3 sampleBSDF(\tin vec3 x,\r\n                  \tin vec3 ng,\r\n                  \tin vec3 ns,\r\n                \tin vec3 wi,\r\n                  \tin Material mtl,\r\n                  \tin bool useMIS,\r\n                \tout vec3 wo,\r\n                \tout float brdfPdfW,\r\n                \tout vec3 fr,\r\n                \tout bool hitRes,\r\n                \tout SurfaceHitInfo hit) {\r\n    vec3 Lo = vec3(0.0);\r\n    \r\n    fr = mtlSample(mtl, ng, ns, wi, rnd(), rnd(), wo, brdfPdfW);\r\n\r\n    float dotNWo = dot(wo, ns);\r\n    //Continue if sampled direction is under surface\r\n    if ((dot(fr,fr)>0.0) && (brdfPdfW > EPSILON)) {\r\n        Ray shadowRay = Ray(x, wo);\r\n\r\n        //abstractLight* pLight = 0;\r\n        float cosAtLight = 1.0;\r\n        float distanceToLight = -1.0;\r\n        vec3 Li = vec3(0.0);\r\n\r\n        {\r\n            float distToHit;\r\n\r\n            if(raySceneIntersection( shadowRay, EPSILON, false, hit, distToHit )) {\r\n                if(hit.mtl_id_>=LIGHT_ID_BASE) {\r\n                    distanceToLight = distToHit;\r\n                    cosAtLight = dot(hit.normal_, -wo);\r\n                    if(cosAtLight > 0.0) {\r\n                        Li = getRadiance(hit.uv_);\r\n                        //Li = lights[0].color_*lights[0].intensity_;\r\n                    }\r\n                } else {\r\n                    hitRes = true;\r\n                }\r\n            } else {\r\n                hitRes = false;\r\n                //TODO check for infinite lights\r\n            }\r\n        }\r\n\r\n        if (distanceToLight>0.0) {\r\n            if (cosAtLight > 0.0) {\r\n                vec3 contribution = (Li * fr * dotNWo) / brdfPdfW;\r\n\r\n                if (useMIS && !(mtl.type_==1)) {\r\n                    float lightPickPdf = 1.0;//lightPickingPdf(x, n);\r\n                    float lightPdfW = sampleLightSourcePdf( x, wi, distanceToLight, cosAtLight );\r\n \r\n                    contribution *= misWeight(brdfPdfW, lightPdfW);\r\n                }\r\n\r\n                Lo += contribution;\r\n            }\r\n        }\r\n    }\r\n\r\n    return Lo;\r\n}\r\n\r\nvec3 salmpleLight(\tin vec3 x,\r\n                  \tin vec3 ng,\r\n                  \tin vec3 ns,\r\n                  \tin vec3 wi,\r\n                  \tin Material mtl,\r\n                  \tin bool useMIS ) {\r\n    vec3 Lo = vec3(0.0);\t//outgoing radiance\r\n\r\n    float lightPickingPdf = 1.0;\r\n    Light light = lights[0];\r\n\r\n    vec3 wo;\r\n    float lightPdfW, lightDist;\r\n\r\n    LightSamplingRecord rec;\r\n    vec3 Li = sampleLightSource( x, rnd(), rnd(), rec );\r\n    wo = rec.w;\r\n    lightPdfW = rec.pdf;\r\n    lightDist = rec.d;\r\n    lightPdfW *= lightPickingPdf;\r\n\r\n    float dotNWo = dot(wo, ns);\r\n\r\n    if ((dotNWo > 0.0) && (lightPdfW > EPSILON)) {\r\n        vec3 fr = mtlEval(mtl, ng, ns, wi, wo);\r\n        if(dot(fr,fr)>0.0) {\r\n            Ray shadowRay = Ray(x, wo);\r\n            if (isLightVisible( shadowRay )) {\r\n                vec3 contribution = (Li * fr * dotNWo) / lightPdfW;\r\n\r\n                if (useMIS && !(mtl.type_==1)) {\r\n                    float brdfPdfW = mtlPdf(mtl, ng, ns, wi, wo);\r\n                    contribution *= misWeight(lightPdfW, brdfPdfW);\r\n                }\r\n\r\n                Lo += contribution;\r\n            }\r\n        }\r\n    }\r\n\r\n    return Lo;\r\n}\r\n\r\nvec3 Radiance( in Ray r, int strataCount, int strataIndex ) {\r\n    vec3 e = vec3(0.0), fr, directLight, pathWeight = vec3(1.0, 1.0, 1.0);\r\n    vec3 wo;\r\n    float woPdf;\r\n    float dotWoN;\r\n    bool hitResult;\r\n\r\n    //Calculate first intersections to determine first scattering event\r\n    Ray ray = r;\r\n    SurfaceHitInfo event;\r\n    SurfaceHitInfo nextEvent;\r\n    float dist;\r\n    if(!raySceneIntersection( ray, 0.0, false, event, dist )) {\r\n        return vec3(0.0);\r\n    } else {\r\n        //We have to add emmision component on first hit\r\n        if( event.mtl_id_ >= LIGHT_ID_BASE ) {\r\n            Light light = getLight(event.mtl_id_ - LIGHT_ID_BASE);\r\n            float cosAtLight = dot(event.normal_, -ray.direction);\r\n            if(cosAtLight > 0.0) {\r\n                e = getRadiance(event.uv_);\r\n            }\r\n        }\r\n    }\r\n    \r\n    vec3 direct = vec3(0.0), indirect = vec3(0.0);\r\n\r\n    for (int i = 0; i < MAX_DEPTH; i++) {\r\n        if(event.mtl_id_>=LIGHT_ID_BASE){\r\n        \tbreak;\r\n    \t}\r\n        \r\n        vec3 x = event.position_;\r\n        vec3 wi = -ray.direction;\r\n        if(dot(wi, event.normal_) < 0.0) {\r\n            event.normal_ *= -1.0;\r\n        }\r\n        \r\n        Material mtl = getMaterial(event.mtl_id_);\r\n    \tvec3 ng = event.normal_, ns;\r\n        vec3 tangent = vec3(event.normal_.xzy);\r\n        tangent = orthogonalize(event.normal_, tangent);\r\n    \r\n        mat3 frame;\r\n        frame[0] = tangent;\r\n        frame[1] = cross( ng, tangent );\r\n        frame[2] = ng;\r\n        ns = event.normal_;//frame*ns;\r\n        \r\n        if (dot(wi,ns) < 0.0) { break; }\r\n \r\n        //Calculate direct light with 'Light sampling' and 'BSDF sampling' techniques\r\n        //In addition BSDF sampling does next event estimation and returns all necessary values which corresponds to next event\r\n       \tdirectLight  = salmpleLight (x, ng, ns, wi, mtl, true);\r\n        directLight += sampleBSDF   (x, ng, ns, wi, mtl, true, wo, woPdf, fr, hitResult, nextEvent);\r\n       \r\n        if(pathWeight.x > 1.0 || pathWeight.y > 1.0 || pathWeight.z > 1.0)\r\n            break;\r\n        \r\n        if(i == 0) {\r\n            direct += directLight*pathWeight;\r\n        } else {\r\n        \tindirect += directLight*pathWeight;\r\n        }\r\n\r\n        if (!hitResult || (dotWoN = dot(event.normal_, wo))<0.0) { break; }\r\n        if (woPdf == 0.0) { break; }\r\n        pathWeight *= fr*dotWoN / woPdf;\r\n\r\n        //Update values for next iteration\r\n        ray = Ray(event.position_, wo);\r\n        event = nextEvent;\r\n    }\r\n    \r\n    //Clamp only indirect\r\n    indirect = vec3(min(indirect, vec3(CLAMP_VALUE)));\r\n\r\n    return e + direct + indirect;\r\n}\r\n\r\n// void mainImage( out vec4 fragColor, in vec2 gl_FragColor )\r\nvoid main( void )\r\n{\r\n    //随机数种子. 使用时间+视口分辨率,视口坐标\r\n    // seed = uTime + uResolution.y * gl_FragCoord.x   + gl_FragCoord.y;// / uResolution.x     /uResolution.y\r\n\tseed = mod(uSampleCounter,1000.0) * uRandomVector.x - uRandomVector.y + uResolution.y * gl_FragCoord.x / uResolution.x + uResolution.x * gl_FragCoord.y / uResolution.y;\r\n    \r\n    float fov = radians(40.0);\r\n    initCamera( vec3( 0.0, 0.0, 0.0 ),\r\n               vec3( 0.0, 0.0, 0.0 ),\r\n               vec3( 0.0, 1.0, 0.0 ),\r\n               fov,\r\n               9.2\r\n              );\r\n\r\n    initScene();\r\n\r\n    //积累的颜色\r\n    vec3 accumulatedColor = vec3( 0.0 );\r\n    //累积覆盖率 0-1\r\n    float oneOverSPP = 1.0/float(PIXEL_SAMPLES);\r\n    float strataSize = oneOverSPP;\r\n\r\n    //取样\r\n    for( int si=0; si<PIXEL_SAMPLES; ++si ){\r\n        vec2 sc = gl_FragCoord.xy + vec2(strataSize*(float(si) + rnd()), rnd());\r\n        accumulatedColor += Radiance(genRay(sc, rnd(), rnd()), PIXEL_SAMPLES, si);\r\n    }\r\n\r\n    //devide to sample count  等分采样计数\r\n    accumulatedColor = accumulatedColor*oneOverSPP;\r\n    \r\n    vec3 col_acc;\r\n    vec2 coord = floor(gl_FragCoord.xy * uResolution.xy); //取整\r\n    if(all(equal(coord.xy,vec2(0))))  //如果坐标为0\r\n    {\r\n\r\n        if( uMouse.z > 0.0 ) {\r\n            col_acc = vec3(uSampleCounter);\r\n        }\r\n        else {\r\n            col_acc = texture2D( tPreviousTexture, vec2(0.5, 0.5)/uResolution.xy ).xyz;\r\n        }\r\n    }\r\n    else \r\n    {\r\n        if(uSampleCounter == 1.0) \r\n        {\r\n            col_acc = accumulatedColor;\r\n        }\r\n        else\r\n        {\r\n            vec3 col_new = accumulatedColor;\r\n            //读取原先的颜色值.\r\n            col_acc = texture2D( tPreviousTexture, vUv ).xyz;\r\n            //mix 线性插值. 取x,y的线性混合,x*(1-a)+y*a\r\n            // col_acc = mix(col_acc, col_new, float(1.0)/float(1.0+uSampleCounter));\r\n            col_acc = col_acc + col_new;\r\n        }\r\n    }\r\n    gl_FragColor = vec4( col_acc, 1.0 );\r\n}\r\n"

/***/ })
/******/ ]);
//# sourceMappingURL=PathTracingRender.js.map