var fsTraceSrc = 
`
precision highp float;

varying vec3 viewDir;
uniform vec3 eye;

uniform sampler2D tex;
varying vec2 texCoord;

uniform mat4 quadrics[32];
uniform vec4 materials[16];

struct Intersection
{
    bool IsValid;
    bool IsLight;

    vec3 Normal;
    vec3 Color;

    float Distance;
    float Reflectance;
};

// Négyzet alakú lámpa
struct Light
{
    // A bal alsó pont pozícíója
    vec3 Position;
    vec3 Size;
    vec3 Color;
    float Intensity;
};

const Light Lamp = Light(vec3(-1.0, 1.8, -0.2), vec3(0.3, 0.01, 0.3), // position, size
                         vec3(0.9, 0.9, 0.85), 7.6 );                 // color, intensity

// Az előző képi változás óra megjelenített képkockák, ezt kívülről állítjuk
uniform int framesElapsed;

const int traceDepth = 2;

const int numSamples = 5;

const int numQuadrics = 3;

const float M_PI = 3.1415927;

const float  planeY = -0.7;
const vec4 planeColor = vec4(0.6, 0.7, 0.2, 0.0);//vec4(0.753, 0.753, 0.753, 0.8);

const vec3 skyColor = vec3(0.49, 0.75, 0.933);
const vec3 ambientLight = vec3(0.3, 0.3, 0.28);

float randSeed = 0.0;

// Lámpa helyzete és mérete TODO remove
const vec3 LampPosition = vec3(-1.0, 1.8, -0.2);
const vec3 LampSize = vec3(0.3, 0.01, 0.3);

// Interneten talált random generáló
float rand(float seed)
{
    return fract(sin(seed) * 43758.5453);
}

vec3 rand3(float seed)
{
    return vec3(rand(seed), rand(seed + 1.4142), rand(seed + 3.1415));
}

vec3 randomPointOnLight(Light light, vec3 hit)
{
    vec3 seedVec = hit + rand3(randSeed);
	vec3 point = vec3(rand(dot(vec3(2.39888, -1.34132, 1.432), seedVec)),
					  0.0, 
					  rand(dot(vec3(5.4873, 8.8254, -0.69247), seedVec)));
	return light.Position + light.Size * point;
}


mat3 getTBNMatrix(vec3 norm)
{
	mat3 TBN;

	TBN[1] = norm;

  	vec3 up = vec3(0.0, 1.0, 0.0);
  	vec3 right = vec3(1.0, 0.0, 0.0);

  	if(dot(up, norm) < dot(right, norm))
  	{
  		TBN[0] = cross(up, norm);
  	}
  	else
  	{
  		TBN[0] = cross(right, norm);
  	}

  	TBN[2] = normalize(cross(TBN[0], TBN[1]));

  	return TBN;

}

vec3 randomPointOnHemisphere(vec3 point)
{
    float r1 = rand(dot(vec3(112, 35, 8), point) + randSeed);
    float r2 = rand(dot(vec3(112, 35, 8), point) - randSeed);

    float phi = 2.0 * M_PI * r1;
    float theta = acos(sqrt(r2)) / 2.0;

    vec3 randPoint =  vec3( sin(theta) * sin(phi),
                            cos(theta),
                            sin(theta) * cos(phi));

    return randPoint;
}

float intersectClippedQuadric(mat4 A, mat4 B, vec4 e, vec4 d) {
	float a = dot( d, A * d);
	float b = dot( e, A * d) + dot(d, A * e );
	float c = dot( e, A * e );

	float discr = b * b - 4.0 * a * c;
	if ( discr < 0.0 )
		return -1.0;
	float sqrt_discr = sqrt( discr );
	float t1 = (-b + sqrt_discr)/2.0/a;
	float t2 = (-b - sqrt_discr)/2.0/a;
	vec4 hit1 = e + d * t1;
	vec4 hit2 = e + d * t2;
	if( dot( hit1, B * hit1) > 0.0)
		t1 = -1.0;
	if( dot( hit2, B * hit2) > 0.0)
		t2 = -1.0;

	float t = (t1<t2)?t1:t2;
	if(t < 0.0)
		t = (t1<t2)?t2:t1;
	return t;
}


vec3 getQuadricNormal(mat4 A, vec4 hit)
{
	return normalize((hit * A + A * hit).xyz);
}

Intersection intersectAll(vec4 eye, vec4 dir)
{
    Intersection result;
    result.IsValid = false;
    result.Distance = 10000.0;

    // Intersect all clipped quadrics
    for(int i = 0; i < numQuadrics; ++i)
    {
        float quadDist = intersectClippedQuadric(quadrics[2 * i], quadrics[2 * i + 1], eye, dir);
        if(quadDist > 0.0 && quadDist < result.Distance)
        {
            result.IsValid = true;
            result.Distance = quadDist;
            result.IsLight = false;
            result.Normal = getQuadricNormal(quadrics[2 * i], eye + dir * quadDist);
            result.Color = materials[i].rgb;
            result.Reflectance = materials[i].w;
        }
    }

    // Intersect the plane
    float planeDist = (planeY - eye.y) / dir.y;
    if(planeDist > 0.0 && planeDist < result.Distance)
    {
        result.IsValid = true;
        result.Distance = planeDist;
        result.IsLight = false;
        result.Normal = vec3(0.0, 1.0, 0.0);
        result.Color = planeColor.rgb;
        result.Reflectance = planeColor.w;
    }

    // Intersect the light
    float lampDist = (Lamp.Position.y + Lamp.Size.y - eye.y) / dir.y;
    if(lampDist > 0.0 && lampDist < result.Distance)
    {
        vec4 lampHit = eye + lampDist * dir;
        if( lampHit.x >= Lamp.Position.x && lampHit.x <= Lamp.Position.x + Lamp.Size.x &&
            lampHit.z >= Lamp.Position.z && lampHit.z <= Lamp.Position.z + Lamp.Size.z)
        {
            result.IsValid = true;
            result.Distance = lampDist;
            result.IsLight = true;
            result.Normal = vec3(0.0, 1.0, 0.0);
            result.Color = Lamp.Color;
            result.Reflectance = 0.0;
        }
    }

    if(dot(dir.xyz, result.Normal) > 0.0)
    {
        result.Normal = -(result.Normal);
    }

    return result;
}

vec3 trace(inout vec4 e, inout vec4 d, inout vec3 accColor, inout float contrib, int traceDepth, inout bool wasHit)
{
	vec3 lighting = vec3(0.0);
	
    Intersection hit = intersectAll(e, d);

    if(hit.IsValid)
    {
        vec4 hitPoint = e + hit.Distance * d;
        
        // Little offset for the next ray
        e = hitPoint + vec4(hit.Normal, 0.0) * 0.001;

        vec3 lightPoint = randomPointOnLight(Lamp, hitPoint.xyz);

        // First hit is on the lamp
        if(hit.IsLight && traceDepth == 0)
        {
            vec3 lightDist = lightPoint - e.xyz;
            lighting = (Lamp.Intensity * Lamp.Color) / (1.0 + dot(lightDist, lightDist));
        }
        else
        {
            vec3 lightFromHit = lightPoint - hitPoint.xyz;
            float distToLight = length(lightFromHit);
            vec4 dirToLight = vec4(normalize(lightFromHit), 0.0);

            // Start from the slightly moved point, e
            Intersection lightHit = intersectAll(e, dirToLight);
            if(lightHit.IsValid && lightHit.Distance >= distToLight)
            {
                vec3 lampColor = (Lamp.Intensity * Lamp.Color) / (1.0 + dot(distToLight, distToLight));
                lighting += max(dot(dirToLight.xyz, hit.Normal), 0.0) * lampColor;
            }
        }

        // BRDF
        vec3 randPt = randomPointOnHemisphere(hitPoint.xyz);
        vec3 diffuseReflection = getTBNMatrix(hit.Normal) * randPt;
        vec3 mirrorReflection = reflect(d.xyz, hit.Normal);
        d = vec4(mix(diffuseReflection, mirrorReflection, hit.Reflectance), 0.0);

        contrib = 1.0 / randPt.y;
    }
    else
    {
        contrib = 1.0;
        hit.Color = skyColor;
        lighting = ambientLight;
    }

    wasHit = hit.IsValid;

    accColor *= hit.Color.rgb;
    return clamp(lighting * accColor, vec3(0.0), vec3(1.0));

}

void main() { 
  	vec4 d_init = vec4(normalize(viewDir), 0.0);
  	vec4 e_init = vec4(eye, 1.0);

    vec3 outColor = vec3(0.0);

    for(int sample = 0; sample < numSamples; sample += 1)
    {
	    float contrib = 1.0;
	    vec3 accColor = vec3(1.0);
	    vec4 dirRand =  vec4(rand(float(sample)), rand(float(sample) + 1.0), rand(float(sample) + 2.0), 0.0 ) - 
    				    vec4(0.5, 0.5, 0.5, 0.0);
	  	vec4 d = normalize(d_init + 0.001 * dirRand);
	  	vec4 e = e_init;

	  	bool wasHit = false;
  		for(int depth = 0; depth < traceDepth; depth += 1)
	  	{
		  	randSeed = float(framesElapsed) * 0.31415;
		  	
		  	
		  	float prevContrib = contrib;
	  		vec3 color = trace(e, d, accColor, contrib, depth, wasHit);

	  		outColor += prevContrib * color;

	  		if( !wasHit)
	  		{
	  			break;
	  		}
	  	}
  	}


  	vec3 finalColor = clamp(outColor / float(numSamples), vec3(0.0), vec3(1.0));

  	if(framesElapsed > 0)
  	{
  		vec3 prevColor = texture2D(tex, texCoord).rgb;
  		float a = 1.0 / (float(framesElapsed) + 1.0);

  		finalColor = mix(prevColor, finalColor, a);
  	}

    gl_FragColor = vec4(finalColor, 1.0);

} 
`
