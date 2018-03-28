precision highp float;
precision highp int;
precision highp sampler2D;
uniform sampler2D tTriangleTexture;
uniform sampler2D tAABBTexture;
#include <pathtracing_uniforms_and_defines>
#define N_SPHERES 5
#define N_BOXES 2
//-----------------------------------------------------------------------
struct Ray { vec3 origin; vec3 direction; };
struct Sphere { float radius; vec3 position; vec3 emission; vec3 color; int type; };
struct Box { vec3 minCorner; vec3 maxCorner; vec3 emission; vec3 color; int type; };
struct Intersection { vec3 normal; vec3 emission; vec3 color; int type; };
Sphere spheres[N_SPHERES];
Box boxes[N_BOXES];
#include <pathtracing_random_functions>
#include <pathtracing_sphere_intersect>
#include <pathtracing_box_intersect>
#include <pathtracing_boundingbox_intersect>
#include <pathtracing_triangle_intersect>
/*
float data[64];
float getData(int id)
{
    for (int i=0; i<32; i++)
    {
        if (i == id) return data[i];
    }
}
*/
//-----------------------------------------------------------------------
float SceneIntersect( Ray r, inout Intersection intersec, inout float seed )
//-----------------------------------------------------------------------
{
	vec3 n;
	float d,f;
	float t = INFINITY;
	
        for (int i = 0; i < N_SPHERES; i++)
        {
		d = SphereIntersect( spheres[i].radius, spheres[i].position, r );
		if (d < t)
		{
			t = d;
			intersec.normal = (r.origin + r.direction * t) - spheres[i].position;
			intersec.emission = spheres[i].emission;
			intersec.color = spheres[i].color;
			intersec.type = spheres[i].type;
		}
        }
	
	for (int i = 0; i < N_BOXES; i++)
        {
		d = BoxIntersect( boxes[i].minCorner, boxes[i].maxCorner, r, n );
		if (d < t)
		{
			t = d;
			intersec.normal = normalize(n);
			intersec.emission = boxes[i].emission;
			intersec.color = boxes[i].color;
			intersec.type = boxes[i].type;
		}
        }
		
	// AABB BVH Intersection
	float bc, bd;
	float iX3;
	float InvTextureWidth = 0.00024414062; // (1.0 / 4096 texture width)
	vec3 aabbNodeData, aabbMin, aabbMax;
	vec3 inverseDir = 1.0 / r.direction;
	vec3 v0, v1, v2;
	float closer = 0.0;
	float farther = 0.0;
	float ni = 0.0;
	int stackptr = 1;
	
        // mimics 'while' loop with break condition
	for (int i = 0; i < 1; i += 0) // infinite loop
	{
		stackptr --;
		// check for break condition
		if (stackptr < 0)
		{
			break;
		}
		
		iX3 = ni * 3.0;
		
		// (iX3 + 0.0) corresponds to .r:rightOffset, .g: nPrims,    .b: start
		// (iX3 + 1.0) corresponds to .x:aabbMin.x,   .y: aabbMin.y, .z: aabbMin.z
		// (iX3 + 2.0) corresponds to .x:aabbMax.x,   .y: aabbMax.y, .z: aabbMax.z
		aabbNodeData = texture2D( tAABBTexture, vec2((iX3 + 0.0) * InvTextureWidth, 0) ).rgb;
		
		if (aabbNodeData.r > 0.0) // Another Inner Node, Not a leaf
		{ 
			aabbMin      = texture2D( tAABBTexture, vec2((iX3 + 3.0 + 1.0) * InvTextureWidth, 0) ).rgb;     
			aabbMax      = texture2D( tAABBTexture, vec2((iX3 + 3.0 + 2.0) * InvTextureWidth, 0) ).rgb;
			bool hitc0 = BoundingBoxIntersect(aabbMin, aabbMax, r.origin, inverseDir);
			
			aabbMin      = texture2D( tAABBTexture, vec2((iX3 + (aabbNodeData.r * 3.0) + 1.0) * InvTextureWidth, 0) ).rgb;     
			aabbMax      = texture2D( tAABBTexture, vec2((iX3 + (aabbNodeData.r * 3.0) + 2.0) * InvTextureWidth, 0) ).rgb;
			bool hitc1 = BoundingBoxIntersect(aabbMin, aabbMax, r.origin, inverseDir);
			
			// Did we hit both nodes?
			if (hitc0 && hitc1)
			{
				if (rand(seed) < 0.5)
				{
					closer = ni + 1.0;
					farther = ni + aabbNodeData.r;
				}
				else
				{
					farther = ni + 1.0;
					closer = ni + aabbNodeData.r;
				}
				
				ni = closer;
				stackptr ++;
				continue;
      			}
			else if (hitc0)
			{
				ni = ni + 1.0;
				stackptr ++;
				continue;
			}
			else if (hitc1)
			{
				ni = ni + aabbNodeData.r;
				stackptr ++;
				continue;
			}
    		} // end if (aabbNodeData.r > 0.0) // Another Inner Node, Not a leaf
		else // Is leaf -> Intersect all triangles in this leaf
		{
			for (float p = 0.0; p < float(NUMBER_OF_LEAF_PRIMITIVES); p += 1.0)
			{	
				v0 = texture2D( tTriangleTexture, vec2(((3.0 * aabbNodeData.b) + (p * 3.0) + 0.0) * InvTextureWidth, 0) ).rgb;	      
				v1 = texture2D( tTriangleTexture, vec2(((3.0 * aabbNodeData.b) + (p * 3.0) + 1.0) * InvTextureWidth, 0) ).rgb;	      
				v2 = texture2D( tTriangleTexture, vec2(((3.0 * aabbNodeData.b) + (p * 3.0) + 2.0) * InvTextureWidth, 0) ).rgb;
				d = TriangleIntersect( v0, v1, v2, r );
				if (d < t && d > 0.0)
				{
					t = d;
					intersec.normal = normalize( cross(v1-v0, v2-v0) );
					intersec.emission = vec3(0);
					intersec.color = vec3(1,0,0);
					intersec.type = DIFF;
				}
				
				if (p == aabbNodeData.g)
				{
					break;
				}
				
			} // end for (float p = 0.0; p < 4.0; p += 1.0)
			
		} // end else // Is leaf -> Intersect all triangles in this leaf
				
	} // end for (int i = 0; i < 1; i += 0) // infinite loop
	
	return t;
	
} // end float SceneIntersect( Ray r, inout Intersection intersec )
//-----------------------------------------------------------------------
vec3 CalculateRadiance( Ray r, inout float seed )
//-----------------------------------------------------------------------
{
	vec3 accumCol = vec3(0.0);
        vec3 mask = vec3(1.0);
	vec3 checkCol0 = vec3(1);
	vec3 checkCol1 = vec3(0.5);
        Intersection intersec;
	bool bounceIsSpecular = true;
	int sampleDiffuseBudget = 3;
	
        for (int depth = 0; depth < 4; depth++)
	{
		sampleDiffuseBudget -= 1;
		
		float t = SceneIntersect(r, intersec, seed);
		
		if (t == INFINITY)
		{
                        break;
		}
		
		
		// if we reached something bright, don't spawn any more rays
		if (intersec.type == LIGHT)
		{	
			//if (bounceIsSpecular)
			{
				accumCol = mask * intersec.emission;
			}
			
			break;
		}
		
		
		// useful data 
		vec3 n = intersec.normal;
                vec3 nl = dot(n,r.direction) <= 0.0 ? normalize(n) : normalize(n * -1.0);
		vec3 x = r.origin + r.direction * t;
		
		    
                if (intersec.type == DIFF || intersec.type == CHECK) // Ideal DIFFUSE reflection
                {
			if( intersec.type == CHECK )
			{
				float q = clamp( mod( dot( floor(x.xz * 0.04), vec2(1.0) ), 2.0 ) , 0.0, 1.0 );
				intersec.color = checkCol0 * q + checkCol1 * (1.0 - q);	
			}
			
			mask *= intersec.color;
			bounceIsSpecular = false;
			//accumCol += calcDirectLightingSphere(mask, x, nl, spheres[0], seed);
			
			sampleDiffuseBudget -= 1;
			if (sampleDiffuseBudget < 0) break;
			
			// choose random Diffuse sample vector
			r = Ray( x, randomCosWeightedDirectionInHemisphere(nl, seed) );
			r.origin += r.direction;
			//mask *= max(0.0, dot(r.direction, nl));
			continue;	
                }
		
                if (intersec.type == SPEC)  // Ideal SPECULAR reflection
                {
			r = Ray( x, reflect(r.direction, nl) );
			r.origin += r.direction;
			mask *= intersec.color;
			bounceIsSpecular = true;
                        continue;
                }
                if (intersec.type == REFR)  // Ideal dielectric REFRACTION
		{
			float nc = 1.0; // IOR of Air
			float nt = 1.5; // IOR of common Glass
			float nnt = dot(n,nl) > 0.0 ? (nc / nt) : (nt / nc); // Ray from outside going in?
			vec3 tdir = refract(r.direction, nl, nnt);
				
			// Original Fresnel equations
			float cosThetaInc = dot(nl, r.direction);
			float cosThetaTra = dot(nl, tdir);
			float coefS = (nc * cosThetaInc - nt * cosThetaTra) / (nc * cosThetaInc + nt * cosThetaTra);
			float coefP = (nc * cosThetaTra - nt * cosThetaInc) / (nc * cosThetaTra + nt * cosThetaInc);
			float Re = ( (coefS * coefS) + (coefP * coefP) ) * 0.5; // Unpolarized
			float Tr = 1.0 - Re;
			
			if (rand(seed) < Re) // reflect ray from surface
			{
				r = Ray( x, reflect(r.direction, nl) );
			    	r.origin += r.direction * 2.0;
				bounceIsSpecular = true;
			    	continue;	
			}
			else // transmit ray through surface
			{
				mask *= intersec.color;
				r = Ray(x, tdir);
				r.origin += r.direction * 2.0;
				bounceIsSpecular = true;
				continue;
			}
			
		} // end if (intersec.type == REFR)
		
		if (intersec.type == COAT)  // Diffuse object underneath with ClearCoat on top (like car, or shiny pool ball)
		{
			// Schlick Fresnel approx.
			float ddn = dot(-r.direction, nl);
			float nc = 1.0; // IOR of air
			float nt = 1.4; // IOR of ClearCoat 
			float R0 = (nc - nt) / (nc + nt);
			R0 *= R0;
			float c = 1.0 - ddn;
			float Re = R0 + (1.0 - R0) * c * c * c * c * c;
			
			// choose random sample vector for diffuse material underneath ClearCoat
			vec3 d = randomCosWeightedDirectionInHemisphere( nl, seed );
			
			// choose either specular reflection or diffuse
			if( rand(seed) < Re )
			{	
				r = Ray( x, reflect(r.direction, nl) );
				r.origin += r.direction * 2.0;
				bounceIsSpecular = true;
				continue;	
			}
			else
			{
				mask *= intersec.color;
				//accumCol += calcDirectLightingSphere(mask, x, nl, spheres[0], seed);
				r = Ray( x, randomCosWeightedDirectionInHemisphere(nl, seed) );
				r.origin += r.direction * 2.0;
				//mask *= max(0.0, dot(r.direction, nl));
				bounceIsSpecular = false;
				continue;
			}
			
		} //end if (intersec.type == COAT)
		
		
	} // end for (int depth = 0; depth < 4; depth++)
	
	return accumCol;      
}
//-----------------------------------------------------------------------
void SetupScene(void)
//-----------------------------------------------------------------------
{
	vec3 z  = vec3(0);          
	vec3 L1 = vec3(1.0, 1.0, 1.0) * 3.0;// White light
	//vec3 L2 = vec3(1.0, 0.9, 0.6) * 3.0;// Yellowish light
	//vec3 L3 = vec3(0.2, 0.8, 1.0) * 3.0;// Blueish light
	
	spheres[0] = Sphere( 500.0, vec3(  0.0, 1000.0, 0.0), L1, z, LIGHT);//spherical white Light1
	spheres[1] = Sphere( 4000.0, vec3(0, -4000, 0), z, vec3(0.4,0.4,0.4), CHECK);//Checkered Floor
	spheres[2] = Sphere( 6.0,    vec3(55, 37, -45), z, vec3(0.7),          SPEC);//small mirror ball
	spheres[3] = Sphere( 6.0,    vec3(55, 25, -45), z, vec3(0.5,1.0,1.0),  REFR);//small glass ball
	spheres[4] = Sphere( 6.0,    vec3(60, 25, -30), z, vec3(1.0),          COAT);//small plastic ball
		
	boxes[0] = Box( vec3(-20.0,11.0,-110.0), vec3(70.0,18.0,-20.0), z, vec3(0.2,0.9,0.7), REFR);//Glass Box
	boxes[1] = Box( vec3(-14.0,13.0,-104.0), vec3(64.0,16.0,-26.0), z, vec3(0),           DIFF);//Inner Box
}
#include <pathtracing_main>
