import {
    contrastMat,
    css,
    LCH,
    lch,
    saturationMat,
    SRGB,
    srgb,
    transform,
} from '@thi.ng/color';

export type Palettes = { [key: string]: string[] };

const median = (arr: number[]) => {
    const mid = Math.floor(arr.length / 2),
        nums = [...arr].sort((a, b) => a - b);
    return arr.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
};

export const contrastAndSaturation = (
    palettes: Palettes,
    contrast: number,
    saturation: number
) => {
    let m = Object.values(palettes).map((cs) => {
        let lAverage = median(cs.map((c) => lch(srgb(c)).l));
        let cAverage = median(cs.map((c) => lch(srgb(c)).c));
        return cs.map((c) => {
            let cc: SRGB = srgb(c);
            let ct: SRGB = srgb();
            let cs: SRGB = srgb();

            let cl = lch(cc);
            let cont = contrast;
            if (cl.l < lAverage) {
                cont = 1;
            }
            let sat = saturation;
            if (cl.c < cAverage) {
                sat = 1;
            }

            if (cc.r >= 0.9 && cc.g >= 0.9 && cc.b >= 0.9) {
                return css(cc);
            }

            if (cc.r <= 0.1 && cc.g <= 0.1 && cc.b <= 0.1) {
                return css(cc);
            }

            transform(ct, contrastMat(cont), cc) as SRGB;
            if (
                (ct.r <= 0.04 || ct.r >= 0.96) &&
                (ct.g <= 0.04 || ct.g >= 0.96) &&
                (ct.b <= 0.04 || ct.b >= 0.96)
            ) {
                ct = cc;
            }
            transform(cs, saturationMat(sat), ct) as SRGB;

            if (
                (cs.r <= 0.04 || cs.r >= 0.96) &&
                (cs.g <= 0.04 || cs.g >= 0.96) &&
                (cs.b <= 0.04 || cs.b >= 0.96)
            ) {
                cs = ct;
            }
            return css(cs);
        });
    });
    let r: Palettes = {};
    Object.keys(palettes).forEach((k, i) => (r[k] = m[i]));
    return r;
};

export const colorAndLuminosity = (
    palettes: Palettes,
    luminosity: number,
    color: number
) => {
    let m = Object.values(palettes).map((cs) => {
        let lAverage = median(cs.map((c) => lch(srgb(c)).l));
        let cAverage = median(cs.map((c) => lch(srgb(c)).c));
        return cs.map((c) => {
            let cc: LCH = lch(srgb(c));

            let lum = luminosity;
            if (cc.l < lAverage) {
                lum = 1;
            }
            let col = color;
            if (cc.c < cAverage) {
                col = 1;
            }

            let ct = lch(cc.l * lum, cc.c, cc.h);
            if (ct.l <= 0.04 || ct.l >= 0.96) {
                ct = cc;
            }
            let cs = lch(cc.l, cc.c * col, cc.h);

            if (cs.c <= 0.04 || cs.c >= 0.96) {
                cs = ct;
            }
            return css(cs);
        });
    });
    let r: Palettes = {};
    Object.keys(palettes).forEach((k, i) => (r[k] = m[i]));
    return r;
};

export const bumpContrastAndSaturation = (
    iterations: number,
    palettes: Palettes,
    contrast: number,
    saturation: number
): Palettes => {
    for (let i = 0; i < iterations; i++) {
        palettes = contrastAndSaturation(palettes, contrast, saturation);
    }
    return palettes;
};

export const bumpColorAndLuminosity = (
    iterations: number,
    palettes: Palettes,
    luminosity: number,
    color: number
): Palettes => {
    for (let i = 0; i < iterations; i++) {
        palettes = colorAndLuminosity(palettes, luminosity, color);
    }
    return palettes;
};

/**
 * Generate Palettes based on an array of css colors
 */
export const generatePalettes = (
    colors: string[],
    numberOfColors: number,
    numberOfPalettes: number,
    name: string
): Palettes => {
    let c: Palettes = {};
    let cs: LCH[] = [];

    for (let i = 0; i < numberOfPalettes; i++) {
        let found: boolean = false;
        while (!found) {
            // pick colors from random css
            cs = [...colors]
                .sort(() => 0.5 - Math.random())
                .slice(0, numberOfColors)
                .map((c) => lch(c));

            if (cs.filter((c) => c.l < 0.2).length == 0) {
                continue;
            }
            if (cs.filter((c) => c.l > 0.8).length == 0) {
                continue;
            }
            if (cs.filter((c) => c.l < 0.05).length > 0) {
                continue;
            }

            if (cs.filter((c) => c.c < 0.4).length == 0) {
                continue;
            }
            if (cs.filter((c) => c.c > 0.8).length == 0) {
                continue;
            }

            // hue max spread
            let hDifference = cs
                .map((c) => [c.h, c.h])
                .reduce(
                    (pv, cv) => [
                        Math.min(pv[0], cv[0]),
                        Math.max(pv[1], cv[1]),
                    ],
                    [1.0, 0.0]
                )
                .reduce((pv, cv) => Math.abs(pv - cv));
            if (hDifference < 0.3 && hDifference > 0.6) {
                continue;
            }

            let hueAverage =
                cs.map((c) => c.h).reduce((pv, cv) => pv + cv) / cs.length;
            if (hueAverage > 0.2 && hueAverage < 0.4) {
                continue;
            }

            // saturation spread
            let cDifference = cs
                .map((c) => [c.c, c.c])
                .reduce(
                    (pv, cv) => [
                        Math.min(pv[0], cv[0]),
                        Math.max(pv[1], cv[1]),
                    ],
                    [1.0, 0.0]
                )
                .reduce((pv, cv) => Math.abs(pv - cv));
            if (cDifference < 0.7) {
                continue;
            }

            let cAverage =
                cs.map((c) => c.c).reduce((pv, cv) => pv + cv) / cs.length;
            if (cAverage < 0.5) {
                continue;
            }

            found = true;
        }

        c[name + i] = cs.map((c) => css(c));
    }

    return c;
};
