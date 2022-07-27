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
export const gradientStep: string = `
    vec3 gradientStep(vec3 A, vec3 B, float step) {
        vec3[2] boost = vec3[](A, B);
        float tl = step * 1.0 + 0.5;
        int id = int(floor(tl));
        float p = sin(((tl - float(id)) * PI - PI/4.0) * 2.0) * 0.5 + 0.5;

        return mix(mix(A, B, step), boost[id], p);
    }

    vec3 gradientStep(vec3 A, vec3 B, vec3 C, float step) {
        vec3 A1 = mix(A, B, step);
        vec3 B1 = mix(B, C, step);

        vec3[3] boost = vec3[](A, B, C);
        float tl = step * 2.0 + 0.5;
        int id = int(floor(tl));
        float p = sin(((tl - float(id)) * PI - PI/4.0) * 2.0) * 0.5 + 0.5;

        return mix(mix(A1, B1, step), boost[id], p);
    }

    vec3 gradientStep(vec3 A, vec3 B, vec3 C, vec3 D, vec3 E, vec3 F, vec3 G, float step) {
        vec3 A1 = mix(A, B, step);
        vec3 B1 = mix(B, C, step);
        vec3 C1 = mix(C, D, step);
        vec3 D1 = mix(D, E, step);
        vec3 E1 = mix(E, F, step);
        vec3 F1 = mix(F, G, step);

        vec3 A2 = mix(A1, B1, step);
        vec3 B2 = mix(B1, C1, step);
        vec3 C2 = mix(C1, D1, step);
        vec3 D2 = mix(D1, E1, step);
        vec3 E2 = mix(E1, F1, step);

        vec3 A3 = mix(A2, B2, step);
        vec3 B3 = mix(B2, C2, step);
        vec3 C3 = mix(C2, D2, step);
        vec3 D3 = mix(D2, E2, step);

        vec3 A4 = mix(A3, B3, step);
        vec3 B4 = mix(B3, C3, step);
        vec3 C4 = mix(C3, D3, step);

        vec3 A5 = mix(A4, B4, step);
        vec3 B5 = mix(B4, C4, step);

        vec3[7] boost = vec3[](A, B, C, D, E, F, G);
        float tl = step * 6.0 + 0.5;
        int id = int(floor(tl));
        // 0,5 = peak 1, 1 = 0
        float p = sin(((tl - float(id)) * PI - PI/4.0) * 2.0) * 0.5 + 0.5;

        return mix(mix(A5, B5, step), boost[id], p * 0.5);
    }
`;

// language=glsl
export const psrdnoise2: string = `
    // psrdnoise (c) Stefan Gustavson and Ian McEwan,
    // ver. 2021-12-02, published under the MIT license:
    // https://github.com/stegu/psrdnoise/
    float psrdnoise(vec2 x, vec2 period, float alpha, out vec2 gradient)
    {
        vec2 uv = vec2(x.x+x.y*0.5, x.y);
        vec2 i0 = floor(uv), f0 = fract(uv);
        float cmp = step(f0.y, f0.x);
        vec2 o1 = vec2(cmp, 1.0-cmp);
        vec2 i1 = i0 + o1, i2 = i0 + 1.0;
        vec2 v0 = vec2(i0.x - i0.y*0.5, i0.y);
        vec2 v1 = vec2(v0.x + o1.x - o1.y*0.5, v0.y + o1.y);
        vec2 v2 = vec2(v0.x + 0.5, v0.y + 1.0);
        vec2 x0 = x - v0, x1 = x - v1, x2 = x - v2;
        vec3 iu, iv, xw, yw;
        if (any(greaterThan(period, vec2(0.0)))) {
            xw = vec3(v0.x, v1.x, v2.x);
            yw = vec3(v0.y, v1.y, v2.y);
            if (period.x > 0.0)
            xw = mod(vec3(v0.x, v1.x, v2.x), period.x);
            if (period.y > 0.0)
            yw = mod(vec3(v0.y, v1.y, v2.y), period.y);
            iu = floor(xw + 0.5*yw + 0.5); iv = floor(yw + 0.5);
        } else {
            iu = vec3(i0.x, i1.x, i2.x); iv = vec3(i0.y, i1.y, i2.y);
        }
        vec3 hash = mod(iu, 289.0);
        hash = mod((hash*51.0 + 2.0)*hash + iv, 289.0);
        hash = mod((hash*34.0 + 10.0)*hash, 289.0);
        vec3 psi = hash*0.07482 + alpha;
        vec3 gx = cos(psi); vec3 gy = sin(psi);
        vec2 g0 = vec2(gx.x, gy.x);
        vec2 g1 = vec2(gx.y, gy.y);
        vec2 g2 = vec2(gx.z, gy.z);
        vec3 w = 0.8 - vec3(dot(x0, x0), dot(x1, x1), dot(x2, x2));
        w = max(w, 0.0); vec3 w2 = w*w; vec3 w4 = w2*w2;
        vec3 gdotx = vec3(dot(g0, x0), dot(g1, x1), dot(g2, x2));
        float n = dot(w4, gdotx);
        vec3 w3 = w2*w; vec3 dw = -8.0*w3*gdotx;
        vec2 dn0 = w4.x*g0 + dw.x*x0;
        vec2 dn1 = w4.y*g1 + dw.y*x1;
        vec2 dn2 = w4.z*g2 + dw.z*x2;
        gradient = 10.9*(dn0 + dn1 + dn2);
        return 10.9*n;
    }
`;
