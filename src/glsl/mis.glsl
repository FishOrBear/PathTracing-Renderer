#include <pathtracing_uniforms_and_defines>

#define PIXEL_SAMPLES 		1		//samples per pixel. Increase for better image quality
#define MAX_DEPTH			5		//GI depth
#define CLAMP_VALUE			4.0		//biased rendering

#define SPHERE_LIGHT
#define BOX

//used macros and constants
// #define PI 				3.1415926
// #define TWO_PI 			6.2831852
// #define FOUR_PI 			12.566370
#define INV_PI 				0.3183099
#define INV_TWO_PI 			0.1591549
#define INV_FOUR_PI 		0.0795775
#define EPSILON 			0.0001 
#define EQUAL_FLT(a,b,eps)	(((a)>((b)-(eps))) && ((a)<((b)+(eps))))
#define IS_ZERO(a) 			EQUAL_FLT(a,0.0,EPSILON)
//********************************************

vec3 orthogonalize(in vec3 n, in vec3 v) {
    return v - n * dot(n, v);
}

// random number generator **********
// taken from iq :)
float seed;	//seed initialized in main
float rnd() { return fract(sin(seed++)*43758.5453123); }
//***********************************

//////////////////////////////////////////////////////////////////////////
// Converting PDF from Solid angle to Area
float PdfWtoA( float aPdfW, float aDist2, float aCosThere ){
    return aDist2 == 0.0 ? 0.0 : aPdfW * abs(aCosThere) / aDist2;
}

// Converting PDF between from Area to Solid angle
float PdfAtoW( float aPdfA, float aDist2, float aCosThere ){
    return abs(aCosThere) == 0.0 ? 0.0 : aPdfA * aDist2 / abs(aCosThere);
}

float misWeight( in float a, in float b ) {
    float a2 = a*a;
    float b2 = b*b;
    float a2b2 = a2 + b2;
    return a2 / a2b2;
}
//////////////////////////////////////////////////////////////////////////

vec3 toVec3( vec4 v ) {
    return v.w == 0.0 ? v.xyz : v.xyz*(1.0/v.w);
}

mat3 mat3Inverse( in mat3 m ) {
#if __VERSION__ >= 300
    return inverse(m);	//webGL 2.0
#else
    return mat3(	vec3( m[0][0], m[1][0], m[2][0] ),
					vec3( m[0][1], m[1][1], m[2][1] ),
                    vec3( m[0][2], m[1][2], m[2][2] ) );
#endif
}

//fast inverse for orthogonal matrices
mat4 mat4Inverse( in mat4 m ) {
#if __VERSION__ >= 300
    return inverse(m);	//webGL 2.0
#else
    mat3 rotate_inv = mat3(	vec3( m[0][0], m[1][0], m[2][0] ),
                          	vec3( m[0][1], m[1][1], m[2][1] ),
                          	vec3( m[0][2], m[1][2], m[2][2] ) );
    
    return mat4(	vec4( rotate_inv[0], 0.0 ),
                	vec4( rotate_inv[1], 0.0 ),
                	vec4( rotate_inv[2], 0.0 ),
              		vec4( (-rotate_inv)*m[3].xyz, 1.0 ) );
#endif
}
      
struct SurfaceHitInfo {
    vec3 position_;
	vec3 normal_;
    vec3 tangent_;
    vec2 uv_;
    int mtl_id_;
};
    
#define SURFACE_ID_BASE	0
#define LIGHT_ID_BASE	64

#define MTL_LIGHT 		0
#define MTL_DIFFUSE		1
    

#define OBJ_PLANE		0
#define OBJ_SPHERE		1
#define OBJ_CYLINDER	2
#define OBJ_AABB		3
#define OBJ_DISK		4
#define OBJ_BUNNY		5
    
struct Object {
    int type_;
    int mtl_id_;
    mat4 transform_;
    mat4 transform_inv_;
    
    float params_[6];
};

//Weighted sum of Lambertian and Blinn brdfs
struct Material {
    int type_; // 0 - diffuse, 1 - mirror, 
    vec3 color_;
};
    
struct Light {
    vec3 color_;
    float intensity_;
};
    
struct Ray {
    vec3 origin;
    vec3 direction;
};
    
struct Camera {
    mat3 rotate;
    vec3 pos;
    float fovV;
    float focusDist;
};
    
struct LightSamplingRecord {
    vec3 w;
    float d;
    float pdf;
};
    
// ************ SCENE ***************
 
#ifdef BOX
#define N_OBJECTS 7
#define N_MATERIALS 5
#else
#define N_OBJECTS 6
#define N_MATERIALS 4
#endif

Light lights[2];
Material materials[N_MATERIALS];
Object objects[N_OBJECTS];
Camera camera;
//***********************************
Material getMaterial(int i) {
#if __VERSION__ >= 300
    return materials[i];	//webGL 2.0
#else
    if(i==0) return materials[0]; 
    if(i==1) return materials[1];
    if(i==2) return materials[2];
    if(i==4) return materials[4];
    return materials[3];
#endif 
}

Light getLight(int i) {
    if(i==0) return lights[0]; else
        return lights[1];
    //return lights[i];
}

vec3 getColor(vec2 uv, int tex) {
    if(tex==0)	return vec3(0.8, 0.5, 0.3);
    if(tex==1)	return vec3(0.5, 0.5, 0.6);
				return vec3(0.7, 0.7, 0.7);
}

vec3 getNormal(vec2 uv, int tex ) {
    return vec3(0.0, 0.0, 1.0);
}

vec3 getRadiance(vec2 uv) {
    return /*getColor(uv, 2)*lights[0].color_**/vec3(1.0, 1.0, 1.0)*lights[0].intensity_;
}

void createMaterial( int type, vec3 c, out Material mtl) { mtl.type_ = type; mtl.color_ = c;}

void createLight(vec3 color, float intensity, out Light light) {
    light.color_ = color;
    light.intensity_ = intensity;
}

void createAABB( mat4 transform, vec3 bound_min, vec3 bound_max, int mtl, out Object obj) {
    vec3 xAcis = normalize( vec3( 0.9, 0.0, 0.2 ) );
    vec3 yAcis = vec3( 0.0, 1.0, 0.0 );
    obj.type_ = OBJ_AABB;
    obj.mtl_id_ = mtl;
    obj.transform_ = transform;
    obj.transform_inv_ = mat4Inverse( obj.transform_ );
    obj.params_[0] = bound_min.x;
    obj.params_[1] = bound_min.y;
    obj.params_[2] = bound_min.z;
    obj.params_[3] = bound_max.x;
    obj.params_[4] = bound_max.y;
    obj.params_[5] = bound_max.z;
}

void createPlane(mat4 transform, float minX, float minY, float maxX, float maxY, int mtl, out Object obj) {
    obj.type_ = OBJ_PLANE;
    obj.mtl_id_ = mtl;
    obj.transform_ = transform;
    obj.transform_inv_ = mat4Inverse( obj.transform_ );
    obj.params_[0] = minX;			//min x
    obj.params_[1] = minY;			//min y
    obj.params_[2] = maxX;			//max x
    obj.params_[3] = maxY;			//max y
    obj.params_[4] = 0.0;		//not used
    obj.params_[5] = 0.0;		//not used
}

void createDisk(mat4 transform, float r, float R, int mtl, out Object obj) {
    obj.type_ = OBJ_DISK;
    obj.mtl_id_ = mtl;
    obj.transform_ = transform;
    obj.transform_inv_ = mat4Inverse( obj.transform_ );
    obj.params_[0] = r*r;
    obj.params_[1] = R*R;
}

void createSphere(mat4 transform, float r, int mtl, out Object obj) {
    obj.type_ = OBJ_SPHERE;
    obj.mtl_id_ = mtl;
    obj.transform_ = transform;
    obj.transform_inv_ = mat4Inverse( obj.transform_ );
    obj.params_[0] = r;			//radius
    obj.params_[1] = r*r;		//radius^2
    obj.params_[2] = 0.0;		//not used
    obj.params_[3] = 0.0;		//not used
    obj.params_[4] = 0.0;		//not used 
    obj.params_[5] = 0.0;		//not used
}

void createCylinder(mat4 transform, float r, float minZ, float maxZ, float maxTheta, int mtl, out Object obj) {
    obj.type_ = OBJ_CYLINDER;
    obj.mtl_id_ = mtl;
    obj.transform_ = transform;
    obj.transform_inv_ = mat4Inverse( obj.transform_ );
    obj.params_[0] = r;			//radius
    obj.params_[1] = minZ;		//min z
    obj.params_[2] = maxZ;		//max z
    obj.params_[3] = maxTheta;	//max phi
    obj.params_[4] = 0.0;		//not used
    obj.params_[5] = 0.0;		//not used
}

void createBunny(mat4 transform, int mtl, out Object obj) {
    obj.type_ = OBJ_BUNNY;
    obj.mtl_id_ = mtl;
    obj.transform_ = transform;
    obj.transform_inv_ = mat4Inverse( obj.transform_ );
    obj.params_[0] = 0.0;		//not used
    obj.params_[1] = 0.0;		//not used
    obj.params_[2] = 0.0;		//not used
    obj.params_[3] = 0.0;	    //not used
    obj.params_[4] = 0.0;		//not used
    obj.params_[5] = 0.0;		//not used
}

mat4 createCS(vec3 p, vec3 z, vec3 x) {
    z = normalize(z);
    vec3 y = normalize(cross(z,x));
    x = cross(y,z);
    
    return mat4(	vec4( x, 0.0 ), 
    			 	vec4( y, 0.0 ),
    				vec4( z, 0.0 ),
    				vec4( p, 1.0 ));
}

// Geometry functions ***********************************************************
vec2 uniformPointWithinCircle( in float radius, in float Xi1, in float Xi2 ) {
    float r = radius*sqrt(1.0 - Xi1);
    float theta = Xi2*TWO_PI;
	return vec2( r*cos(theta), r*sin(theta) );
}

vec3 uniformDirectionWithinCone( in vec3 d, in float phi, in float sina, in float cosa ) {    
	vec3 w = normalize(d);
    vec3 u = normalize(cross(w.yzx, w));
    vec3 v = cross(w, u);
	return (u*cos(phi) + v*sin(phi)) * sina + w * cosa;
}

//taken from: https://www.shadertoy.com/view/4sSSW3
void basis(in vec3 n, out vec3 f, out vec3 r) {
    if(n.z < -0.999999) {
        f = vec3(0 , -1, 0);
        r = vec3(-1, 0, 0);
    } else {
    	float a = 1./(1. + n.z);
    	float b = -n.x*n.y*a;
    	f = vec3(1. - n.x*n.x*a, b, -n.x);
    	r = vec3(b, 1. - n.y*n.y*a , -n.y);
    }
}

mat3 mat3FromNormal(in vec3 n) {
    vec3 x;
    vec3 y;
    basis(n, x, y);
    return mat3(x,y,n);
}

void cartesianToSpherical(in vec3 xyz, out float rho, out float phi, out float theta ) {
    rho = sqrt((xyz.x * xyz.x) + (xyz.y * xyz.y) + (xyz.z * xyz.z));
    phi = asin(xyz.y / rho);
	theta = atan( xyz.z, xyz.x );
}

vec3 sphericalToCartesian( in float rho, in float phi, in float theta ) {
    float sinTheta = sin(theta);
    return vec3( sinTheta*cos(phi), sinTheta*sin(phi), cos(theta) )*rho;
}

vec3 sampleHemisphereCosWeighted( in float Xi1, in float Xi2 ) {
    float theta = acos(sqrt(1.0-Xi1));
    float phi = TWO_PI * Xi2;

    return sphericalToCartesian( 1.0, phi, theta );
}

vec3 randomDirection( in float Xi1, in float Xi2 ) {
    float theta = acos(1.0 - 2.0*Xi1);
    float phi = TWO_PI * Xi2;
    
    return sphericalToCartesian( 1.0, phi, theta );
}
//*****************************************************************************

// ************************   Scattering functions  *************************
bool sameHemisphere(in vec3 n, in vec3 a, in vec3 b){
	return ((dot(n,a)*dot(n,b))>0.0);
}

bool sameHemisphere(in vec3 a, in vec3 b){
	return (a.z*b.z>0.0);
}

vec3 mtlEval(Material mtl, in vec3 Ng, in vec3 Ns, in vec3 Ee, in vec3 L) {
    if(mtl.type_ == 1) return vec3(0.0);

    return 	vec3(INV_PI) * mtl.color_;
}



vec3 mtlSample(Material mtl, in vec3 Ng, in vec3 Ns, in vec3 Ee, in float Xi1, in float Xi2, out vec3 L, out float pdf) {
    if(mtl.type_ == 0) {
        mat3 trans = mat3FromNormal(Ns);
        //mat3 inv_trans = mat3Inverse( trans );

        //convert directions to local space
        //vec3 E_local = inv_trans * Ee;
        vec3 L_local;
        
    	//if (E_local.z == 0.0) return vec3(0.);
        
        L_local = sampleHemisphereCosWeighted( Xi1, Xi2 );
        pdf = INV_PI * L_local.z;
        
        //convert directions to global space
    	L = trans*L_local;
    } else {
        L = reflect(-Ee, Ns);
        pdf = 1.0;
        return vec3(1.0);
    }
    
    if(!sameHemisphere(Ns, Ee, L) || !sameHemisphere(Ng, Ee, L)) {
        pdf = 0.0;
    }
    
    return mtlEval(mtl, Ng, Ns, Ee, L);
}

float mtlPdf(Material mtl, in vec3 Ng, in vec3 Ns, in vec3 Ee, in vec3 L) {
    
    if(mtl.type_ == 0) {
        mat3 trans = mat3FromNormal(Ns);
        mat3 inv_trans = mat3Inverse( trans );

        vec3 E_local = inv_trans * Ee;
        vec3 L_local = inv_trans * L;

        if(!sameHemisphere(Ng, E_local, L_local)) {
            return 0.0;
        }
        
        return abs(L_local.z)*INV_PI;
    } else {
        return 0.0;
    }
}



// ************************  INTERSECTION FUNCTIONS **************************

bool solveQuadratic(float A, float B, float C, out float t0, out float t1) {
	float discrim = B*B-4.0*A*C;
    
	if ( discrim <= 0.0 )
        return false;
    
	float rootDiscrim = sqrt( discrim );
    
    float t_0 = (-B-rootDiscrim)/(2.0*A);
    float t_1 = (-B+rootDiscrim)/(2.0*A);
    
    t0 = min( t_0, t_1 );
    t1 = max( t_0, t_1 );
    
	return true;
}

bool rayAABBIntersection( in Ray ray, float minX, float minY, float minZ, float maxX, float maxY, float maxZ, out float t, out SurfaceHitInfo isect ) {
    vec3 boxMin = vec3( minX, minY, minZ );
    vec3 boxMax = vec3( maxX, maxY, maxZ );
    
    vec3 OMIN = ( boxMin - ray.origin ) / ray.direction;
    vec3 OMAX = ( boxMax - ray.origin ) / ray.direction;
    vec3 MAX = max ( OMAX, OMIN );
    vec3 MIN = min ( OMAX, OMIN );
    float t1 = min ( MAX.x, min ( MAX.y, MAX.z ) );
    t = max ( max ( MIN.x, 0.0 ), max ( MIN.y, MIN.z ) );
    
    if ( t1 <= t )
        return false;
    
    isect.position_ = ray.origin + ray.direction*t;
    if( isect.position_.x < minX - EPSILON ) {
        isect.normal_ =  vec3( -1.0, 0.0, 0.0 );
    } else if( isect.position_.x > maxX - EPSILON ) {
        isect.normal_ =  vec3( 1.0, 0.0, 0.0 );
    } else if( isect.position_.y < minY - EPSILON ) {
        isect.normal_ =  vec3( 0.0, -1.0, 0.0 );
    } else if( isect.position_.y > maxY - EPSILON ) {
        isect.normal_ =  vec3( 0.0, 1.0, 0.0 );
    } else if( isect.position_.z < minZ - EPSILON ) {
        isect.normal_ =  vec3( 0.0, 0.0, -1.0 );
    } else /*if( isect.position_.z > maxZ - EPSILON ) )*/ {
        isect.normal_ =  vec3( 0.0, 0.0, 1.0 );
    }
    
    return true;
}

bool iSphere(in Ray ray, in vec3 sph_o, in float sph_r2, out float t0, out float t1) {
    vec3 L = ray.origin - sph_o;
    float a = dot( ray.direction, ray.direction );
    float b = 2.0 * dot( ray.direction, L );
    float c = dot( L, L ) - sph_r2;
    return solveQuadratic(a, b, c, t0, t1);
}

bool raySphereIntersection( in Ray ray, in float radiusSquared, out float t, out SurfaceHitInfo isect ) {
    float t0, t1;
    if (!iSphere(ray, vec3(.0), radiusSquared, t0, t1))
		return false;
    
    t = mix(mix(-1.0, t1, float(t1 > 0.0)), t0, float(t0 > 0.0));
    
    isect.position_ = ray.origin + ray.direction*t;
    isect.normal_ = normalize( isect.position_ );
	
	return (t != -1.0);
}

bool rayAAPlaneIntersection( in Ray ray, in float min_x, in float min_y, in float max_x, in float max_y, out float t, out SurfaceHitInfo isect ) {
    if ( ray.direction.z == 0.0 )
    	return false;
    
    t = ( -ray.origin.z ) / ray.direction.z;
    
    isect.position_ = ray.origin + ray.direction*t;
    isect.normal_ 	= vec3( 0.0, 0.0, 1.0 );
    return	(isect.position_.x > min_x) &&
       		(isect.position_.x < max_x) &&
      		(isect.position_.y > min_y) &&
      		(isect.position_.y < max_y);
}

bool iCylinder(in Ray r, float radius, out float t0, out float t1) {
	float a = r.direction.x*r.direction.x + r.direction.y*r.direction.y;
	float b = 2.0 * (r.direction.x*r.origin.x + r.direction.y*r.origin.y);
	float c = r.origin.x*r.origin.x + r.origin.y*r.origin.y - radius*radius;
	return solveQuadratic(a, b, c, t0, t1);
}

bool rayCylinderIntersection( in Ray r, in float radius, in float minZ, in float maxZ, in float maxPhi, out float t, out SurfaceHitInfo isect ) {
	float phi;
	vec3 phit;
	float t0, t1;
    
	if (!iCylinder(r, radius, t0, t1))
		return false;

    if ( t1 < 0.0 )
        return false;
    
	t = t0;
    
	if (t0 < 0.0)
		t = t1;

	// Compute cylinder hit point and $\phi$
	phit = r.origin + r.direction*t;
	phi = atan(phit.y,phit.x);
    phi += PI;
    
	if (phi < 0.0)
        phi += TWO_PI;
 
	// Test cylinder intersection against clipping parameters
	if ( (phit.z < minZ) || (phit.z > maxZ) || (phi > maxPhi) ) {
		if (t == t1)
            return false;
		t = t1;
		// Compute cylinder hit point and $\phi$
		phit = r.origin + r.direction*t;
		phi = atan(phit.y,phit.x);
        phi += PI;

		if ( (phit.z < minZ) || (phit.z > maxZ) || (phi > maxPhi) )
			return false;
	}
    
    isect.position_ = phit;
    isect.normal_ = normalize( vec3( phit.xy, 0.0 ) );
    
	return true;
}

// Distance from p to sphere of radius s (centered at origin)
float sdSphere( vec3 p, float s )
{
    return length(p)-s;
}

float map( in vec3 pos )
{
    float a = 15.0;
    return 0.2 * sdSphere( pos, 1.3 )
                           + 0.03*sin(a*pos.x)*sin(a*pos.y)*sin(a*pos.z);
}

vec3 calcNormal( in vec3 pos )
{
    // epsilon = a small number
    vec2 e = vec2(1.0,-1.0)*0.5773*0.0002;
    
    return normalize( e.xyy*map( pos + e.xyy ) + 
					  e.yyx*map( pos + e.yyx ) + 
					  e.yxy*map( pos + e.yxy ) + 
					  e.xxx*map( pos + e.xxx ) );
}

// Cast a ray from origin ro in direction rd until it hits an object.
// Return (t,m) where t is distance traveled along the ray, and m
// is the material of the object hit.
bool castRay( in Ray ray, out float t, out vec3 n ){
    float tmin = 0.0;
    float tmax = 100.0;
    
    if(!iSphere(ray, vec3(0.), 2.25, tmin, tmax))return false;
    tmin = max(tmin, 0.0);
    
    t = tmin;
    for( int i=0; i<256; i++ )
    {
	    float precis = 0.0002*t;
        vec3 p = ray.origin + ray.direction*t;
        float d = map( p );
	    
        if( d<precis || t>tmax ) break;
        t += d;
    }
    
    n = calcNormal( ray.origin + ray.direction*t );
    bool res = t > tmin && t < tmax;
    
    return res;
}

bool rayBunnyIntersection( in Ray ray, in bool forShadowTest, out float t, out SurfaceHitInfo isect ) {
    bool res = castRay( ray, t, isect.normal_ );
    isect.position_ = ray.origin + ray.direction*t;
    return res;
}

bool rayObjectIntersect( in Ray ray, in Object obj, in float distMin, in float distMax, in bool forShadowTest, out SurfaceHitInfo hit, out float dist ) {
    bool hitResult = false;
    float t;
    SurfaceHitInfo currentHit;

    //Convert ray to object space
    Ray rayLocal;
    rayLocal.origin = toVec3( obj.transform_inv_*vec4( ray.origin, 1.0 ) );
    rayLocal.direction 	= toVec3( obj.transform_inv_*vec4( ray.direction   , 0.0 ) );

    if( obj.type_ == OBJ_PLANE ) {
        hitResult = rayAAPlaneIntersection( rayLocal, obj.params_[0], obj.params_[1], obj.params_[2], obj.params_[3], t, currentHit );
    } else if( obj.type_ == OBJ_SPHERE ) {
        hitResult = raySphereIntersection( 	rayLocal, obj.params_[1], t, currentHit );
    } else if( obj.type_ == OBJ_CYLINDER ) {
        hitResult = rayCylinderIntersection(rayLocal, obj.params_[0], obj.params_[1], obj.params_[2], obj.params_[3], t, currentHit );
    } else if( obj.type_ == OBJ_AABB ) {
        hitResult = rayAABBIntersection( rayLocal, obj.params_[0], obj.params_[1], obj.params_[2], obj.params_[3], obj.params_[4], obj.params_[5], t, currentHit );
    } else if( obj.type_ == OBJ_BUNNY ) {
        hitResult = rayBunnyIntersection( rayLocal, forShadowTest, t, currentHit );
    }

    if( hitResult && ( t > distMin ) && ( t < distMax ) ) {
        //Convert results to world space
        currentHit.position_ = toVec3( obj.transform_*vec4( currentHit.position_, 1.0 ) );
        currentHit.normal_   = toVec3( obj.transform_*vec4( currentHit.normal_  , 0.0 ) );
        currentHit.tangent_  = toVec3( obj.transform_*vec4( currentHit.tangent_ , 0.0 ) );

        dist = t;
        hit = currentHit;
        hit.mtl_id_ = obj.mtl_id_;
        
        return true;
    } else {
    	return false;
    }
}

#define CHECK_OBJ( obj ) { SurfaceHitInfo currentHit; float currDist; if( rayObjectIntersect( ray, obj, distMin, nearestDist, forShadowTest, currentHit, currDist ) && ( currDist < nearestDist ) ) { nearestDist = currDist; hit = currentHit; } }
bool raySceneIntersection( in Ray ray, in float distMin, in bool forShadowTest, out SurfaceHitInfo hit, out float nearestDist ) {
    nearestDist = 10000.0;
    
    for(int i=0; i<N_OBJECTS; i++ ) {
        CHECK_OBJ( objects[i] );
    }
    return ( nearestDist < 1000.0 );
}
// ***************************************************************************


void initScene() {
    
    //create lights
    createLight(vec3(1.0, 1.0, 0.9), 140.0, lights[0]);
    
    //Create materials
    createMaterial(0, vec3(1.0, 1.0, 1.0), materials[0]);
    createMaterial(0, vec3(0.85, 0.85, 0.85), materials[1]);
    createMaterial(1, vec3(1.0, 0.5, 1.0), materials[2]);
    createMaterial(0, vec3(0.5, 0.5, 1.0), materials[3]);
#ifdef BOX
    createMaterial(0, vec3(0.96, 0.02, 0.05), materials[4]);
#endif
    
    //init lights
    float r = 0.3;
    float xFactor = (uMouse.x==0.0)?0.0:2.0*(uMouse.x/uResolution.x) - 1.0;
    float yFactor = (uMouse.y==0.0)?0.0:2.0*(uMouse.y/uResolution.y) - 1.0;
    float x = xFactor*7.0;
    float z = -3.0-yFactor*5.0;
    float a = -2.2;
    mat4 trans = createCS(	vec3(x, 3.0, z),
                          	vec3(0.0, sin(a), cos(a)),
                  			vec3(1.0, 0.0, 0.0));
#ifdef SPHERE_LIGHT
    createSphere(trans, r, LIGHT_ID_BASE+0, objects[0] );
#else
    float aa = 2.0 * r;
    float bb = 3.0 * r;
    createPlane(trans, -bb, -aa, bb, aa, LIGHT_ID_BASE+0, objects[0]);
#endif
    
    
    //plane 1
    trans = mat4(	vec4( 1.0, 0.0, 0.0, 0.0 ),
                    vec4( 0.0, 1.0, 0.0, 0.0 ),
                    vec4( 0.0, 0.0, 1.0, 0.0 ),
                    vec4( 0.0, 5.0, -10.0, 1.0 ));
    createPlane(trans, -10.0, -2.0, 10.0, 4.0, SURFACE_ID_BASE+1, objects[1]);
   
    //plane 2
    trans = mat4(	vec4( 1.0, 0.0, 0.0, 0.0 ),
                    vec4( 0.0, 0.0, -1.0, 0.0 ),
                    vec4( 0.0, -1.0, 0.0, 0.0 ),
                    vec4( 0.0, -1.0, -4.0, 1.0 ));
    createPlane(trans, -10.0, -4.0, 10.0, 2.0, SURFACE_ID_BASE+1, objects[2]);
 
    //Cylinder
    trans = mat4(	vec4( 0.0, 1.0, 0.0, 0.0 ),
                    vec4( 0.0, 0.0, 1.0, 0.0 ),
                    vec4( 1.0, 0.0, 0.0, 0.0 ),
                    vec4( -0.0, 3.0, -6.0, 1.0 ));
    createCylinder(trans, 4.0, -10.0, 10.0, PI/2.0, SURFACE_ID_BASE+1, objects[3] );
    
    trans = mat4( 	vec4( 1.0, 0.0, 0.0, 0.0 ),
                    vec4( 0.0, 1.0, 0.0, 0.0 ),
                    vec4( 0.0, 0.0, 1.0, 0.0 ),
                    vec4( -2.0, 0.3, -4.5, 1.0 ));
    createBunny(trans, SURFACE_ID_BASE+2, objects[4]);
    
    vec3 xvec = normalize(vec3(0.8, 0.2, -0.1));
    trans = createCS(	vec3(2.0, 0.3, -4.5),
                        xvec,
                  		vec3(0.0, 1.0, 0.0));
    createBunny(trans, SURFACE_ID_BASE+3, objects[5]);
    
#ifdef BOX
    //box
    xvec = normalize(vec3(0.8, 0.0, -0.25));
    trans = createCS(	vec3(0.0, -0.5, -2.5),
                        xvec,
                  		vec3(0.0, 1.0, 0.0));
    createAABB( trans, -vec3(0.5), vec3(0.5), SURFACE_ID_BASE+4, objects[6]);
#endif
}

///////////////////////////////////////////////////////////////////////
void initCamera( 	in vec3 pos,
                	in vec3 target,
                	in vec3 upDir,
                	in float fovV,
                	in float focus_dist
               ) {
    camera.pos = vec3( 0.3, 3.0, 4.8 );
    
    target = vec3( 0.0, 0.4, -5.0 );
    
	vec3 back = normalize( camera.pos-target );
	vec3 right = normalize( cross( upDir, back ) );
	vec3 up = cross( back, right );
    camera.rotate[0] = right;
    camera.rotate[1] = up;
    camera.rotate[2] = back;
    camera.fovV = fovV;
    camera.focusDist = focus_dist;
}

Ray genRay( in vec2 pixel, in float Xi1, in float Xi2 ) {
    Ray ray;

    vec2 iPlaneSize=2.*tan(0.5*camera.fovV)*vec2(uResolution.x/uResolution.y,1.);
	vec2 ixy=(pixel/uResolution.xy - 0.5)*iPlaneSize;
    
    ray.origin = camera.pos;
    ray.direction = camera.rotate*normalize(vec3(ixy.x,ixy.y,-1.0));

	return ray;
}

#ifdef SPHERE_LIGHT
vec3 sampleLightSource( 	in vec3 x,
                          	float Xi1, float Xi2,
                          	out LightSamplingRecord sampleRec ) {
    float sph_r2 = objects[0].params_[1];
    vec3 sph_p = toVec3( objects[0].transform_*vec4(vec3(0.0,0.0,0.0), 1.0) );
    
    vec3 w = sph_p - x;			//direction to light center
	float dc_2 = dot(w, w);		//squared distance to light center
    float dc = sqrt(dc_2);		//distance to light center
    
    
    float sin_theta_max_2 = sph_r2 / dc_2;
	float cos_theta_max = sqrt( 1.0 - clamp( sin_theta_max_2, 0.0, 1.0 ) );
    float cos_theta = mix( cos_theta_max, 1.0, Xi1 );
    float sin_theta_2 = 1.0 - cos_theta*cos_theta;
    float sin_theta = sqrt(sin_theta_2);
    sampleRec.w = uniformDirectionWithinCone( w, TWO_PI*Xi2, sin_theta, cos_theta );
    sampleRec.pdf = 1.0/( TWO_PI * (1.0 - cos_theta_max) );
        
    //Calculate intersection distance
	//http://ompf2.com/viewtopic.php?f=3&t=1914
    sampleRec.d = dc*cos_theta - sqrt(sph_r2 - dc_2*sin_theta_2);
    
    return lights[0].color_*lights[0].intensity_;
}

float sampleLightSourcePdf( in vec3 x,
                            in vec3 wi,
                           	in float d,
                            in float cosAtLight ) {
    float sph_r2 = objects[0].params_[1];
    vec3 sph_p = toVec3( objects[0].transform_*vec4(vec3(0.0,0.0,0.0), 1.0) );
    float solidangle;
    vec3 w = sph_p - x;			//direction to light center
	float dc_2 = dot(w, w);		//squared distance to light center
    float dc = sqrt(dc_2);		//distance to light center
    
    if( dc_2 > sph_r2 ) {
    	float sin_theta_max_2 = clamp( sph_r2 / dc_2, 0.0, 1.0);
		float cos_theta_max = sqrt( 1.0 - sin_theta_max_2 );
    	solidangle = TWO_PI * (1.0 - cos_theta_max);
    } else { 
    	solidangle = FOUR_PI;
    }
    
    return 1.0/solidangle;
}
#else
vec3 sampleLightSource(		in vec3 x,
                          	float Xi1, float Xi2,
                       out LightSamplingRecord sampleRec) {
    float min_x = objects[0].params_[0];			//min x
    float min_y = objects[0].params_[1];			//min y
    float max_x = objects[0].params_[2];			//max x
    float max_y = objects[0].params_[3];			//max y
    float dim_x = max_x - min_x;
    float dim_y = max_y - min_y;
    vec3 p_local = vec3(min_x + dim_x*Xi1, min_y + dim_y*Xi2, 0.0);
    vec3 n_local = vec3(0.0, 0.0, 1.0);
    vec3 p_global = toVec3( objects[0].transform_*vec4(p_local, 1.0) );
    vec3 n_global = toVec3( objects[0].transform_*vec4(n_local, 0.0) );
    
    float pdfA = 1.0 / (dim_x*dim_y);
    sampleRec.w = p_global - x;
    sampleRec.d = length(sampleRec.w);
    sampleRec.w = normalize(sampleRec.w);
    float cosAtLight = dot(n_global, -sampleRec.w);
    vec3 L = cosAtLight>0.0?getRadiance(vec2(Xi1,Xi2)):vec3(0.0);
    sampleRec.pdf = PdfAtoW(pdfA, sampleRec.d*sampleRec.d, cosAtLight);
    
	return L*0.3;
}

float sampleLightSourcePdf( in vec3 x,
                               in vec3 wi,
                             	float d,
                              	float cosAtLight
                             ) {
    float min_x = objects[0].params_[0];			//min x
    float min_y = objects[0].params_[1];			//min y
    float max_x = objects[0].params_[2];			//max x
    float max_y = objects[0].params_[3];			//max y
    float dim_x = max_x - min_x;
    float dim_y = max_y - min_y;
    float pdfA = 1.0 / (dim_x*dim_y);
    return PdfAtoW(pdfA, d*d, cosAtLight);
}
#endif

bool isLightVisible( Ray shadowRay ) {
    float distToHit;
    SurfaceHitInfo tmpHit;
    
    raySceneIntersection( shadowRay, EPSILON, true, tmpHit, distToHit );
    
    return ( tmpHit.mtl_id_ >= LIGHT_ID_BASE );
}

vec3 sampleBSDF(	in vec3 x,
                  	in vec3 ng,
                  	in vec3 ns,
                	in vec3 wi,
                  	in Material mtl,
                  	in bool useMIS,
                	out vec3 wo,
                	out float brdfPdfW,
                	out vec3 fr,
                	out bool hitRes,
                	out SurfaceHitInfo hit) {
    vec3 Lo = vec3(0.0);
    
    fr = mtlSample(mtl, ng, ns, wi, rnd(), rnd(), wo, brdfPdfW);

    float dotNWo = dot(wo, ns);
    //Continue if sampled direction is under surface
    if ((dot(fr,fr)>0.0) && (brdfPdfW > EPSILON)) {
        Ray shadowRay = Ray(x, wo);

        //abstractLight* pLight = 0;
        float cosAtLight = 1.0;
        float distanceToLight = -1.0;
        vec3 Li = vec3(0.0);

        {
            float distToHit;

            if(raySceneIntersection( shadowRay, EPSILON, false, hit, distToHit )) {
                if(hit.mtl_id_>=LIGHT_ID_BASE) {
                    distanceToLight = distToHit;
                    cosAtLight = dot(hit.normal_, -wo);
                    if(cosAtLight > 0.0) {
                        Li = getRadiance(hit.uv_);
                        //Li = lights[0].color_*lights[0].intensity_;
                    }
                } else {
                    hitRes = true;
                }
            } else {
                hitRes = false;
                //TODO check for infinite lights
            }
        }

        if (distanceToLight>0.0) {
            if (cosAtLight > 0.0) {
                vec3 contribution = (Li * fr * dotNWo) / brdfPdfW;

                if (useMIS && !(mtl.type_==1)) {
                    float lightPickPdf = 1.0;//lightPickingPdf(x, n);
                    float lightPdfW = sampleLightSourcePdf( x, wi, distanceToLight, cosAtLight );
 
                    contribution *= misWeight(brdfPdfW, lightPdfW);
                }

                Lo += contribution;
            }
        }
    }

    return Lo;
}

vec3 salmpleLight(	in vec3 x,
                  	in vec3 ng,
                  	in vec3 ns,
                  	in vec3 wi,
                  	in Material mtl,
                  	in bool useMIS ) {
    vec3 Lo = vec3(0.0);	//outgoing radiance

    float lightPickingPdf = 1.0;
    Light light = lights[0];

    vec3 wo;
    float lightPdfW, lightDist;

    LightSamplingRecord rec;
    vec3 Li = sampleLightSource( x, rnd(), rnd(), rec );
    wo = rec.w;
    lightPdfW = rec.pdf;
    lightDist = rec.d;
    lightPdfW *= lightPickingPdf;

    float dotNWo = dot(wo, ns);

    if ((dotNWo > 0.0) && (lightPdfW > EPSILON)) {
        vec3 fr = mtlEval(mtl, ng, ns, wi, wo);
        if(dot(fr,fr)>0.0) {
            Ray shadowRay = Ray(x, wo);
            if (isLightVisible( shadowRay )) {
                vec3 contribution = (Li * fr * dotNWo) / lightPdfW;

                if (useMIS && !(mtl.type_==1)) {
                    float brdfPdfW = mtlPdf(mtl, ng, ns, wi, wo);
                    contribution *= misWeight(lightPdfW, brdfPdfW);
                }

                Lo += contribution;
            }
        }
    }

    return Lo;
}

vec3 Radiance( in Ray r, int strataCount, int strataIndex ) {
    vec3 e = vec3(0.0), fr, directLight, pathWeight = vec3(1.0, 1.0, 1.0);
    vec3 wo;
    float woPdf;
    float dotWoN;
    bool hitResult;

    //Calculate first intersections to determine first scattering event
    Ray ray = r;
    SurfaceHitInfo event;
    SurfaceHitInfo nextEvent;
    float dist;
    if(!raySceneIntersection( ray, 0.0, false, event, dist )) {
        return vec3(0.0);
    } else {
        //We have to add emmision component on first hit
        if( event.mtl_id_ >= LIGHT_ID_BASE ) {
            Light light = getLight(event.mtl_id_ - LIGHT_ID_BASE);
            float cosAtLight = dot(event.normal_, -ray.direction);
            if(cosAtLight > 0.0) {
                e = getRadiance(event.uv_);
            }
        }
    }
    
    vec3 direct = vec3(0.0), indirect = vec3(0.0);

    for (int i = 0; i < MAX_DEPTH; i++) {
        if(event.mtl_id_>=LIGHT_ID_BASE){
        	break;
    	}
        
        vec3 x = event.position_;
        vec3 wi = -ray.direction;
        if(dot(wi, event.normal_) < 0.0) {
            event.normal_ *= -1.0;
        }
        
        Material mtl = getMaterial(event.mtl_id_);
    	vec3 ng = event.normal_, ns;
        vec3 tangent = vec3(event.normal_.xzy);
        tangent = orthogonalize(event.normal_, tangent);
    
        mat3 frame;
        frame[0] = tangent;
        frame[1] = cross( ng, tangent );
        frame[2] = ng;
        ns = event.normal_;//frame*ns;
        
        if (dot(wi,ns) < 0.0) { break; }
 
        //Calculate direct light with 'Light sampling' and 'BSDF sampling' techniques
        //In addition BSDF sampling does next event estimation and returns all necessary values which corresponds to next event
       	directLight  = salmpleLight (x, ng, ns, wi, mtl, true);
        directLight += sampleBSDF   (x, ng, ns, wi, mtl, true, wo, woPdf, fr, hitResult, nextEvent);
       
        if(pathWeight.x > 1.0 || pathWeight.y > 1.0 || pathWeight.z > 1.0)
            break;
        
        if(i == 0) {
            direct += directLight*pathWeight;
        } else {
        	indirect += directLight*pathWeight;
        }

        if (!hitResult || (dotWoN = dot(event.normal_, wo))<0.0) { break; }
        if (woPdf == 0.0) { break; }
        pathWeight *= fr*dotWoN / woPdf;

        //Update values for next iteration
        ray = Ray(event.position_, wo);
        event = nextEvent;
    }
    
    //Clamp only indirect
    indirect = vec3(min(indirect, vec3(CLAMP_VALUE)));

    return e + direct + indirect;
}

// void mainImage( out vec4 fragColor, in vec2 gl_FragColor )
void main( void )
{
    //随机数种子. 使用时间+视口分辨率,视口坐标
    // seed = uTime + uResolution.y * gl_FragCoord.x   + gl_FragCoord.y;// / uResolution.x     /uResolution.y
	seed = mod(uSampleCounter,1000.0) * uRandomVector.x - uRandomVector.y + uResolution.y * gl_FragCoord.x / uResolution.x + uResolution.x * gl_FragCoord.y / uResolution.y;
    
    float fov = radians(40.0);
    initCamera( vec3( 0.0, 0.0, 0.0 ),
               vec3( 0.0, 0.0, 0.0 ),
               vec3( 0.0, 1.0, 0.0 ),
               fov,
               9.2
              );

    initScene();

    //积累的颜色
    vec3 accumulatedColor = vec3( 0.0 );
    //累积覆盖率 0-1
    float oneOverSPP = 1.0/float(PIXEL_SAMPLES);
    float strataSize = oneOverSPP;

    //取样
    for( int si=0; si<PIXEL_SAMPLES; ++si ){
        vec2 sc = gl_FragCoord.xy + vec2(strataSize*(float(si) + rnd()), rnd());
        accumulatedColor += Radiance(genRay(sc, rnd(), rnd()), PIXEL_SAMPLES, si);
    }

    //devide to sample count  等分采样计数
    accumulatedColor = accumulatedColor*oneOverSPP;
    
    vec3 col_acc;
    vec2 coord = floor(gl_FragCoord.xy * uResolution.xy); //取整
    if(all(equal(coord.xy,vec2(0))))  //如果坐标为0
    {

        if( uMouse.z > 0.0 ) {
            col_acc = vec3(uSampleCounter);
        }
        else {
            col_acc = texture2D( tPreviousTexture, vec2(0.5, 0.5)/uResolution.xy ).xyz;
        }
    }
    else 
    {
        if(uSampleCounter == 1.0) 
        {
            col_acc = accumulatedColor;
        }
        else
        {
            vec3 col_new = accumulatedColor;
            //读取原先的颜色值.
            col_acc = texture2D( tPreviousTexture, vUv ).xyz;
            //mix 线性插值. 取x,y的线性混合,x*(1-a)+y*a
            // col_acc = mix(col_acc, col_new, float(1.0)/float(1.0+uSampleCounter));
            col_acc = col_acc + col_new;
        }
    }
    gl_FragColor = vec4( col_acc, 1.0 );
}
