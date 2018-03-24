precision highp float;
precision highp int;
precision highp sampler2D;
uniform mat4 uShortBoxInvMatrix;
uniform mat3 uShortBoxNormalMatrix;
uniform mat4 uTallBoxInvMatrix;
uniform mat3 uTallBoxNormalMatrix;
#include <pathtracing_uniforms_and_defines>
#define N_QUADS 6
#define N_BOXES 2
struct Ray { vec3 origin; vec3 direction; };
struct Quad { vec3 normal; vec3 v0; vec3 v1; vec3 v2; vec3 v3; vec3 emission; vec3 color; int type; };
struct Box { vec3 minCorner; vec3 maxCorner; vec3 emission; vec3 color; int type; };
struct Intersection { vec3 normal; vec3 emission; vec3 color; int type; };
Quad quads[N_QUADS];
Box boxes[N_BOXES];
#include <pathtracing_random_functions>
#include <pathtracing_quad_intersect>
#include <pathtracing_box_intersect>

//-----------------------------------------------------------------------
float SceneIntersect(Ray r, inout Intersection intersec)

//-----------------------------------------------------------------------
{
	vec3 normal;
	float d;
	float t = INFINITY;

	// clear fields out
	intersec.normal = vec3(0);
	intersec.emission = vec3(0);
	intersec.color = vec3(0);
	intersec.type = -1;

	for (int i = 0; i < N_QUADS; i++)
	{
		d = QuadIntersect(quads[i].v0, quads[i].v1, quads[i].v2, quads[i].v3, quads[i].normal, r);
		if (d < t) {
			t = d;
			intersec.normal = quads[i].normal;
			intersec.emission = quads[i].emission;
			intersec.color = quads[i].color;
			intersec.type = quads[i].type;
		}
	}


	// TALL MIRROR BOX
	Ray rObj;
	// transform ray into Tall Box's object space
	rObj.origin = vec3(uTallBoxInvMatrix * vec4(r.origin, 1.0));
	rObj.direction = vec3(uTallBoxInvMatrix * vec4(r.direction, 0.0));
	d = BoxIntersect(boxes[0].minCorner, boxes[0].maxCorner, rObj, normal);

	if (d < t) {
		t = d;

		// transfom normal back into world space
		normal = vec3(uTallBoxNormalMatrix * normal);

		intersec.normal = normalize(normal);
		intersec.emission = boxes[0].emission;
		intersec.color = boxes[0].color;
		intersec.type = boxes[0].type;
	}


	// SHORT DIFFUSE WHITE BOX
	// transform ray into Short Box's object space
	rObj.origin = vec3(uShortBoxInvMatrix * vec4(r.origin, 1.0));
	rObj.direction = vec3(uShortBoxInvMatrix * vec4(r.direction, 0.0));
	d = BoxIntersect(boxes[1].minCorner, boxes[1].maxCorner, rObj, normal);

	if (d < t) {
		t = d;

		// transfom normal back into world space
		normal = vec3(uShortBoxNormalMatrix * normal);

		intersec.normal = normalize(normal);
		intersec.emission = boxes[1].emission;
		intersec.color = boxes[1].color;
		intersec.type = boxes[1].type;
	}


	return t;
}

vec3 calcDirectLightingQuad_MultiMethod(vec3 mask, vec3 x, vec3 nl, Quad light, inout float seed, inout bool lightFound)
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
	if (shadowIntersec.type == LIGHT) {
		lightFound = true;
		float r2 = distance(light.v0, light.v1) * distance(light.v0, light.v3);
		vec3 d = randPointOnLight - shadowRay.origin;
		float d2 = dot(d, d);
		float weight = dot(-srDir, normalize(shadowIntersec.normal)) * r2 / d2;
		dirLight = mask * light.emission * nlDotSrDir * clamp(weight, 0.0, 1.0);
	}
	return dirLight;
}
#define EYEPATH_LENGTH      4
#define CAUSTICPATH_LENGTH  2
#define LIGHTPATH_LENGTH    1
//-----------------------------------------------------------------------
vec3 CalculateRadiance(Ray r, inout float seed)
//-----------------------------------------------------------------------
{
	Intersection intersec;
	vec3 accumCol = vec3(0);
	vec3 maskEyePath = vec3(1);
	vec3 maskLightPath = vec3(1);
	vec3 eyeX = vec3(0);
	vec3 lightX = vec3(0);
	vec3 firstX = vec3(0);
	vec3 nlFirst = vec3(0);
	vec3 nl, n, x;
	vec3 nlEyePath = vec3(0);
	vec3 nlLightPath = vec3(0);
	float t = INFINITY;
	bool bounceIsSpecular = true;
	bool diffuseReached = false;
	bool lightFound = false;
	bool exitEarly = false;

	// Eye path tracing (from Camera) ///////////////////////////////////////////////////////////////////////////

	for (int depth = 0; depth < EYEPATH_LENGTH; depth++)
	{

		t = SceneIntersect(r, intersec);

		if (t == INFINITY) {
			exitEarly = true;
			break;
		}

		if (intersec.type == LIGHT) {
			if (bounceIsSpecular) {
				accumCol += maskEyePath * intersec.emission;
				exitEarly = true;
			}

			break;
		}

		// useful data 
		n = normalize(intersec.normal);
		nl = dot(n, r.direction) < 0.0 ? normalize(n) : normalize(n * -1.0);
		x = r.origin + r.direction * t;


		if (intersec.type == DIFF) // Ideal DIFFUSE reflection
		{
			diffuseReached = true;
			bounceIsSpecular = false;
			maskEyePath *= intersec.color;
			eyeX = x + nl * 2.0;
			nlEyePath = nl;
			if (depth == 0) {
				firstX = eyeX;
				nlFirst = nlEyePath;
			}
			accumCol += 1.0 * calcDirectLightingQuad_MultiMethod(maskEyePath, x, nl, quads[5], seed, lightFound);

			// Russian roulette
			if (rand(seed) < 0.3 || depth > 2)
				break;

			// choose random Diffuse sample vector
			r = Ray(x, randomCosWeightedDirectionInHemisphere(nl, seed));
			r.origin += r.direction * 2.0;
			eyeX = r.origin;

			continue;
		}

		if (intersec.type == SPEC)  // Ideal SPECULAR reflection
		{
			maskEyePath *= intersec.color;
			r = Ray(x, reflect(r.direction, nl));
			r.origin += r.direction * 2.0;

			continue;
		}

	} // end for (int depth = 0; depth < EYEPATH_LENGTH; depth++)

	if (exitEarly || !diffuseReached)
		return accumCol;
	r.origin = firstX;
	vec3 randVec = vec3(rand(seed) * 2.0 - 1.0, rand(seed) * 2.0 - 1.0, rand(seed) * 2.0 - 1.0);
	vec3 offset = vec3(randVec.x * 82.0, randVec.y * 170.0, randVec.z * 80.0);
	vec3 target = vec3(180.0 + offset.x, 170.0 + offset.y, -350.0 + offset.z);
	vec3 causticDirection = normalize(target - r.origin);
	r.direction = causticDirection;
	exitEarly = false;
	for (int depth = 0; depth < CAUSTICPATH_LENGTH; depth++)
	{

		t = SceneIntersect(r, intersec);

		if (t == INFINITY) {
			break;
		}

		if (intersec.type == LIGHT) {
			if (depth == 1) {
				accumCol += 0.7 * maskEyePath * intersec.emission * max(0.0, dot(nlFirst, causticDirection));
				exitEarly = true;
			}

			break;
		}

		// useful data 
		n = normalize(intersec.normal);
		nl = dot(n, r.direction) < 0.0 ? normalize(n) : normalize(n * -1.0);
		x = r.origin + r.direction * t;

		if (intersec.type == DIFF) // Ideal DIFFUSE reflection
		{
			break;
		}

		if (intersec.type == SPEC)  // Ideal SPECULAR reflection
		{
			maskEyePath *= intersec.color;
			r = Ray(x, reflect(r.direction, nl));
			r.origin += r.direction * 2.0;

			continue;
		}

	} // end for (int depth = 0; depth < CAUSTICPATH_LENGTH; depth++)

	if (exitEarly || lightFound)
		return accumCol;
	// Light path tracing (from Light sources) ////////////////////////////////////////////////////////////////////
	vec3 randPointOnLight;
	randPointOnLight.x = mix(quads[5].v0.x, quads[5].v1.x, rand(seed));
	randPointOnLight.y = quads[5].v0.y;
	randPointOnLight.z = mix(quads[5].v0.z, quads[5].v3.z, rand(seed));
	vec3 randLightDir = randomCosWeightedDirectionInHemisphere(quads[5].normal, seed);
	randLightDir = normalize(randLightDir);
	r = Ray(randPointOnLight, randLightDir);
	r.origin += r.direction * 2.0;
	lightX = r.origin;
	maskLightPath = quads[5].emission;
	nlLightPath = quads[5].normal;


	for (int depth = 0; depth < LIGHTPATH_LENGTH; depth++)
	{

		t = SceneIntersect(r, intersec);

		if (t == INFINITY) {
			break;
		}

		// useful data 
		n = normalize(intersec.normal);
		nl = dot(n, r.direction) < 0.0 ? normalize(n) : normalize(n * -1.0);
		x = r.origin + r.direction * t;


		if (intersec.type == DIFF) // Ideal DIFFUSE reflection
		{
			maskLightPath *= max(0.0, dot(-r.direction, nl));
			maskLightPath *= intersec.color;
			lightX = x + nl * 2.0;
			nlLightPath = nl;
			diffuseReached = true;

			break;
		}

		if (intersec.type == SPEC)  // Ideal SPECULAR reflection
		{
			break;
		}

	} // end for (int depth = 0; depth < LIGHTPATH_LENGTH; depth++)

	if (!diffuseReached)
		return accumCol;
	// if we made it this far, the light ray has reached a diffuse surface that we can 
	// sample from, and light source has not yet been found by directLighting (we are in shadow)
	// Connect Camera path and Light path ////////////////////////////////////////////////////////////

	Ray connectRay = Ray(eyeX, normalize(lightX - eyeX));
	float connectDist = distance(eyeX, lightX);
	float c = SceneIntersect(connectRay, intersec);
	if (c > (connectDist - 1.0)) {
		maskLightPath *= max(0.0, dot(-connectRay.direction, nlLightPath));
		maskEyePath *= max(0.0, dot(connectRay.direction, nlEyePath));
		accumCol += 0.1 * (maskEyePath * maskLightPath);
	}

	return accumCol;
}
//-----------------------------------------------------------------------
void SetupScene(void)
//-----------------------------------------------------------------------
{
	vec3 z = vec3(0);// No color value, Black
	vec3 L1 = vec3(1.0, 0.7, 0.38) * 15.0;// Bright Yellowish light

	quads[0] = Quad(vec3(0.0, 0.0, 1.0), vec3(0.0, 0.0, -559.2), vec3(549.6, 0.0, -559.2), vec3(549.6, 548.8, -559.2), vec3(0.0, 548.8, -559.2), z, vec3(1), DIFF);// Back Wall
	quads[1] = Quad(vec3(1.0, 0.0, 0.0), vec3(0.0, 0.0, 0.0), vec3(0.0, 0.0, -559.2), vec3(0.0, 548.8, -559.2), vec3(0.0, 548.8, 0.0), z, vec3(0.7, 0.12, 0.05), DIFF);// Left Wall Red
	quads[2] = Quad(vec3(-1.0, 0.0, 0.0), vec3(549.6, 0.0, -559.2), vec3(549.6, 0.0, 0.0), vec3(549.6, 548.8, 0.0), vec3(549.6, 548.8, -559.2), z, vec3(0.2, 0.4, 0.36), DIFF);// Right Wall Green
	quads[3] = Quad(vec3(0.0, -1.0, 0.0), vec3(0.0, 548.8, -559.2), vec3(549.6, 548.8, -559.2), vec3(549.6, 548.8, 0.0), vec3(0.0, 548.8, 0.0), z, vec3(1), DIFF);// Ceiling
	quads[4] = Quad(vec3(0.0, 1.0, 0.0), vec3(0.0, 0.0, 0.0), vec3(549.6, 0.0, 0.0), vec3(549.6, 0.0, -559.2), vec3(0.0, 0.0, -559.2), z, vec3(1), DIFF);// Floor
	quads[5] = Quad(vec3(0.0, -1.0, 0.0), vec3(213.0, 548.0, -332.0), vec3(343.0, 548.0, -332.0), vec3(343.0, 548.0, -227.0), vec3(213.0, 548.0, -227.0), L1, z, LIGHT);// Area Light Rectangle in ceiling

	boxes[0] = Box(vec3(-82.0, -170.0, -80.0), vec3(82.0, 170.0, 80.0), z, vec3(1), SPEC);// Tall Mirror Box Left
	boxes[1] = Box(vec3(-86.0, -85.0, -80.0), vec3(86.0, 85.0, 80.0), z, vec3(1), DIFF);// Short Diffuse Box Right
}
#include <pathtracing_main>
