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
