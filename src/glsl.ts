// language=glsl
export const precisionAndDefaults: string = `
    #ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
    precision highp int;
    precision highp sampler2D;
    #else
    precision mediump float;
    precision mediump int;
    precision mediump sampler2D;
    #endif
    #define PI 3.14159265359
`;

// language=glsl
export const bayerDither: string = `
    const int bayerMatrix4[4] = int[4](0, 2, 3, 1);
    const int bayerMatrix16[16] = int[16](
    0, 8, 2, 10,
    12, 4, 14, 6,
    3, 11, 1, 9,
    15, 7, 13, 5
    );

    const int bayerMatrix36[36] = int[36](
    16, 25, 12, 23, 1, 32,
    19, 0, 18, 15, 21, 2,
    17, 33, 7, 20, 5, 36,
    27, 3, 24, 8, 22, 10,
    9, 29, 11, 35, 13, 28,
    31, 4, 34, 6, 26, 14
    );

    const int bayerMatrix64[64] = int[64](
    0, 32, 8, 40, 2, 34, 10, 42,
    48, 16, 56, 24, 50, 18, 58, 26,
    12, 44, 4, 36, 14, 46, 6, 38,
    60, 28, 52, 20, 62, 30, 54, 22,
    3, 35, 11, 43, 1, 33, 9, 41,
    51, 19, 59, 27, 49, 17, 57, 25,
    15, 47, 7, 39, 13, 45, 5, 37,
    63, 31, 55, 23, 61, 29, 53, 21
    );

    float bayerDither2x2(float grayscale, ivec2 pixelCoord)
    {
        int index = (pixelCoord.x % 2) + (pixelCoord.y % 2) * 2;
        return grayscale > (float(bayerMatrix4[index]) + 0.5) / 4.0 ? 1.0 : 0.0;
    }

    vec3 bayerDither2x2(vec3 color, ivec2 pixelCoord)
    {
        int index = (pixelCoord.x % 2) + (pixelCoord.y % 2) * 2;
        float d = (float(bayerMatrix4[index]) + 0.5) / 4.0;
        return vec3(
        color.r > d ? 1.0 : 0.0,
        color.g > d ? 1.0 : 0.0,
        color.b > d ? 1.0 : 0.0
        );
    }

    float bayerDither4x4(float grayscale, ivec2 pixelCoord)
    {
        int index = (pixelCoord.x % 4) + (pixelCoord.y % 4) * 4;
        return grayscale > (float(bayerMatrix16[index]) + 0.5) / 16.0 ? 1.0 : 0.0;
    }

    vec3 bayerDither4x4(vec3 color, ivec2 pixelCoord)
    {
        int index = (pixelCoord.x % 4) + (pixelCoord.y % 4) * 4;
        float d = (float(bayerMatrix16[index]) + 0.5) / 16.0;
        return vec3(
        color.r > d ? 1.0 : 0.0,
        color.g > d ? 1.0 : 0.0,
        color.b > d ? 1.0 : 0.0
        );
    }

    // based on random 6x6 matrix - just for alea iacta est
    float bayerDither6x6(float grayscale, ivec2 pixelCoord)
    {
        int index = (pixelCoord.x % 6) + (pixelCoord.y % 6) * 6;
        return grayscale > (float(bayerMatrix36[index]) + 0.5) / 36.0 ? 1.0 : 0.0;
    }

    vec3 bayerDither6x6(vec3 color, ivec2 pixelCoord)
    {
        int index = (pixelCoord.x % 6) + (pixelCoord.y % 6) * 6;
        float d = (float(bayerMatrix36[index]) + 0.5) / 36.0;
        return vec3(
        color.r > d ? 1.0 : 0.0,
        color.g > d ? 1.0 : 0.0,
        color.b > d ? 1.0 : 0.0
        );
    }

    vec3 bayerDither6x6(vec3 color, ivec2 pixelCoord, int[36] matrix)
    {
        int index = (pixelCoord.x % 6) + (pixelCoord.y % 6) * 6;
        float d = (float(matrix[index]) + 0.5) / 36.0;
        return vec3(
        color.r > d ? 1.0 : 0.0,
        color.g > d ? 1.0 : 0.0,
        color.b > d ? 1.0 : 0.0
        );
    }

    float bayerDither8x8(float grayscale, ivec2 pixelCoord)
    {
        int index = (pixelCoord.x % 8) + (pixelCoord.y % 8) * 8;
        return grayscale > (float(bayerMatrix64[index]) + 0.5) / 64.0 ? 1.0 : 0.0;
    }

    vec3 bayerDither8x8(vec3 color, ivec2 pixelCoord)
    {
        int index = (pixelCoord.x % 8) + (pixelCoord.y % 8) * 8;
        float d = (float(bayerMatrix64[index]) + 0.5) / 64.0;
        return vec3(
        color.r > d ? 1.0 : 0.0,
        color.g > d ? 1.0 : 0.0,
        color.b > d ? 1.0 : 0.0
        );
    }
`;
