void main( void )
{
	// not needed, three.js has a built-in uniform named cameraPosition
	//vec3 camPos     = vec3( uCameraMatrix[3][0],  uCameraMatrix[3][1],  uCameraMatrix[3][2]);
	
    vec3 camRight   = vec3( uCameraMatrix[0][0],  uCameraMatrix[0][1],  uCameraMatrix[0][2]);
    vec3 camUp      = vec3( uCameraMatrix[1][0],  uCameraMatrix[1][1],  uCameraMatrix[1][2]);
	vec3 camForward = vec3(-uCameraMatrix[2][0], -uCameraMatrix[2][1], -uCameraMatrix[2][2]);
	
	// seed for rand(seed) function
	float seed = mod(uSampleCounter,1000.0) * uRandomVector.x - uRandomVector.y + uResolution.y * gl_FragCoord.x / uResolution.x + uResolution.x * gl_FragCoord.y / uResolution.y;
	
	float r1 = 2.0 * rand(seed);
	float r2 = 2.0 * rand(seed);
	
	vec2 pixelPos = vec2(0);
	vec2 offset = vec2(0);
	if ( !uCameraIsMoving ) 
	{
		offset.x = r1 < 1.0 ? sqrt(r1) - 1.0 : 1.0 - sqrt(2.0 - r1);
        offset.y = r2 < 1.0 ? sqrt(r2) - 1.0 : 1.0 - sqrt(2.0 - r2);
	}
	
	offset /= (uResolution);
	pixelPos = (2.0 * (vUv + offset) - 1.0);
	vec3 rayDir = normalize( pixelPos.x * camRight * uULen + pixelPos.y * camUp * uVLen + camForward );
	
	// depth of field
	vec3 focalPoint = uFocusDistance * rayDir;
	float randomAngle = rand(seed) * TWO_PI; // pick random point on aperture
	float randomRadius = rand(seed) * uApertureSize;
	vec3  randomAperturePos = ( cos(randomAngle) * camRight + sin(randomAngle) * camUp ) * randomRadius;
	// point on aperture to focal point
	vec3 finalRayDir = normalize(focalPoint - randomAperturePos);
	
	Ray ray = Ray( cameraPosition + randomAperturePos , finalRayDir );
	SetupScene();
	     		
	// perform path tracing and get resulting pixel color
	vec3 pixelColor = CalculateRadiance( ray, seed );
	
	vec3 previousColor = texture2D(tPreviousTexture, vUv).rgb;
	
	if ( uSampleCounter == 1.0 )
	{
		previousColor = vec3(0.0); // clear rendering accumulation buffer
	}
	else if ( uCameraIsMoving )
	{
		previousColor *= 0.5; // motion-blur trail amount (old image)
		pixelColor *= 0.5; // brightness of new image (noisy)
	}
		
	gl_FragColor = vec4( pixelColor + previousColor, 1.0 );
	
}
