var fsTraceSrc = `
precision highp float;
varying vec3 viewDir;
uniform vec3 eye;
uniform sampler2D volume;
varying vec2 tex;
uniform float depth;
uniform int opacityCast;


vec4 getColor(vec4 point)
{
    // Hány pixel széles, illetve magas a textúra
    float textureSizePx = 4096.0;

    // Hány szelet képe található egy sorban (és egy oszlopban)
    float slicesPerRow = 16.0;

    // Hány szelet van összesen
    float numSlices = slicesPerRow * slicesPerRow;

    // Egy szelet képének a mérete, pixelben
    float sliceSizePx = textureSizePx / slicesPerRow;

    // Egy szeleten belül az pont koordinátááihoz tartozó textúra koordináták
    float sliceOffsetX = (point.x * sliceSizePx) / textureSizePx;
    float sliceOffsetY = (point.y * sliceSizePx) / textureSizePx;

    // A mélységi érték által kijelölt szelet sorának indexe, értéke 0-slicesPerRow közt lehet
    float sliceRowIndex = floor(floor(point.z * numSlices) / slicesPerRow);
    // A következő szelet sorának indexe
    float nextSliceRowIndex = floor( ceil(point.z * numSlices) / slicesPerRow);
    if(nextSliceRowIndex >= slicesPerRow)
    {
        nextSliceRowIndex = sliceRowIndex;
    }

    // A szelet oszlopának indexe
    float sliceColIndex =     floor(point.z * numSlices) - sliceRowIndex * slicesPerRow;
    // A következő szelet oszlopának indexe
    float nextSliceColIndex =  ceil(point.z * numSlices) - nextSliceRowIndex * slicesPerRow;
    if(nextSliceColIndex >= slicesPerRow)
    {
        nextSliceColIndex = sliceColIndex;
    }

    // A kiválasztott szelet kezdetének textúra koordinátái
    float sliceTexCoordX = (sliceColIndex * sliceSizePx) / textureSizePx;
    float sliceTexCoordY = (sliceRowIndex * sliceSizePx) / textureSizePx;

    // A következő szelet kezdetének textúra koordinátái
    float nextSliceTexCoordX = (nextSliceColIndex * sliceSizePx) / textureSizePx;
    float nextSliceTexCoordY = (nextSliceRowIndex * sliceSizePx) / textureSizePx;

    vec2 sample1pt = vec2(sliceTexCoordX, sliceTexCoordY) +
                     vec2(  sliceOffsetX, sliceOffsetY  );

    vec2 sample2pt = vec2(nextSliceTexCoordX, nextSliceTexCoordY) +
                     vec2(      sliceOffsetX, sliceOffsetY      );

    vec4 sample1 = texture2D(volume, sample1pt);
    vec4 sample2 = texture2D(volume, sample2pt);

    float a = point.z * numSlices - floor(point.z * numSlices);
    vec4 resampled = mix(sample2, sample1, a); // sample1 * (a) + sample2 * (1.0 - a);

    return vec4(resampled.rgb, 1.0);

}


vec3 getGradient(vec4 point, float step)
{
    vec4 dx1 = getColor(vec4(point.x - step, point.yzw));
    vec4 dx2 = getColor(vec4(point.x + step, point.yzw));
    vec4 dy1 = getColor(vec4(point.x, point.y - step, point.zw));
    vec4 dy2 = getColor(vec4(point.x, point.y + step, point.zw));
    vec4 dz1 = getColor(vec4(point.xy, point.z - step, point.w));
    vec4 dz2 = getColor(vec4(point.xy, point.z + step, point.w));

    vec3 result = vec3(dx2.x - dx1.x, dy2.y - dy1.y, dz2.z - dz1.z);

    return result;
}

void main()
{ 
    vec4 d = vec4(normalize(viewDir), 0.0);
    vec4 e = vec4(eye, 1.0);
    const float step = 0.008;

    if(opacityCast == 1)
    {
        vec4 color_acc = vec4(0.0, 0.0, 0.0, 0.0);

        vec4 prevDensity = vec4(0.0, 0.0, 0.0, 0.0);

        float opacity_acc = 0.0;
        int wasHit = 0;
        float startT = length(vec3(0.5, 0.5, 0.5) - e.xyz)  - sqrt(3.0) / 2.0;

        for(float t = 0.0;t < sqrt(3.0); t += step) {
            vec4 pt = e + (startT + t) * d;

            if (pt.x >= 0.0 && pt.x < 1.0 &&
                pt.y >= 0.0 && pt.y < 1.0 &&
                pt.z >= 0.0 && pt.z < 1.0)
            {
                wasHit = 1;
                vec4 density = getColor(pt);
                vec3 grad = getGradient(pt, step);

                float opacity = density.r;// min(length(grad), 1.0);// pt.z / 2.0;

                vec4 resampledDensity = mix(density, prevDensity, prevDensity.r / density.r);

                color_acc += (1.0 - opacity_acc) * density * opacity;
                opacity_acc += (1.0 - opacity_acc) * opacity;

                prevDensity = density;
            }
        }

        if(wasHit == 0)
        {
            gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
        }
        else
        {
            gl_FragColor = vec4(color_acc.rgb, opacity_acc);
        }
    }
    else
    {
        vec4 hitPoint;

        vec4 color = vec4(0.0, 0.0, 0.0, 0.0);
        vec4 tempColor = vec4(0.0, 0.0, 0.0, 0.0);


        float startT = length(vec3(0.5, 0.5, 0.5) - e.xyz)  - sqrt(3.0) / 2.0;

        for(float t = 0.0;t < sqrt(3.0); t += step) {
            vec4 pt = e + (startT + t) * d;
            
            if (pt.x >= 0.0 && pt.x < 1.0 &&
                pt.y >= 0.0 && pt.y < 1.0 &&
                pt.z >= 0.0 && pt.z < 1.0 && color.a < 1.0)
            {
                tempColor = getColor(pt);

                if(tempColor.r >= depth)
                {
                    hitPoint = pt;
                    color = tempColor;
                }

            }
        }



        if ( (color.a > 0.9))
        {
            vec3 normal = getGradient(hitPoint, step);
            gl_FragColor = vec4(0.6, 0.6, 0.6, 0.0) + vec4(color.rgb * dot(normal.xyz, d.xyz), 1.0);
        }
        else
        {
            gl_FragColor = vec4(color.rgb, 1.0);
        }    
    } 
}
`
