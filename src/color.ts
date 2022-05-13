export const color = {
    rotate: (
        r: number,
        g: number,
        b: number,
        dh: number,
        hMin: number = 0,
        hMax: number = 360,
        dv: number = 0,
        vMin: number = 0,
        vMax: number = 255,
        vRotate: boolean = false,
        sMin: number = 0,
        sMax: number = 1,
        hBase: number,
        hBaseDiff: number = 0
    ): Array<number> => {
        // to hsv
        const maxRGB: number = Math.max(r, g, b);
        const minRGB: number = Math.min(r, g, b);

        const delta = maxRGB - minRGB;
        let h = 0,
            s = 0,
            v = maxRGB;

        if (maxRGB !== 0) {
            s = delta / maxRGB;
            if (s < sMin) s = sMin;
            if (r === maxRGB) h = (g - b) / delta;
            if (g === maxRGB) h = 2 + (b - r) / delta;
            if (b === maxRGB) h = 4 + (r - g) / delta;
            h *= 60;
        }

        // correct hue > better ryb complementary colors - but too many glitches
        // h = (360 * (h / 360)) ^ 1.6;

        // rotate hue
        if (dh !== 0) {
            h += dh;
            if (h >= 360) h -= 360;
            if (h < 0) h += 360;

            // eg 120 - 240 or 300 - 60
            if (hMax < hMin) {
                if (dh > 0) {
                    h = h > hMax && h < hMin ? hMin : h;
                } else {
                    h = h < hMin && h > hMax ? hMax : h;
                }
            } else {
                if (dh > 0) {
                    h = h > hMax ? hMin : h < hMin ? hMin : h;
                } else {
                    h = h > hMax ? hMax : h < hMin ? hMax : h;
                }
            }
        }

        // min or max saturation based on hue
        let hDiff = Math.abs(hBase - h) > hBaseDiff;
        if (hDiff) {
            s = sMax;
        } else {
            s = sMin;
        }

        // rotate value
        if (dv !== 0) {
            v += dv;
            if (v > vMax) v = vRotate ? vMin : vMax;
            else if (v < vMin) v = vRotate ? vMax : vMin;
        }

        // back to rgb
        if (s === 0) {
            return [v, v, v];
        } else {
            if (h >= 360) h -= 360;
            if (h < 0) h += 360;

            h /= 60;

            const i = h << 0;
            const f = h - i;
            const p = v * (1 - s);
            const q = v * (1 - s * f);
            const t = v * (1 - s * (1 - f));

            switch (i) {
                case 0:
                    return [v, t, p];
                case 1:
                    return [q, v, p];
                case 2:
                    return [p, v, t];
                case 3:
                    return [p, q, v];
                case 4:
                    return [t, p, v];
                case 5:
                default:
                    return [v, p, q];
            }
        }
    },
    hsvToRgb: (h: number, s: number, v: number): Array<number> => {
        v *= 255;
        if (s === 0) {
            return [v, v, v];
        } else {
            if (h === 360) h = 0;
            if (h > 360) h -= 360;
            if (h < 0) h += 360;
            h /= 60;

            const i = h << 0;
            const f = h - i;
            const p = v * (1 - s);
            const q = v * (1 - s * f);
            const t = v * (1 - s * (1 - f));

            switch (i) {
                case 0:
                    return [v, t, p];
                case 1:
                    return [q, v, p];
                case 2:
                    return [p, v, t];
                case 3:
                    return [p, q, v];
                case 4:
                    return [t, p, v];
                case 5:
                default:
                    return [v, p, q];
            }
        }
    },
    hsvCss: (h: number, s: number, v: number): string => {
        let r, g, b;
        [r, g, b] = color.hsvToRgb(h, s, v);
        return `rgb(${r << 0}, ${g << 0}, ${b << 0})`;
    },
};
