import { Area, rand, randInit, randInt, randOptions, RND } from './rand';
import * as isec from '@thi.ng/geom-isec';
import * as twgl from 'twgl.js';
import {
    ColorRange,
    colorsFromRange,
    css,
    GradientColorStop,
    lch,
    LCH,
    multiColorGradient,
    srgb,
    TypedColor,
} from '@thi.ng/color';
import { clamp01, mod } from '@thi.ng/math';
import { gradientStep, precisionAndDefaults, psrdnoise2 } from './glsl';
import {
    combinationFn,
    features,
    featureSet,
    featureNumber,
    featureCollection,
    variation,
} from './combinations';

export type FxhashFeatures = {
    color: string;
    'color shift direction': string;
    'color shift speed': string;
    'brush moving blocks': string;
    'brush intensity': string;
    'brush moving direction': string;
    'moving speed': string;
    'moire intensity': string;
    'gradient steps': string;
    'gradient colors': string;
};

export type MoveDirection = ('left' | 'up' | 'down' | 'right')[];
export type MoveDirections = MoveDirection[];
export type MovingBlockOptions = {
    maxMovingBlocks: number;
    blockSize: number;
};

type GradientType = {
    start: variation<number>;
    startLightness: variation<string>;
    startColor: variation<string>;
    dark: variation<number>;
    darkLightness: variation<string>;
    lite: variation<number>;
    end: variation<number>;
};

type FeaturesType = {
    brushMovingDirections: variation<MoveDirections>;
    brushMovingBlocks: variation<MovingBlockOptions>;
    brushIntensity: variation<number>;
    colorShiftDirection: variation<number>;
    colorShiftSpeed: variation<number>;
    gradient: variation<GradientType>;
    moireIntensity: variation<number>;
    movingSpeed: variation<number>;
};

export const logColor = (c: TypedColor<any>, msg: string = '') =>
    console.log(
        `%c${msg}${css(c)}`,
        `background-color: ${css(c)}; color:#ffffff; padding: 20px;`
    );
export const getColor = (range: ColorRange): LCH => {
    return colorsFromRange(range, {
        variance: 0.0,
        rnd: RND,
    }).next().value as LCH;
};

export class Features {
    public combination: number = 0;

    public color: LCH;
    public colorCSS!: string;
    public colorRGB!: number[];
    public colorRGBAverage!: number;

    public readonly gradientSteps: number;
    public baseGradient: LCH[];
    public gradient: LCH[];
    public gradientCSS!: string[];
    public gradientRGBFlat!: number[];
    public gradientLightnessDiff!: number;

    public readonly colorShiftDirection: number;

    public readonly colorShiftSpeed: number;

    public movingDirections: MoveDirections;

    public movingSpeed: number;

    public readonly maxMovingBlocks: number;
    public readonly blockSize: number;

    public brushIntensity: number;
    public moireIntensity: number;

    public readonly gridSize: number = 1.0;

    public shiftFactors: number[] = [
        11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79,
        83, 89, 97, 101, 103, 107,
    ];

    private static movingDirectionOptions: Array<MoveDirections>;
    public static getMovingDirectionOptions(): Array<MoveDirections> {
        if (Features.movingDirectionOptions) {
            return Features.movingDirectionOptions;
        }
        const all: MoveDirections = [
            ['left', 'up'],
            ['left', 'down'],
            ['right', 'up'],
            ['right', 'down'],
            ['up'],
            ['left'],
            ['down'],
            ['right'],
        ];

        let combinations: Array<MoveDirections> = [];
        let active: MoveDirections = [];
        let variations = 2 ** all.length;

        for (let i = 0; i < variations; i++) {
            active = [];
            for (let j = 0; j < all.length; j++) {
                if (i & (2 ** j)) {
                    active.push(all[j]);
                }
            }
            if (active.length > 0) {
                combinations.push(active);
            }
        }

        Features.movingDirectionOptions = combinations.filter(
            (c) => c.length == 2
        );

        return Features.movingDirectionOptions;
    }

    public variation: variation<FeaturesType>;
    public static variations: combinationFn<FeaturesType> = features('piece', [
        featureSet<number>(
            'colorShiftDirection',
            [-1, 1],
            ['backward', 'forward']
        ),
        featureSet<number>(
            'colorShiftSpeed',
            [1, 2, 4],
            ['slow', 'medium', 'fast']
        ),
        featureSet<number>(
            'brushIntensity',
            [0.1, 1.0, 3.0],
            ['low', 'medium', 'high']
        ),
        featureSet<MovingBlockOptions>(
            'brushMovingBlocks',
            [
                { maxMovingBlocks: 1000, blockSize: 0.01 },
                { maxMovingBlocks: 200, blockSize: 0.05 },
                { maxMovingBlocks: 100, blockSize: 0.1 },
            ],
            ['many small', 'some medium', 'few large']
        ),
        featureSet<MoveDirections>(
            'brushMovingDirections',
            Features.getMovingDirectionOptions(),
            (_index, value: any) =>
                value.map((a: any) => a.join('-')).join(', ')
        ),
        featureSet<number>(
            'moireIntensity',
            [0.1, 1.0, 10.0],
            ['fine', 'coarse', 'very coarse']
        ),
        featureSet<number>(
            'movingSpeed',
            [1, 3, 7],
            ['slow', 'medium', 'fast']
        ),
        featureCollection<GradientType>(
            'gradient',
            [
                features('mono', [
                    featureNumber('start', 40),
                    featureSet<string>('startLightness', ['low', 'high']),
                    featureSet<string>('startColor', ['low', 'high']),
                    featureNumber('end', 24),
                ]),
                features('duo', [
                    featureNumber('start', 40),
                    featureSet<string>('startLightness', ['low', 'high']),
                    featureSet<string>('startColor', ['low', 'high']),
                    featureNumber('dark', 30),
                    featureSet<string>('darkLightness', ['low', 'high']),
                    featureNumber('lite', 24),
                ]),
                features('hexa', [
                    featureNumber('start', 40),
                    featureSet<string>('startLightness', ['low', 'high']),
                    featureSet<string>('startColor', ['low', 'high']),
                    featureNumber('dark', 30),
                    featureSet<string>('darkLightness', ['low', 'high']),
                    featureNumber('lite', 24),
                    featureNumber('end', 40),
                ]),
            ],
            [300, 10, 1]
        ),
    ]);

    public static combinations: number =
        Features.variations(0).numberOfVariations;

    public constructor(combination: number) {
        this.combination = combination % Features.combinations;

        this.variation = Features.variations(combination);

        this.colorShiftDirection =
            this.variation.value.colorShiftDirection.value;
        this.colorShiftSpeed = this.variation.value.colorShiftSpeed.value;
        this.gradientSteps = [1, 2, 6][this.variation.value.gradient.index];

        let hStart =
            this.variation.value.gradient.value.start.value /
            this.variation.value.gradient.value.start.variations;
        let cStart = this.variation.value.gradient.value.startColor.value;
        let lStart = this.variation.value.gradient.value.startLightness.value;
        this.color = getColor({
            h: [
                [
                    hStart == 0.0 ? hStart : hStart - Number.EPSILON,
                    hStart == 1.0 ? hStart : hStart + Number.EPSILON,
                ],
            ],
            c: [cStart == 'low' ? [0.0, 0.2] : [0.9, 1.0]],
            l: [lStart == 'low' ? [0.05, 0.25] : [0.8, 0.9]],
            b: [[0, 0.3]],
            w: [[0.3, 0.5]],
        });

        let endColor;
        if (this.gradientSteps == 1) {
            let hEnd =
                this.variation.value.gradient.value.end.value /
                this.variation.value.gradient.value.end.variations;
            hEnd = mod(hEnd * 0.6 + 0.2 + this.color.h, 1);

            endColor = getColor({
                h: [
                    [
                        hEnd == 0.0 ? hEnd : hEnd - Number.EPSILON,
                        hEnd == 1.0 ? hEnd : hEnd + Number.EPSILON,
                    ],
                ],
                c: [cStart == 'low' ? [0.9, 1.0] : [0.0, 0.2]],
                l: [lStart == 'low' ? [0.85, 0.95] : [0.0, 0.2]],
            });

            this.gradient = [endColor];
        } else {
            let lDark = this.variation.value.gradient.value.darkLightness.value;
            let hDark =
                this.variation.value.gradient.value.dark.value /
                this.variation.value.gradient.value.dark.variations;
            hDark *= 0.75;
            hDark = hDark > 0.25 ? hDark + 0.25 : hDark; // ignore 0.25 - 0.5 (green)
            let darkColor = getColor({
                h: [
                    [
                        hDark == 0.0 ? hDark : hDark - Number.EPSILON,
                        hDark == 1.0 ? hDark : hDark + Number.EPSILON,
                    ],
                ],
                l: [lDark == 'low' ? [0.1, 0.3] : [0.7, 0.9]],
                c: [
                    [0.0, 0.2],
                    [0.7, 0.8],
                ],
                b: [[0, 0.3]],
                w: [[0.3, 0.5]],
            });

            let hLite =
                this.variation.value.gradient.value.lite.value /
                this.variation.value.gradient.value.lite.variations;
            let liteColor = getColor({
                h: [
                    [
                        hLite == 0.0 ? hLite : hLite - Number.EPSILON,
                        hLite == 1.0 ? hLite : hLite + Number.EPSILON,
                    ],
                ],
                l:
                    lDark == 'low' && lStart == 'low'
                        ? [[0.7, 0.9]]
                        : [
                              [0.1, 0.3],
                              [0.7, 0.9],
                          ],
                c: [
                    [0.0, 0.2],
                    [0.7, 0.8],
                ],
            });

            if (this.gradientSteps == 2) {
                this.gradient = [darkColor, liteColor];
            } else {
                let hEnd =
                    this.variation.value.gradient.value.end.value /
                    this.variation.value.gradient.value.end.variations;
                hEnd = mod(hEnd * 0.6 + 0.2 + this.color.h, 1);
                endColor = getColor({
                    h: [
                        [
                            hEnd == 0.0 ? hEnd : hEnd - Number.EPSILON,
                            hEnd == 1.0 ? hEnd : hEnd + Number.EPSILON,
                        ],
                    ],
                    c:
                        cStart == 'low'
                            ? [[0.9, 1.0]]
                            : [
                                  [0.0, 0.2],
                                  [0.9, 1.0],
                              ],
                    l:
                        lStart == 'low'
                            ? [[0.85, 0.95]]
                            : [
                                  [0.0, 0.2],
                                  [0.85, 0.95],
                              ],
                });

                const gradient = multiColorGradient({
                    num: 7,
                    stops: [
                        [0, this.color],
                        [3 / 7, darkColor],
                        [4 / 7, liteColor],
                        [1, endColor],
                    ],
                });
                this.gradient = [
                    gradient[1],
                    gradient[2],
                    darkColor,
                    liteColor,
                    gradient[5],
                    gradient[6],
                ];
            }
        }

        this.baseGradient = [this.color, ...this.gradient];

        this.updateColor(this.color, this.gradient);

        this.movingDirections =
            this.variation.value.brushMovingDirections.value;

        this.movingSpeed = this.variation.value.movingSpeed.value;

        this.maxMovingBlocks =
            this.variation.value.brushMovingBlocks.value.maxMovingBlocks;
        this.blockSize = this.variation.value.brushMovingBlocks.value.blockSize;

        this.brushIntensity = this.variation.value.brushIntensity.value;

        this.moireIntensity = this.variation.value.moireIntensity.value;

        // shuffle shiftFactors
        this.shiftFactors = this.shiftFactors.sort(() => randOptions([-1, 1]));

        this.log();
    }

    public updateColor(baseColor: LCH, gradient: LCH[]) {
        this.color = baseColor;
        this.colorCSS = css(this.color);
        this.colorRGB = srgb(this.color).buf.slice(0, 3) as number[];
        this.colorRGBAverage =
            (this.colorRGB[0] + this.colorRGB[1] + this.colorRGB[2]) / 3;

        this.gradient = gradient;
        this.gradientCSS = this.gradient.map((c) => css(c));
        this.gradientRGBFlat = this.gradient
            .map((c) =>
                srgb(c)
                    .buf.slice(0, 3)
                    .map((v) => clamp01(v))
            )
            .flat() as number[];
        this.gradientLightnessDiff =
            0.4 +
            (this.color.l - this.gradient[this.gradientSteps - 1].l) * 0.2;
    }

    public getFxhashFeatures(): FxhashFeatures {
        return {
            color: this.colorCSS,
            ...Object.fromEntries(
                Object.values(this.variation.value).map((v) => [
                    v.name.replace(/([A-Z])/g, ' $1').toLowerCase(),
                    v.label,
                ])
            ),
            'gradient colors': this.getGradientFeature(),
        } as FxhashFeatures;
    }

    public getGradientFeature(): string {
        return this.gradientCSS.join(', ');
    }

    public getFeatureName(): string {
        return [
            ...Object.values(this.getFxhashFeatures()),
            this.combination,
            window.fxhash,
        ]
            .join('-')
            .replace(/\s+/g, '');
    }

    public log() {
        console.info(
            `combination: ${this.combination} / ${Features.combinations}`
        );
        Object.entries(this.getFxhashFeatures()).forEach((entry) =>
            console.info(`${entry[0]}: ${entry[1]}`)
        );
        this.baseGradient.forEach((c, index) => logColor(c, `${index}: `));
    }
}

export class Outputs {
    public readonly buffers: twgl.FramebufferInfo[];

    constructor(private context: WebGL2RenderingContext) {
        this.buffers = [];
    }

    public add(
        width: number,
        height: number,
        filter: GLenum
    ): twgl.FramebufferInfo {
        let buffer = twgl.createFramebufferInfo(
            this.context,
            [
                {
                    attachmentPoint: WebGL2RenderingContext.COLOR_ATTACHMENT0,
                    format: WebGL2RenderingContext.RGBA,
                    type: WebGL2RenderingContext.UNSIGNED_BYTE,
                    min: filter,
                    mag: filter,
                    wrap: WebGL2RenderingContext.CLAMP_TO_EDGE,
                },
            ],
            width,
            height
        );
        this.buffers.push(buffer);

        return buffer;
    }

    public updateSize(_width: number, _height: number) {
        this.buffers.forEach((b) =>
            twgl.resizeFramebufferInfo(this.context, b, b.attachments)
        );
    }
}

export class Noise {
    private program: twgl.ProgramInfo;
    private buffer: twgl.BufferInfo;
    public output: twgl.FramebufferInfo;
    private uniform: {
        combination: number;
        factors: number[];
    };

    public constructor(
        private context: WebGL2RenderingContext,
        private piece: Piece
    ) {
        // init noise for pixel and color shift
        // language=glsl
        const vertexShader = `
            #version 300 es
            ${precisionAndDefaults}

            in vec2 position;
            out vec2 pos;

            void main() {
                gl_Position = vec4(position, 0.0, 1.0);
                pos = position;
            }`;

        // language=glsl
        const fragmentShader = `
            #version 300 es
            ${precisionAndDefaults}
            ${psrdnoise2}

            in vec2 pos;

            uniform float totalFrames;
            uniform float combination;
            uniform vec3 baseColor;
            uniform sampler2D pixels;
            uniform bool announcementActive;
            uniform sampler2D announcement;
            uniform float[24] factors;
            uniform float[2] variance;
            uniform float[4] rotation;
            uniform float moireIntensity;

            out vec4 color;

            void main() {
                vec2 posm = mat2(rotation[0], rotation[1], -rotation[1], rotation[0]) * (pos + vec2(factors[0] * moireIntensity)) * 0.5 + 0.5;
                vec2 posn = mat2(rotation[2], rotation[3], -rotation[3], rotation[2]) * pos * 0.5 + 0.5;
                vec4 mm = texture(pixels, posm.xy) * 0.2;
                vec4 nn = texture(pixels, posn.xy) * 0.2;
                float mmA = (mm.r + mm.g + mm.b) / 3.0;
                float nnA = (nn.r + nn.g + nn.b) / 3.0;

                vec2 gm, gn;
                float m = 0.5 + 0.5 * psrdnoise(variance[0] * 0.2 + posm.xy + mmA + factors[1] * 10000.0, vec2(factors[2] * 10000.0), (mmA + totalFrames + combination) * factors[3] + factors[4], gm);
                float n = 0.5 + 0.5 * psrdnoise(variance[1] * 0.2 * m + posn.xy + nnA + m + factors[5] * 10000.0, vec2(factors[6] * 10000.0), (nnA + totalFrames + combination) * -factors[7] + factors[8], gn);
                vec2 d = (gm - gn) * 0.5 + 0.5;

                if (announcementActive) {
                    vec4 a = texture(announcement, vec2(1.05, -1.05) * posn.xy);
                    color = mix(vec4(m, n, d.x, d.y), a.xxxx * 0.5, 0.1);
                }
                else {
                    color = vec4(m, n, d.x, d.y);
                }
            }`;
        this.program = twgl.createProgramInfo(this.context, [
            vertexShader,
            fragmentShader,
        ]);
        this.buffer = twgl.createBufferInfoFromArrays(this.context, {
            position: {
                data: [-1, 1, 1, 1, 1, -1, 1, -1, -1, -1, -1, 1],
                numComponents: 2,
            },
        });

        this.output = this.piece.outputs.add(
            this.piece.baseHeightWidth,
            this.piece.baseHeightWidth,
            WebGL2RenderingContext.NEAREST
        );

        this.uniform = {
            combination: this.piece.combination * 0.00000001, // based on max glsl float size
            factors: this.piece.features.shiftFactors.map(
                (v) => (v / this.piece.fps) * 0.01
            ),
        };
    }

    private getVariance(factors: number[]) {
        let p = factors.reduce(
            (previousValue, _currentValue, currentIndex) =>
                currentIndex + 1 + previousValue,
            0
        );
        return factors.reduce(
            (previousValue, currentValue, currentIndex) =>
                previousValue +
                ((currentIndex + 1) / p) *
                    Math.cos(
                        Number(this.piece.movingBlocks.totalFrames) *
                            this.piece.speed *
                            currentValue
                    ),
            0
        );
    }

    // 4 : 4,3,2,1 > 10 4/10 + 3/10 + 2/10 + 1/10
    public tick(_timeMs: number) {
        let variance = [
            this.getVariance([
                this.uniform.factors[9],
                this.uniform.factors[10],
                this.uniform.factors[11],
                this.uniform.factors[12],
            ]),
            this.getVariance([
                this.uniform.factors[13],
                this.uniform.factors[14],
                this.uniform.factors[15],
                this.uniform.factors[16],
            ]),
        ];
        let angles = [
            (((this.uniform.factors[17] / 180.0) * variance[0]) /
                this.piece.fps) *
                Math.PI,
            (((this.uniform.factors[18] / 180.0) * variance[1]) /
                this.piece.fps) *
                Math.PI,
        ];
        let rotation = [
            Math.cos(angles[0]),
            Math.sin(angles[0]),
            Math.cos(angles[1]),
            Math.sin(angles[1]),
        ];

        this.context.useProgram(this.program.program);
        twgl.setBuffersAndAttributes(this.context, this.program, this.buffer);
        twgl.setUniforms(this.program, this.uniform);
        twgl.setUniforms(this.program, {
            totalFrames:
                Number(this.piece.movingBlocks.totalFrames) * this.piece.speed,
            variance: variance,
            rotation: rotation,
            pixels: this.piece.pixels.output.attachments[0],
            announcementActive: this.piece.announcement.active,
            announcement: this.piece.announcement
                ? this.piece.announcement.texture
                : 0,
            moireIntensity: this.piece.features.moireIntensity,
            baseColor: this.piece.features.colorRGB,
            combination: this.piece.combination * 0.00000001, // based on max glsl float size
            factors: this.piece.features.shiftFactors.map(
                (v) => (v / this.piece.fps) * 0.01
            ),
        });
        twgl.bindFramebufferInfo(this.context, this.output);
        twgl.drawBufferInfo(this.context, this.buffer);
    }
}

export class Announcement {
    public readonly canvas: HTMLCanvasElement;
    public texture!: WebGLTexture;
    public active: boolean = false;

    public constructor(
        private context: WebGL2RenderingContext,
        private piece: Piece
    ) {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'announcement-canvas';
        this.canvas.width = this.piece.baseHeightWidth;
        this.canvas.height = this.piece.baseHeightWidth;
        document.body.append(this.canvas);
    }

    public async init() {
        let fontFace = new FontFace('VT323', 'url(5cce7f88a9df85a5b977.woff)');
        await fontFace.load();
        document.fonts.add(fontFace);

        this.updateSize(this.piece.baseHeightWidth, this.piece.baseHeightWidth);
    }

    public updateSize(width: number, height: number) {
        this.canvas.width = width;
        this.canvas.height = height;

        let context = this.canvas.getContext('2d') as CanvasRenderingContext2D;

        context.fillStyle = '#ffffff';
        context.translate(this.canvas.width / 2, this.canvas.height / 2);
        context.rotate((-7 / 180) * Math.PI);
        context.textAlign = 'center';
        context.font = '550px VT323';
        context.fillText('Driften', 20, 100);
        context.font = '80px VT323';
        context.fillText('THU 3rd November 2022, 19:00 UTC', 100, 170);
        context.fillText('on fxhash.xyz', -100, 240);

        this.texture = twgl.createTexture(this.context, {
            src: this.canvas,
        });
    }
}

export class Brush {
    static sizeFactor: number = 0.1;
    private program: twgl.ProgramInfo;
    private buffer: twgl.BufferInfo;
    private uniforms: object;
    public output: twgl.FramebufferInfo;

    public constructor(
        private context: WebGL2RenderingContext,
        private piece: Piece
    ) {
        // language=glsl
        const vertexShader = `
            #version 300 es
            ${precisionAndDefaults}

            in vec4 block;
            out vec4 color;

            uniform float pixelSize;
            uniform float blockWidthHeight;

            void main() {
                // ignore inactive ones
                if (block.x == 0.0 && block.y == 0.0 && block.z == 0.0 && block.w == 0.0) {
                    color = vec4(0.5, 0.5, 0.5, 0.0);
                    gl_PointSize = 0.0;
                    gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
                } else {
                    float cols = 2.0;
                    float f = 1.0/cols;
                    vec2 shift = vec2(
                    mod(float(gl_VertexID), cols) - 1.0 / cols,
                    mod(floor(float(gl_VertexID) / cols), cols) - 1.0 / cols
                    );
//                    color = vec4(block.zw * 0.5 + 0.5, mod(float(gl_VertexID), 4.0) / 4.0, 1.0);// convert to color 0-1
//                    color = vec4(0.0, 0.0, 0.0, 1.0);// convert to color 0-1
                    color = vec4(block.zw * 0.5 + 0.5, 0.5, 1.0);// convert to color 0-1
                    gl_PointSize = pixelSize * 1.0 / cols;
                    gl_Position = vec4(
                    (block.x + blockWidthHeight) * f + shift.x,
                    (block.y - blockWidthHeight) * f + shift.y,
                    0.0,
                    1.0
                    );
                }
            }`;

        // language=glsl
        const fragmentShader = `
            #version 300 es
            precision mediump float;

            in vec4 color;
            out vec4 outColor;

            void main() {
                outColor = color;
            }`;

        this.program = twgl.createProgramInfo(this.context, [
            vertexShader,
            fragmentShader,
        ]);

        this.buffer = twgl.createBufferInfoFromArrays(this.context, {
            block: {
                data: this.piece.movingBlocks.data,
                numComponents: 4,
            },
        });

        this.output = this.piece.outputs.add(
            this.piece.baseHeightWidth * Brush.sizeFactor,
            this.piece.baseHeightWidth * Brush.sizeFactor,
            WebGL2RenderingContext.LINEAR
            // WebGL2RenderingContext.NEAREST
        );

        this.uniforms = {
            pixelSize:
                this.piece.features.blockSize *
                this.piece.baseHeightWidth *
                Brush.sizeFactor,
            blockWidthHeight: this.piece.features.blockSize,
        };
    }

    public tick(_timeMs: number) {
        // draw offsets maps - distribute blocks over multiple layers to minimize overlapping / enable multi offset shifts
        this.context.useProgram(this.program.program);
        twgl.setBuffersAndAttributes(this.context, this.program, this.buffer);
        twgl.setAttribInfoBufferFromArray(
            this.context,
            this.buffer.attribs?.block as twgl.AttribInfo,
            this.piece.movingBlocks.data
        );
        twgl.setUniforms(this.program, this.uniforms);

        twgl.bindFramebufferInfo(this.context, this.output);

        this.context.clearColor(0.0, 0.0, 0.0, 0.0);
        this.context.clear(this.context.COLOR_BUFFER_BIT);

        twgl.drawBufferInfo(
            this.context,
            this.buffer,
            WebGL2RenderingContext.POINTS
        );
    }
}

export class Pixels {
    private program: twgl.ProgramInfo;
    private initProgram!: twgl.ProgramInfo;
    private buffer: twgl.BufferInfo;
    public outputIndex: number = 0;
    private uniforms: object;
    public output: twgl.FramebufferInfo;
    private outputs: twgl.FramebufferInfo[];

    public constructor(
        private context: WebGL2RenderingContext,
        private piece: Piece
    ) {
        // init pixels program that applies offset maps to alternating framebuffers
        // language=glsl
        const vertexShader = `
            #version 300 es
            ${precisionAndDefaults}

            in vec2 position;
            out vec2 v_position;

            void main() {
                gl_Position = vec4(position, 0.0, 1.0);
                v_position = position * 0.5 + 0.5;
            }`;

        // language=glsl
        const fragmentShader = `#version 300 es
        ${precisionAndDefaults}
        ${gradientStep}

        in vec2 v_position;
        in vec2 offset;

        out vec4 outColor;

        uniform float totalFrames;
        uniform float speed;
        uniform int step;
        uniform sampler2D pixels;
        uniform sampler2D brush;
        uniform sampler2D noise;
        uniform bool announcementActive;
        uniform sampler2D announcement;
        uniform vec3 baseColor;
        uniform int gradientSteps;
        uniform vec3[6] gradient;
        uniform float gradientLightnessDiff;
        uniform float colorShiftSpeed;
        uniform float colorShiftDir;
        uniform float pixelSize;
        uniform float pixelWidth;
        uniform float pixelHeight;
        uniform float blockSize;
        uniform float movingSpeed;
        uniform float brushIntensity;
        uniform bool debug;
        uniform bool kioskChanging;

        float rollover(float value, float min, float max) {
            if (value > max) {
                return mod(abs(max - value), abs(max - min)) + min;
            }

            if (value < min) {
                return max - mod(abs(value - min), abs(max - min));
            }

            return value;
        }

        vec4 shiftColor(vec4 color, float d) {
            // using alpha for gradient state
            color.a = rollover(color.a + d, 0.0, 1.0);
            vec3 rgb;

            if (gradientSteps == 1) {
                rgb = gradientStep(
                baseColor.rgb,
                gradient[0],
                color.a
                );
            } else if (gradientSteps == 2) {
                rgb = gradientStep(
                baseColor.rgb,
                gradient[0],
                gradient[1],
                color.a
                );
            } else {
                rgb = gradientStep(
                baseColor.rgb,
                gradient[0],
                gradient[1],
                gradient[2],
                gradient[3],
                gradient[4],
                gradient[5],
                color.a
                );
            }

            return vec4(rgb, color.a);
        }

        // todo: cleanup - still: feels like there is some xy rotation shift based on linear > alpha mode
        vec3 getBrushPosShift(vec2 pos, vec2 n) {
            float cols = 2.0;
            float f = 1.0/cols;
            vec2 s = vec2(
            mod(float(step), cols) / cols,
            mod(floor(float(step) / cols), cols) / cols
            );
            // limit to current brush only
//            vec4 posShift = texture(brush, clamp(pos + n, 0.0, 1.0) * f + s);
            vec4 posShift = texture(brush, (pos + n) * f + s);
            
            if (posShift.a == 0.0)
            {
                return vec3(0.0);
            }
            
            // todo: problem is that linear fades color 0.5 to 0.0
            // 0.5 > 0.25 : 0.25 + 0.25 / alpha(0.5)
            // 0.8 > 0.4 : 0.4 + 0.4 / alpha(0.5)
//            posShift = vec4(
//                posShift.x + posShift.x / posShift.a,
//                posShift.y + posShift.y / posShift.a,
//                posShift.zw
//            );
            
            return vec3(vec2(posShift.x, posShift.y) * 2.0 - 1.0, posShift.a);
        }

        vec4 getBrushedColor(vec2 pos, vec2 n, float intensity) {
            if (intensity == 0.0) {
                return texture(pixels, pos);
            }

            vec3 posShift = getBrushPosShift(pos, n);
            
//            posShift = vec2(
//                abs(posShift.x) < 0.1 ? 0.0 : posShift.x,
//                abs(posShift.y) < 0.1 ? 0.0 : posShift.y
//            );
            
//            if (abs(posShift.x) < 0.004 && abs(posShift.y) < 0.004) {
//                return texture(pixels, pos);
//            }

            posShift.xy *= vec2(pixelWidth, pixelHeight) * intensity * posShift.z;
            return texture(pixels, pos - posShift.xy);
        }

        void main() {
            vec2 posShift;
            vec4 color;

            vec4 n = texture(noise, v_position) * 2.0 - 1.0;
            float nMax = max (n.x, n.y);
            float nMin = min (n.x, n.y);

            float colorShiftBoost = abs(nMin) * colorShiftSpeed * colorShiftDir * speed;

            if (debug) {
                vec3 posShiftDebug = getBrushPosShift(v_position, n.xy);
//                outColor = vec4(posShift.rg, 1.0, 1.0);
                outColor = vec4(posShiftDebug.xy * 0.5 + 0.5, 0.0, 1.0);
                return;
            }

            if (kioskChanging) {
                color = texture(pixels, v_position);
                outColor = shiftColor(color, color.a);
                return;
            }
            
            if (nMin < 0.0) {
                if (step == 0) {
                    // use noise gradient vector to shift (only on first)
                    posShift = n.zw * vec2(pixelWidth, pixelHeight) * (1.0 + colorShiftBoost * movingSpeed);
//                    posShift = vec2(0.0);
                    color = texture(pixels, v_position - posShift * speed);
                    if (nMax > gradientLightnessDiff) {
                        color = shiftColor(color, abs(nMax) * colorShiftDir * colorShiftSpeed * speed + colorShiftBoost);
                    }
                }
                else {
                    // use brush to shift
                    color = getBrushedColor(v_position, n.xy, brushIntensity);
                }
            } else {
                if (nMax > gradientLightnessDiff) {
                    // reset gradient state in alpha
                    color = vec4(baseColor, 0.0);
                } else {
                    // use brush to shift
                    color = getBrushedColor(v_position, n.xy, brushIntensity);
                }
                color = shiftColor(color, abs(nMax) * colorShiftDir * colorShiftSpeed * speed + colorShiftBoost);
            }

            if (announcementActive) {
                vec4 a = texture(announcement, v_position * vec2(1.0, -1.0) + vec2(0.002, -0.002));
                if (a.a > 0.0) {
                    color = vec4(colorShiftDir < 0.0 ? gradient[gradientSteps-1] : gradient[0], 0.0);
                }
                vec4 as = texture(announcement, v_position * vec2(1.0, -1.0));
                if (as.a > 0.0) {
                    color = vec4(colorShiftDir < 0.0 ? baseColor : gradient[gradientSteps-1], 0.0);
                }
            }

            outColor = color;
        }`;

        this.outputIndex = 0;
        this.program = twgl.createProgramInfo(this.context, [
            vertexShader,
            fragmentShader,
        ]);

        this.buffer = twgl.createBufferInfoFromArrays(this.context, {
            position: {
                data: [-1, 1, 1, 1, 1, -1, 1, -1, -1, -1, -1, 1],
                numComponents: 2,
            },
        });

        this.outputs = [
            this.piece.outputs.add(
                this.piece.baseHeightWidth,
                this.piece.baseHeightWidth,
                WebGL2RenderingContext.NEAREST
            ),
            this.piece.outputs.add(
                this.piece.baseHeightWidth,
                this.piece.baseHeightWidth,
                WebGL2RenderingContext.NEAREST
            ),
        ];
        this.output = this.outputs[this.outputIndex];
        this.colorizeOutput();

        this.uniforms = {
            noise: this.piece.noise.output.attachments[0],
            brush: this.piece.brush.output.attachments[0],
        };
    }

    private colorizeOutput() {
        // colorize framebuffer that are used for moving pixel
        // language=glsl
        const vertexShader = `
            #version 300 es
            ${precisionAndDefaults}

            in vec2 position;

            void main() {
                gl_Position = vec4(position, 0.0, 1.0);
            }`;
        // language=glsl
        const fragmentShader = `
            #version 300 es
            ${precisionAndDefaults}

            uniform vec3 baseColor;

            out vec4 color;

            void main() {
                color = vec4(baseColor, 0.0);
            }`;

        this.initProgram = twgl.createProgramInfo(this.context, [
            vertexShader,
            fragmentShader,
        ]);

        this.context.useProgram(this.initProgram.program);
        twgl.setBuffersAndAttributes(this.context, this.program, this.buffer);
        twgl.setUniforms(this.initProgram, {
            baseColor: this.piece.features.colorRGB,
        });

        twgl.bindFramebufferInfo(this.context, this.output);
        twgl.drawBufferInfo(this.context, this.buffer);
    }

    public tick(_timeMs: number) {
        // draw moving pixels based on offset layers - toggle pixel buffers per layer
        this.context.useProgram(this.program.program);
        twgl.setBuffersAndAttributes(this.context, this.program, this.buffer);

        twgl.setUniforms(this.program, this.uniforms);

        for (let i = 0; i < 2; i++) {
            twgl.setUniforms(this.program, {
                pixels: this.outputs[this.outputIndex].attachments[0],
                announcementActive: this.piece.announcement.active,
                announcement: this.piece.announcement
                    ? this.piece.announcement.texture
                    : 0,
                baseColor: this.piece.features.colorRGB,
                gradient: this.piece.features.gradientRGBFlat,
                gradientLightnessDiff:
                    this.piece.features.gradientLightnessDiff,
                pixelSize:
                    (this.piece.features.blockSize /
                        this.piece.features.gridSize) *
                    this.piece.baseHeightWidth,
                pixelWidth: 1 / this.piece.baseHeightWidth,
                pixelHeight: 1 / this.piece.baseHeightWidth,
                blockSize: this.piece.features.blockSize,
                gradientSteps: this.piece.features.gradientSteps,
                colorShiftSpeed: this.piece.features.colorShiftSpeed / 255,
                colorShiftDir: this.piece.features.colorShiftDirection,
                movingSpeed: this.piece.features.movingSpeed,
                brushIntensity: this.piece.features.brushIntensity,
                totalFrames:
                    Number(this.piece.movingBlocks.totalFrames) /
                    this.piece.speed,
                speed: this.piece.speed,
                step: i,
                debug: this.piece.debug,
                kioskChanging: this.piece.kiosk.changing,
            });

            twgl.bindFramebufferInfo(
                this.context,
                this.outputs[1 - this.outputIndex]
            );

            twgl.drawBufferInfo(this.context, this.buffer);

            this.outputIndex = 1 - this.outputIndex;
            this.output = this.outputs[this.outputIndex];
        }
    }
}

export class Screen {
    private program: twgl.ProgramInfo;
    private buffer: twgl.BufferInfo;

    public constructor(
        private context: WebGL2RenderingContext,
        private piece: Piece
    ) {
        // language=glsl
        const vertexShader = `
            #version 300 es
            ${precisionAndDefaults}

            in vec2 position;
            out vec2 pos;

            void main() {
                gl_Position = vec4(position, 0.0, 1.0);
                pos = 0.5 * (position + 1.0);
            }`;

        // language=glsl
        const fragmentShader = `
            #version 300 es
            ${precisionAndDefaults}

            in vec2 pos;
            out vec4 color;

            uniform sampler2D pixels;
            uniform bool debug;

            void main() {
                if (debug == true) {
                    color = texture(pixels, pos);
                } else {
                    color = vec4(texture(pixels, pos).rgb, 1.0);
                }
            }`;
        this.program = twgl.createProgramInfo(this.context, [
            vertexShader,
            fragmentShader,
        ]);

        this.buffer = twgl.createBufferInfoFromArrays(this.context, {
            position: {
                data: [-1, 1, 1, 1, 1, -1, 1, -1, -1, -1, -1, 1],
                numComponents: 2,
            },
        });
    }

    public tick(_timeMs: number) {
        // draw the latest pixel or selected debug buffer to canvas
        this.context.useProgram(this.program.program);
        twgl.setBuffersAndAttributes(this.context, this.program, this.buffer);

        if (this.piece.outputIndex === null) {
            twgl.setUniforms(this.program, {
                pixels: this.piece.pixels.output.attachments[0],
                debug: false,
            });
        } else {
            twgl.setUniforms(this.program, {
                pixels: this.piece.outputs.buffers[this.piece.outputIndex]
                    .attachments[0],
                debug: true,
            });
        }
        twgl.bindFramebufferInfo(this.context, null);
        twgl.drawBufferInfo(this.context, this.buffer);
    }
}

export class Piece {
    public features!: Features;

    public static defaultPixelRatio: number = 2.0;
    public static defaultSpeed: number = 1.0;

    public width: number = 0;
    public height: number = 0;
    public baseHeightWidth: number = 1980;
    public fps: number = 60;

    public canvas: HTMLCanvasElement;
    public context!: WebGL2RenderingContext;

    public movingBlocks!: MovingBlocks;

    public cycleGradient!: CycleGradient;

    public combination: number;

    public inPreviewPhase!: boolean;
    public previewPhaseEndsAfterBase: number = 400;
    public previewPhaseEndsAfter!: number;

    public paused: boolean = false;

    public outputs!: Outputs;
    public outputIndex: number | null = null;

    public noise!: Noise;
    public brush!: Brush;
    public pixels!: Pixels;
    public screen!: Screen;

    public announcement!: Announcement;

    public kiosk!: Kiosk;

    private initWebglDone: boolean = false;

    public debug: boolean = false;

    public constructor(
        canvas: HTMLCanvasElement,
        width: number,
        height: number,
        combination: number,
        public autoPause: boolean = true,
        public pixelRatio: number = Piece.defaultPixelRatio,
        announcementActive: boolean = false,
        cycleGradientSpeed: number | null = null,
        public speed: number = 1.0,
        public kioskSpeed: number | null = null
    ) {
        this.canvas = canvas;
        this.combination = combination;

        randInit(window.fxhash);

        this.features = new Features(this.combination);
        this.inPreviewPhase = true;
        this.paused = false;

        this.movingBlocks = new MovingBlocks(this);
        this.movingBlocks.init();

        this.cycleGradient = new CycleGradient(this);
        this.cycleGradient.setSpeed(cycleGradientSpeed);

        this.kiosk = new Kiosk(this);
        this.kiosk.setSpeed(kioskSpeed);

        this.init(announcementActive);

        this.updateSize(width, height, pixelRatio);
    }

    private async init(announcementActive: boolean) {
        if (this.context instanceof WebGL2RenderingContext) {
            return;
        }

        this.initWebglDone = false;

        this.context = twgl.getContext(this.canvas, {
            depth: false,
            preserveDrawingBuffer: true,
            premultipliedAlpha: false,
        }) as WebGL2RenderingContext;

        if (!twgl.isWebGL2(this.context)) {
            console.error(
                'A webgl2 enabled browser is required to view this piece.'
            );
            let div = document.createElement('div');
            div.id = 'error';
            div.innerText =
                'A webgl2 enabled browser is required to view this piece.';
            document.body.prepend(div);
            this.paused = true;
            return;
        }

        this.canvas.addEventListener('webglcontextlost', (_event) => {
            console.error('Lost the webgl context. Please reload.');
            let div = document.createElement('div');
            div.id = 'error';
            div.innerText = 'Lost the webgl context. Please reload.';
            document.body.prepend(div);
            this.paused = true;
        });

        this.announcement = new Announcement(this.context, this);
        await this.announcement.init();

        this.announcement.active = announcementActive;

        this.outputs = new Outputs(this.context);

        this.noise = new Noise(this.context, this);
        this.brush = new Brush(this.context, this);
        this.pixels = new Pixels(this.context, this);
        this.screen = new Screen(this.context, this);

        this.initWebglDone = true;
    }

    public updateSize(
        width: number,
        height: number,
        pixelRatio: number | null = null
    ) {
        if (pixelRatio === null) {
            pixelRatio = Piece.defaultPixelRatio;
        }
        this.pixelRatio = pixelRatio;
        this.previewPhaseEndsAfter = this.previewPhaseEndsAfterBase;
        this.width = width * this.pixelRatio;
        this.height = height * this.pixelRatio;

        this.canvas.dispatchEvent(new Event('piece.updateSize'));

        this.context.canvas.width = this.width;
        this.context.canvas.height = this.height;
        this.context.viewport(
            0,
            0,
            this.context.canvas.width,
            this.context.canvas.height
        );

        this.initBackground();
    }

    public initBackground() {
        document.body.style.backgroundColor = this.features.colorCSS;
    }

    public tick(timeMs: number) {
        if (!this.initWebglDone) {
            return;
        }

        this.tickCaptureImage();

        this.cycleGradient.tick(timeMs);
        this.movingBlocks.tick(timeMs);

        if (!this.paused) {
            this.brush.tick(timeMs);
            this.noise.tick(timeMs);
            this.pixels.tick(timeMs);
        }

        this.kiosk.tick(timeMs);

        this.screen.tick(timeMs);

        if (
            this.inPreviewPhase &&
            this.movingBlocks.totalFrames >= this.previewPhaseEndsAfter
        ) {
            this.inPreviewPhase = false;
            this.paused = this.autoPause;
        }
    }

    private captureImageName: string | null = null;

    public captureImage(name: string) {
        this.captureImageName = name;
    }

    private tickCaptureImage() {
        if (this.captureImageName === null) {
            return;
        }

        let name = this.captureImageName;
        this.captureImageName = null;

        this.context.canvas.toBlob((blob) => {
            if (blob === null) {
                return;
            }
            const a = document.createElement('a');
            document.body.appendChild(a);
            a.style.display = 'none';
            a.href = window.URL.createObjectURL(blob);
            a.download = name;
            a.click();
        });
    }

    public preparePreviewCanvas(): HTMLCanvasElement {
        let previewCanvas = document.createElement('canvas');
        previewCanvas.id = 'preview-canvas';
        let resizedContext = previewCanvas.getContext(
            '2d'
        ) as CanvasRenderingContext2D;

        previewCanvas.height = Math.floor(
            this.height * (this.pixelRatio < 1 ? 1 : this.pixelRatio)
        );
        previewCanvas.width = Math.floor(
            this.width * (this.pixelRatio < 1 ? 1 : this.pixelRatio)
        );

        resizedContext?.drawImage(
            this.context.canvas,
            0,
            0,
            previewCanvas.width,
            previewCanvas.height
        );

        return previewCanvas;
    }
}

export class Kiosk {
    private intervalId!: NodeJS.Timer;
    public changing: boolean = false;
    private _speedSec: number | null = null;
    public constructor(public piece: Piece) {}

    public setSpeed(speedSec: number | null) {
        this._speedSec = speedSec;
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
        if (speedSec) {
            this.intervalId = setInterval(() => {
                if (this.piece.paused) {
                    return;
                }
                this.change();
            }, 1000 * speedSec);
        }
    }

    public tick(_timeMs: number) {
        if (this.changing && !this.piece.paused) {
            this.changing = false;
        }
    }

    public change() {
        this.changing = true;
        this.piece.features = new Features(randInt(Features.combinations));
        this.piece.cycleGradient.init();
    }

    public get active(): boolean {
        return this.speedSec !== null;
    }

    public get speedSec(): number | null {
        return this._speedSec;
    }
}
export class CycleGradient {
    public frames: bigint = BigInt(0);
    public shiftStep: number = 0;
    public shiftStepNormalized: number = 0;
    private _speed: number | null = null;
    private gradient!: LCH[];
    private readonly gradientStepsFactor: number = 100;

    public constructor(private piece: Piece) {
        this.init();
    }

    public setSpeed(speed: number | null) {
        this._speed = speed;
    }

    public get speed(): number | null {
        return this._speed;
    }

    public get active(): boolean {
        return this._speed !== null;
    }

    public init() {
        let gradientStops = this.piece.features.baseGradient.map((c, index) => [
            index / this.piece.features.baseGradient.length,
            srgb(c),
        ]) as GradientColorStop<any>;
        gradientStops.push([1, srgb(this.piece.features.color)]);
        this.gradient = multiColorGradient({
            num:
                this.piece.features.baseGradient.length *
                this.gradientStepsFactor,
            stops: gradientStops,
        }).map((c) => lch(c));
    }

    public tick(_timeMs: number) {
        if (this._speed == null) {
            return;
        }

        if (this.piece.paused) {
            return;
        }

        this.frames++;

        let f = Math.floor(
            (Number(this.frames) / this.piece.fps) *
                this.piece.speed *
                this._speed
        );

        let fm =
            f %
            (this.piece.features.baseGradient.length *
                this.gradientStepsFactor);

        if (this.shiftStep != fm) {
            this.gradient.push(this.gradient.shift() as LCH);
            let gradient = this.gradient.filter(
                (_v, index) => index % 100 === 0
            );
            this.piece.features.updateColor(gradient.shift() as LCH, gradient);
        }
        this.shiftStep = fm;
        this.shiftStepNormalized =
            fm /
            (this.piece.features.baseGradient.length *
                this.gradientStepsFactor);
    }
}

export class MovingBlocks {
    public totalFrames: bigint = BigInt(0);
    public blocks: Array<MovingBlock> = [];
    public count: number = 0;
    public total: bigint = BigInt(0);
    private piece: Piece;
    public data!: Float32Array;

    public constructor(piece: Piece) {
        this.piece = piece;
        this.init();
    }

    public tick(_timeMs: number) {
        if (this.piece.paused) {
            return;
        }
        this.totalFrames++;

        this.count = this.blocks.reduce(
            (c, block) => (block.tick() ? c + 1 : c),
            0
        );
        this.total += BigInt(this.piece.features.maxMovingBlocks - this.count);
    }

    private add(): void {
        this.blocks.push(
            new MovingBlock(this.blocks.length, this.data, this.piece)
        );
        this.total++;
    }

    public init(): void {
        this.blocks = [];
        this.count = 0;
        this.total = BigInt(0);
        this.data = new Float32Array(
            this.piece.features.maxMovingBlocks * MovingBlock.dataPoints
        );

        do {
            this.add();
        } while (this.blocks.length < this.piece.features.maxMovingBlocks);
    }
}

export class MovingBlock {
    public static dataPoints: number = 4;
    private dataIndex: number;
    public active: boolean = false;
    public area!: Area;
    public dirX: number = 0;
    public dirY: number = 0;
    public dirFactor: number = 0.02;
    public dirXn: number = 0;
    public dirYn: number = 0;
    public shapeX: number = 0;
    public shapeY: number = 0;

    public constructor(
        public index: number,
        public data: Float32Array,
        public readonly piece: Piece
    ) {
        this.piece = piece;
        this.dataIndex = index * MovingBlock.dataPoints;
    }

    public activate() {
        this.shapeX = 0;
        this.shapeY = 0;

        this.area = {
            x:
                rand() *
                (this.piece.features.gridSize - this.piece.features.blockSize),
            y:
                rand() *
                (this.piece.features.gridSize - this.piece.features.blockSize),
            w: this.piece.features.blockSize,
            h: this.piece.features.blockSize,
        };

        this.dirX = 0;
        this.dirY = 0;
        this.dirXn = 0;
        this.dirYn = 0;

        let move = randOptions(this.piece.features.movingDirections);
        if (move.includes('up')) {
            this.dirY -=
                this.piece.features.movingSpeed *
                this.piece.features.blockSize *
                this.dirFactor;
            this.dirYn += 1;
        }
        if (move.includes('down')) {
            this.dirY +=
                this.piece.features.movingSpeed *
                this.piece.features.blockSize *
                this.dirFactor;
            this.dirYn -= 1;
        }
        if (move.includes('left')) {
            this.dirX -=
                this.piece.features.movingSpeed *
                this.piece.features.blockSize *
                this.dirFactor;
            this.dirXn -= 1;
        }
        if (move.includes('right')) {
            this.dirX +=
                this.piece.features.movingSpeed *
                this.piece.features.blockSize *
                this.dirFactor;
            this.dirXn += 1;
        }

        this.updateData();

        this.active = true;
    }

    private updateData() {
        this.data[this.dataIndex] = this.area.x * 2.0 - 1.0;
        this.data[this.dataIndex + 1] = 2.0 - this.area.y * 2.0 - 1.0;
        this.data[this.dataIndex + 2] = this.dirXn; // -1 / 1
        this.data[this.dataIndex + 3] = this.dirYn; // -1 / 1
    }

    public deactivate() {
        this.data[this.dataIndex] = 0.0;
        this.data[this.dataIndex + 1] = 0.0;
        this.data[this.dataIndex + 2] = 0.0;
        this.data[this.dataIndex + 3] = 0.0;

        this.active = false;
    }

    public tick(): boolean {
        if (!this.active) {
            this.activate();
        }

        let sx: number = this.area.x + this.dirX;
        let sy: number = this.area.y + this.dirY;

        if (!this.intersectsWithDrawingArea(sx, sy, this.area.w, this.area.h)) {
            this.deactivate();
            return false;
        }

        this.area.x = sx;
        this.area.y = sy;

        this.updateData();

        return true;
    }

    private intersectsWithDrawingArea(
        x: number,
        y: number,
        w: number,
        h: number
    ) {
        return isec.testRectCircle(
            [x + w / 2, y + h / 2],
            [w / 2, h / 2],
            [0.5, 0.5],
            Math.min(1.0 - w * 2, 1.0 - h * 2) / 2
        );
    }
}
