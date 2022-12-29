import {
    rand,
    randInit,
    randInt,
    randOptions,
    randShuffle,
    randSkip,
} from './rand';
import { colors } from './colors';
import * as twgl from 'twgl.js';
import { AttachmentOptions, m4 } from 'twgl.js';
import { css, lch, LCH, mix, srgb, TypedColor } from '@thi.ng/color';
import { bayerDither, precisionAndDefaults } from './glsl';
import {
    combinationFn,
    featureNumber,
    features,
    featureSet,
    variation,
} from './combinations';
import { clamp01, mod } from '@thi.ng/math';
import { getEnumValues } from './enum';

export type FxhashFeatures = {
    palette: string;
    colorSortDirection: string;
    colorSortReference: string;
    shapes: string;
};

type FeaturesType = {
    palette: variation<Array<string>>;
    colorSortDirection: variation<boolean>;
    colorSortReference: variation<number>;
    shapes: variation<Array<number>>;
};

export const logColor = (c: TypedColor<any>, msg: string = '') =>
    console.log(
        `%c${msg}       ${css(c)}`,
        `background-color: ${css(c)}; color:#ffffff; padding: 2px;`
    );

export class RandomBayerMatrix {
    public matrix!: number[];

    public constructor(public x: number, public y: number) {
        this.init();
    }

    public init() {
        this.matrix = randShuffle(
            Array(this.x * this.y)
                .fill(1)
                .map((_v, i) => i)
        );

        // alternative: low/high randomized stack mixing
        // let b = Math.floor((this.x * this.y) / 2);
        // let source: number[][] = [
        //     randShuffle(
        //         Array(b)
        //             .fill(0)
        //             .map((b, i) => b + i)
        //     ),
        //     randShuffle(
        //         Array(b)
        //             .fill(b + 1)
        //             .map((b, i) => b + i)
        //     ),
        // ];
        // let t = 0;
        // this.matrix = [];
        // for (let i = 0; i < this.y; i++) {
        //     for (let j = 0; j < this.x; j++) {
        //         this.matrix.push(source[t].pop() as number);
        //         t = 1 - t;
        //     }
        //     t = 1 - t;
        // }
    }
}

export enum ColorType {
    BACKGROUND,
    TOP,
    BOTTOM,
    EVEN,
    ODD,
    SPECIAL,
    ANNOUNCE = BOTTOM,
}

export class Features {
    public variation: variation<FeaturesType>;
    public static variations: combinationFn<FeaturesType> = features('piece', [
        featureSet<boolean>(
            'colorSortDirection',
            [false, true],
            ['up', 'down']
        ),
        featureNumber('colorSortReference', 3),
        featureSet<Array<string>>(
            'palette',
            Object.values(colors),
            Object.keys(colors)
        ),
        featureSet<Array<number>>(
            'shapes',
            [
                [0, 0, 0, 1, 2, 3, 4, 5, 5, 5],
                [0, 1, 1, 1, 2, 3, 4, 5, 5, 5],
                [0, 1, 2, 2, 2, 3, 4, 5, 5, 5],
            ],
            ['more l', 'more m', 'more s']
        ),
    ]);

    public static combinations: number =
        Features.variations(0).numberOfVariations;

    public combination: number = 0;

    public colors: LCH[] = [];
    public colorsCSS: string[] = [];
    public colorsRGB: number[][] = [];

    public ditherMatrix: RandomBayerMatrix;

    public constructor(combination: number) {
        this.combination = combination % Features.combinations;

        this.variation = Features.variations(combination);

        let colors: Array<string> = this.variation.value.palette.value;

        // ignore yellow-red hue 0 to 0.25 (there is a lot of them anyway)
        let hAverage =
            colors
                .map((c: string) => lch(srgb(c)).h)
                .reduce((pv, cv) => pv + (cv < 0.25 ? 1 : cv)) / colors.length;

        let co: LCH[] = colors
            .map((c: string) => lch(srgb(c)))
            .sort((a, b) => {
                switch (this.variation.value.colorSortReference.value) {
                    // sort by darker more colorful to lighter less colorful
                    case 1:
                        return a.l * 0.4 + a.c * 0.6 < b.l * 0.4 + b.c * 0.6
                            ? -1
                            : 1;
                    // sort by higher hue, cut at hue average ignoring yellow-red colors
                    case 2:
                        return mod(a.h - hAverage, 1.0) >
                            mod(b.h - hAverage, 1.0)
                            ? -1
                            : 1;
                    // sort by lighter more colorful to darker less colorful
                    case 0:
                    default:
                        return (1 - a.l) * 0.4 + a.c * 0.6 <
                            (1 - b.l) * 0.4 + b.c * 0.6
                            ? -1
                            : 1;
                }
            });
        if (!this.variation.value.colorSortDirection.value) {
            co = co.reverse();
        }
        co.forEach((c, i) => this.updateColor(i as ColorType, c));

        this.ditherMatrix = new RandomBayerMatrix(6, 6);
        this.log();
    }

    public updateColor(type: ColorType, c: LCH) {
        this.colors[type] = c;
        this.colorsCSS[type] = css(c);
        this.colorsRGB[type] = srgb(c)
            .buf.slice(0, 4)
            .map((v) => clamp01(v)) as number[];
    }

    public getFxhashFeatures(): FxhashFeatures {
        return {
            ...Object.fromEntries(
                Object.values(this.variation.value).map((v) => [
                    v.name.replace(/([A-Z])/g, ' $1').toLowerCase(),
                    v.label,
                ])
            ),
        } as FxhashFeatures;
    }

    public getFeatureName(): string {
        return (
            [
                Piece.title.toLowerCase(),
                ...Object.values(this.getFxhashFeatures()),
                this.combination,
                window.fxhash,
            ]
                .join('-')
                .replace(/\s+#/g, '') + '.png'
        );
    }

    public log() {
        console.info(
            `combination: ${this.combination} / ${Features.combinations}`
        );
        Object.entries(this.getFxhashFeatures()).forEach((entry) =>
            console.info(`${entry[0]}: ${entry[1]}`)
        );
        this.colors.forEach((c, i) =>
            logColor(
                c,
                ['background', 'top', 'bottom', 'odd', 'even', 'special'][i]
            )
        );
    }
}

export class Outputs {
    public readonly buffers: twgl.FramebufferInfo[];

    constructor(private context: WebGL2RenderingContext) {
        this.buffers = [];
    }

    public create(
        width?: number,
        height?: number,
        attachments?: Array<AttachmentOptions>
    ): twgl.FramebufferInfo {
        let buffer = twgl.createFramebufferInfo(
            this.context,
            attachments,
            width,
            height
        );
        this.buffers.push(buffer);

        return buffer;
    }

    public add(
        width: number,
        height: number,
        filter: GLenum
    ): twgl.FramebufferInfo {
        return this.create(width, height, [
            {
                attachmentPoint: WebGL2RenderingContext.COLOR_ATTACHMENT0,
                format: WebGL2RenderingContext.RGBA,
                type: WebGL2RenderingContext.UNSIGNED_BYTE,
                min: filter,
                mag: filter,
                wrap: WebGL2RenderingContext.CLAMP_TO_EDGE,
            },
        ]);
    }
}

export class BlobTextures {
    public textures: {
        [key: string]: WebGLTexture;
    };

    public constructor(
        private context: WebGL2RenderingContext,
        private piece: Piece
    ) {
        this.textures = twgl.createTextures(this.context, {
            0: {
                internalFormat: WebGL2RenderingContext.RGBA,
                format: WebGL2RenderingContext.RGBA,
                type: WebGL2RenderingContext.UNSIGNED_BYTE,
                minMag: WebGL2RenderingContext.NEAREST,
                wrap: WebGL2RenderingContext.MIRRORED_REPEAT,
                src: [
                    ...this.piece.features.colorsRGB[ColorType.BOTTOM].map(
                        (v) => Math.floor(v * 255)
                    ),
                    ...this.piece.features.colorsRGB[ColorType.TOP]
                        .slice(0, 3)
                        .map((v) => Math.floor(v * 255)),
                    (rand() * 0.2 + 0.5) * 255,
                    ...this.piece.features.colorsRGB[ColorType.BOTTOM].map(
                        (v) => Math.floor(v * 255)
                    ),
                ],
            },
            1: {
                internalFormat: WebGL2RenderingContext.RGBA,
                format: WebGL2RenderingContext.RGBA,
                type: WebGL2RenderingContext.UNSIGNED_BYTE,
                minMag: WebGL2RenderingContext.NEAREST,
                wrap: WebGL2RenderingContext.MIRRORED_REPEAT,
                src: [
                    ...this.piece.features.colorsRGB[ColorType.ODD]
                        .slice(0, 3)
                        .map((v) => Math.floor(v * 255)),
                    (rand() * 0.2 + 0.8) * 255,
                ],
            },
            2: {
                internalFormat: WebGL2RenderingContext.RGBA,
                format: WebGL2RenderingContext.RGBA,
                type: WebGL2RenderingContext.UNSIGNED_BYTE,
                minMag: WebGL2RenderingContext.NEAREST,
                wrap: WebGL2RenderingContext.MIRRORED_REPEAT,
                src: [
                    ...this.piece.features.colorsRGB[ColorType.BACKGROUND]
                        .slice(0, 3)
                        .map((v) => Math.floor(v * 255)),
                    (rand() * 0.2 + 0.4) * 255,
                    ...this.piece.features.colorsRGB[ColorType.TOP].map((v) =>
                        Math.floor(v * 255)
                    ),
                    ...this.piece.features.colorsRGB[ColorType.BACKGROUND]
                        .slice(0, 3)
                        .map((v) => Math.floor(v * 255)),
                    (rand() * 0.2 + 0.4) * 255,
                ],
            },
            3: {
                internalFormat: WebGL2RenderingContext.RGBA,
                format: WebGL2RenderingContext.RGBA,
                type: WebGL2RenderingContext.UNSIGNED_BYTE,
                wrap: WebGL2RenderingContext.MIRRORED_REPEAT,
                src: [
                    ...this.piece.features.colorsRGB[ColorType.BOTTOM]
                        .slice(0, 3)
                        .map((v) => Math.floor(v * 255)),
                    1 * 255,
                ],
            },
            4: {
                internalFormat: WebGL2RenderingContext.RGBA,
                format: WebGL2RenderingContext.RGBA,
                type: WebGL2RenderingContext.UNSIGNED_BYTE,
                wrap: WebGL2RenderingContext.MIRRORED_REPEAT,
                src: [
                    ...this.piece.features.colorsRGB[ColorType.TOP]
                        .slice(0, 3)
                        .map((v) => Math.floor(v * 255)),
                    1 * 255,
                ],
            },
            5: {
                internalFormat: WebGL2RenderingContext.RGBA,
                format: WebGL2RenderingContext.RGBA,
                type: WebGL2RenderingContext.UNSIGNED_BYTE,
                minMag: WebGL2RenderingContext.NEAREST,
                wrap: WebGL2RenderingContext.MIRRORED_REPEAT,
                width: 100,
                height: 100,
                src: Array(100 * 100)
                    .fill(1)
                    .map((_v, i) =>
                        i % 3 != 0
                            ? [
                                  ...this.piece.features.colorsRGB[
                                      ColorType.TOP
                                  ].slice(0, 3),
                                  rand() * 0.6 + 0.2,
                              ]
                            : [
                                  ...this.piece.features.colorsRGB[
                                      ColorType.BOTTOM
                                  ].slice(0, 3),
                                  0.9,
                              ]
                    )
                    .flat()
                    .map((v) => Math.floor(v * 255)),
            },
            6: {
                internalFormat: WebGL2RenderingContext.RGBA,
                format: WebGL2RenderingContext.RGBA,
                type: WebGL2RenderingContext.UNSIGNED_BYTE,
                minMag: WebGL2RenderingContext.NEAREST,
                wrap: WebGL2RenderingContext.MIRRORED_REPEAT,
                width: 200,
                height: 200,
                src: Array(200 * 200)
                    .fill(1)
                    .map((_v, i) =>
                        i % 3 != 0
                            ? [
                                  ...this.piece.features.colorsRGB[
                                      ColorType.ODD
                                  ].slice(0, 3),
                                  rand() * 0.6 + 0.2,
                              ]
                            : [
                                  ...this.piece.features.colorsRGB[
                                      ColorType.EVEN
                                  ].slice(0, 3),
                                  0.9,
                              ]
                    )
                    .flat()
                    .map((v) => Math.floor(v * 255)),
            },
            7: {
                internalFormat: WebGL2RenderingContext.RGBA,
                format: WebGL2RenderingContext.RGBA,
                type: WebGL2RenderingContext.UNSIGNED_BYTE,
                minMag: WebGL2RenderingContext.NEAREST,
                wrap: WebGL2RenderingContext.MIRRORED_REPEAT,
                src: [
                    ...this.piece.features.colorsRGB[ColorType.ODD]
                        .slice(0, 3)
                        .map((v) => Math.floor(v * 255)),
                    (rand() * 0.6 + 0.2) * 255,
                    ...this.piece.features.colorsRGB[ColorType.TOP].map((v) =>
                        Math.floor(v * 255)
                    ),
                    ...this.piece.features.colorsRGB[ColorType.ODD]
                        .slice(0, 3)
                        .map((v) => Math.floor(v * 255)),
                    (rand() * 0.6 + 0.2) * 255,
                ],
            },
            8: {
                internalFormat: WebGL2RenderingContext.RGBA,
                format: WebGL2RenderingContext.RGBA,
                type: WebGL2RenderingContext.UNSIGNED_BYTE,
                minMag: WebGL2RenderingContext.NEAREST,
                wrap: WebGL2RenderingContext.MIRRORED_REPEAT,
                width: 300,
                height: 300,
                src: Array(300 * 300)
                    .fill(1)
                    .map((_v, i) =>
                        i % 3 != 0
                            ? [
                                  ...this.piece.features.colorsRGB[
                                      ColorType.BACKGROUND
                                  ].slice(0, 3),
                                  rand() * 0.6 + 0.2,
                              ]
                            : [
                                  ...this.piece.features.colorsRGB[
                                      ColorType.BOTTOM
                                  ].slice(0, 3),
                                  0.95,
                              ]
                    )
                    .flat()
                    .map((v) => Math.floor(v * 255)),
            },
            9: {
                internalFormat: WebGL2RenderingContext.RGBA,
                format: WebGL2RenderingContext.RGBA,
                type: WebGL2RenderingContext.UNSIGNED_BYTE,
                wrap: WebGL2RenderingContext.MIRRORED_REPEAT,
                src: [
                    ...this.piece.features.colorsRGB[ColorType.EVEN]
                        .slice(0, 3)
                        .map((v) => Math.floor(v * 255)),
                    1 * 255,
                ],
            },
            10: {
                internalFormat: WebGL2RenderingContext.RGBA,
                format: WebGL2RenderingContext.RGBA,
                type: WebGL2RenderingContext.UNSIGNED_BYTE,
                minMag: WebGL2RenderingContext.NEAREST,
                wrap: WebGL2RenderingContext.MIRRORED_REPEAT,
                width: 100,
                height: 200,
                src: Array(100 * 200)
                    .fill(1)
                    .map((_v, i) =>
                        i % 5 != 0
                            ? [
                                  ...this.piece.features.colorsRGB[
                                      ColorType.BOTTOM
                                  ].slice(0, 3),
                                  rand() * 0.8 + 0.2,
                              ]
                            : [
                                  ...this.piece.features.colorsRGB[
                                      ColorType.ODD
                                  ].slice(0, 3),
                                  0.95,
                              ]
                    )
                    .flat()
                    .map((v) => Math.floor(v * 255)),
            },
            11: {
                internalFormat: WebGL2RenderingContext.RGBA,
                format: WebGL2RenderingContext.RGBA,
                type: WebGL2RenderingContext.UNSIGNED_BYTE,
                minMag: WebGL2RenderingContext.NEAREST,
                wrap: WebGL2RenderingContext.MIRRORED_REPEAT,
                width: 100,
                height: 100,
                src: Array(100 * 100)
                    .fill(1)
                    .map((_v, i) =>
                        i % 5 != 0
                            ? [
                                  ...this.piece.features.colorsRGB[
                                      ColorType.TOP
                                  ].slice(0, 3),
                                  rand() * 0.2 + 0.5,
                              ]
                            : [
                                  ...this.piece.features.colorsRGB[
                                      ColorType.BACKGROUND
                                  ].slice(0, 3),
                                  0.95,
                              ]
                    )
                    .flat()
                    .map((v) => Math.floor(v * 255)),
            },
            12: {
                internalFormat: WebGL2RenderingContext.RGBA,
                format: WebGL2RenderingContext.RGBA,
                type: WebGL2RenderingContext.UNSIGNED_BYTE,
                wrap: WebGL2RenderingContext.MIRRORED_REPEAT,
                src: [
                    ...this.piece.features.colorsRGB[ColorType.SPECIAL]
                        .slice(0, 3)
                        .map((v) => Math.floor(v * 255)),
                    1 * 255,
                ],
            },
        });
    }

    public delete() {
        Object.values(this.textures).forEach((t) =>
            this.context.deleteTexture(t)
        );
    }

    public get length(): number {
        return Object.keys(this.textures).length;
    }
}

export class Blob {
    public static maxObjects: number = 64;
    private program: twgl.ProgramInfo;
    public output: twgl.FramebufferInfo;
    private shapes!: Array<twgl.BufferInfo>;
    private objects: any[] = [];
    private objectsVars: any[] = [];
    private radius: number = 40;
    private eyeOffset: number;

    public constructor(
        private context: WebGL2RenderingContext,
        private piece: Piece
    ) {
        // language=glsl
        const vertexShader = `
            #version 300 es
            ${precisionAndDefaults}

            uniform mat4 worldViewProjection;
            uniform float frames;
            uniform float baseSize;

            in vec4 position;
            in vec2 texcoord;

            out vec4 v_position;
            out vec2 v_texcoord;
            out float v_i;
            out float v_r;
            out vec2 v_p;
            
            float modulate(float x, int octaves, float lacunarity, float gain, float amplitude, float frequency) {
                float y = 0.0;
                for (int i = 0; i < octaves; i++) {
                    y += amplitude * sin(x * frequency);
                    frequency *= lacunarity;
                    amplitude *= gain;
                }
                return y;
            }

            void main() {
                v_i = float(gl_VertexID)/64.0;
                v_r = modulate(v_i * (position.x * PI / 2.0 + position.z), 5, 1.0 + v_i * 4.0, 0.5 + v_i, 0.5, 0.5 + v_i);
                v_texcoord = clamp(texcoord + v_r * 4.0, 0.0, 2.0);// x&z based shift & cutoff
                v_position = worldViewProjection * (position + v_r * 0.02);// size peaks
                v_p = vec2(v_texcoord * baseSize * 0.5 * (v_i * 0.8 + 0.2));
                gl_Position = v_position;
            }`;

        // language=glsl
        const fragmentShader = `
            #version 300 es
            ${precisionAndDefaults}
            ${bayerDither}

            in vec4 v_position;
            in vec2 v_texcoord;
            in float v_i;
            in float v_r;
            in vec2 v_p;

            uniform sampler2D diffuse;
            uniform float frames;
            uniform vec3 backgroundColor;
            uniform int[36] ditherMatrix;
            uniform float cutTop;
            uniform float cutBottom;

            out vec4 color;

            void main() {
                if (v_texcoord.y > cutTop || v_texcoord.y < cutBottom) {
                    discard;
                    return;
                }
                
                color = texture(diffuse, v_texcoord);
                if (color.a < 0.8) {
                    discard;
                    return;
                }
                
                color = vec4(
                bayerDither6x6(color.rgb, ivec2(v_p), ditherMatrix),
                1.0
                );

                color.rbg *= color.a;
            }`;

        this.program = twgl.createProgramInfo(
            this.context,
            [vertexShader, fragmentShader],
            ['texcoord', 'position']
        );

        this.output = this.piece.outputs.create(
            this.piece.baseSize,
            this.piece.baseSize,
            [
                { format: WebGL2RenderingContext.RGBA },
                {
                    attachmentPoint: WebGL2RenderingContext.DEPTH_ATTACHMENT,
                    attachment: twgl.createTexture(this.context, {
                        format: WebGL2RenderingContext.DEPTH_COMPONENT,
                        internalFormat:
                            WebGL2RenderingContext.DEPTH_COMPONENT24,
                        target: WebGL2RenderingContext.TEXTURE_2D,
                        width: this.piece.baseSize,
                        height: this.piece.baseSize,
                        type: WebGL2RenderingContext.UNSIGNED_INT,
                        minMag: WebGL2RenderingContext.NEAREST,
                    }),
                },
            ]
        );

        this.context.useProgram(this.program.program);
        twgl.bindFramebufferInfo(this.context, this.output);
        this.context.clearColor(
            this.piece.features.colorsRGB[ColorType.BACKGROUND][0],
            this.piece.features.colorsRGB[ColorType.BACKGROUND][1],
            this.piece.features.colorsRGB[ColorType.BACKGROUND][2],
            this.piece.features.colorsRGB[ColorType.BACKGROUND][3]
        );

        this.shapes = [
            twgl.primitives.createSphereBufferInfo(
                this.context,
                0.85,
                3,
                randOptions([3, 5, 6, 7, 8, 11])
            ),
            twgl.primitives.createSphereBufferInfo(
                this.context,
                0.65,
                3,
                randOptions([3, 5, 6, 7, 8, 11])
            ),
            twgl.primitives.createSphereBufferInfo(
                this.context,
                0.45,
                3,
                randOptions([3, 5, 6, 7, 8, 11])
            ),
            twgl.primitives.createSphereBufferInfo(
                this.context,
                0.1,
                3,
                randOptions([3, 5, 6, 7, 8, 11])
            ),
            twgl.primitives.createSphereBufferInfo(
                this.context,
                0.04,
                3,
                randOptions([3, 5, 6, 7, 8, 11])
            ),
            twgl.primitives.createSphereBufferInfo(
                this.context,
                0.02,
                3,
                randOptions([3, 5, 6, 7, 8, 11])
            ),
        ];

        this.objects = [];
        this.objectsVars = [];

        for (let i = 0; i < Blob.maxObjects; ++i) {
            this.addObject(this.piece.blobTextures);
        }

        // fix offset for left/right intro movement and also stable for kiosk mode
        this.eyeOffset = ((randInt(6) * 60) / 180) * Math.PI;
    }

    private lastTextureId: number = 0;

    public addObject(textures: BlobTextures) {
        const t = this.lastTextureId;
        this.lastTextureId++;
        if (this.lastTextureId >= textures.length) {
            this.lastTextureId = 0;
        }
        // const t = randInt(textures.length);
        const rf = (base: number = 0.25, max: number = 1) => {
            let r = rand() - 0.5;
            r *= max - base * 2;
            return r < 0 ? r - base : r + base;
        };

        const uniforms = {
            diffuse: textures.textures[t],
            viewInverse: m4.identity(),
            world: m4.identity(),
            worldInverseTranspose: m4.identity(),
            worldViewProjection: m4.identity(),
            frames: 0,
            // pixels: null,
            backgroundColor: this.piece.features.colorsRGB[
                ColorType.BACKGROUND
            ].slice(0, 3),
            cutTop: rand() * 0.2 + 0.55,
            cutBottom: rand() * 0.2 + 0.25,
            baseSize: Piece.defaultSize,
        };
        const shape = randOptions(
            this.piece.features.variation.value.shapes.value
        );
        this.objects.push({
            programInfo: this.program,
            bufferInfo: this.shapes[shape],
            uniforms: uniforms,
            type: WebGL2RenderingContext.TRIANGLES,
        });

        let f = [0.2, 0.2, 0.2][shape] ?? 0.1;
        let df = [0.2, 0.3, 0.4][shape] ?? 0.6;

        const objectVars = {
            translation: [
                rf(rand() * f + df),
                rf(rand() * f + df),
                rf(rand() * f + df),
            ],
            ySpeed: rf(rand() * 0.8, 4.0),
            xSpeed: rf(rand() * 0.8, 4.0),
            zSpeed: rf(rand() * 0.8, 4.0),
            uniforms: uniforms,
        };
        this.objectsVars.push(objectVars);
    }

    public replaceObject(textures: BlobTextures) {
        this.objects.shift();
        this.objectsVars.shift();
        this.addObject(textures);
    }

    public tick(_timeMs: number) {
        this.context.useProgram(this.program.program);
        this.context.depthMask(true);
        this.context.getExtension('EXT_frag_depth');
        this.context.enable(WebGL2RenderingContext.DEPTH_TEST);
        this.context.enable(WebGL2RenderingContext.BLEND);
        this.context.blendFunc(
            WebGL2RenderingContext.SRC_ALPHA,
            // WebGL2RenderingContext.ONE_MINUS_DST_ALPHA
            WebGL2RenderingContext.ONE_MINUS_SRC_ALPHA
        );
        const speed = this.piece.frames.total / this.piece.fps;
        const camera = m4.identity();
        const view = m4.identity();
        const viewProjection = m4.identity();
        const projection = m4.perspective((5 * Math.PI) / 180, 1.0, 0.5, 100);

        m4.lookAt(
            [
                Math.cos(speed + this.eyeOffset) * this.radius,
                5,
                Math.sin(speed + this.eyeOffset) * this.radius,
            ],
            [0, 0, 0],
            [1, 1, 1],
            camera
        );
        m4.inverse(camera, view);
        m4.multiply(projection, view, viewProjection);

        this.objectsVars.forEach((v) => {
            const u = v.uniforms;
            m4.identity(u.world);
            m4.rotateY(u.world, speed * v.ySpeed, u.world);
            m4.rotateZ(u.world, speed * v.zSpeed, u.world);
            m4.translate(u.world, v.translation, u.world);
            m4.rotateX(u.world, speed * v.xSpeed, u.world);
            m4.transpose(
                m4.inverse(u.world, u.worldInverseTranspose),
                u.worldInverseTranspose
            );
            m4.multiply(viewProjection, u.world, u.worldViewProjection);
            u.frames = this.piece.frames.total;
            // u.pixels = this.piece.pixels.output.attachments[0];
            u.backgroundColor = this.piece.features.colorsRGB[
                ColorType.BACKGROUND
            ].slice(0, 3);
            u.ditherMatrix = this.piece.features.ditherMatrix.matrix;
        });

        twgl.bindFramebufferInfo(this.context, this.output);
        this.context.clear(
            WebGL2RenderingContext.COLOR_BUFFER_BIT |
                WebGL2RenderingContext.DEPTH_BUFFER_BIT
        );
        this.context.clearColor(
            this.piece.features.colorsRGB[ColorType.BACKGROUND][0],
            this.piece.features.colorsRGB[ColorType.BACKGROUND][1],
            this.piece.features.colorsRGB[ColorType.BACKGROUND][2],
            this.piece.features.colorsRGB[ColorType.BACKGROUND][3]
        );

        twgl.drawObjectList(this.context, this.objects);
    }
}

export class Pixels {
    private program: twgl.ProgramInfo;
    private buffer: twgl.BufferInfo;
    public output: twgl.FramebufferInfo;
    public outputIndex: number = 0;
    private outputs: twgl.FramebufferInfo[];

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

            in vec2 pos;

            uniform vec3 backgroundColor;
            uniform sampler2D pixels;
            uniform sampler2D blob;
            uniform sampler2D blobDepth;
            uniform float pixelSize;
            uniform int debugLevel;
            uniform bool colorChanging;

            out vec4 color;

            void main() {
                vec4 b = texture(blob, (pos * (1.0 + pixelSize) * 0.5 + 0.5) * 1.0);
                vec4 p = texture(pixels, pos * (1.0 + pixelSize) * 0.5 + 0.5);

                float d = texture(blobDepth, pos * 0.5 + 0.5).x;
                d = pow(d, 100.0);

                if (debugLevel == 1) {
                    color = vec4(d, d, d, 1.0);
                    return;
                }

                if (p.a < 1.0) {
                    color = vec4(backgroundColor, 1.0);
                }
                else if (d == 1.0 && (colorChanging || distance(p.rgb, backgroundColor) < 0.05)) {
                    color = vec4(backgroundColor, 1.0);
                }
                else {
                    float dp = distance(pos, vec2(0));
                    float dd = clamp(min(d, dp), 0.0, 1.0);
                    if (debugLevel == 2) {
                        color = vec4(dd, dd, dd, 1.0);
                        return;
                    }
                    color = mix(b, p, dd * 0.7);
                    color = vec4(color.rgb, 1.0);
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

        this.outputs = [
            this.piece.outputs.add(
                this.piece.baseSize,
                this.piece.baseSize,
                WebGL2RenderingContext.NEAREST
            ),
            this.piece.outputs.add(
                this.piece.baseSize,
                this.piece.baseSize,
                WebGL2RenderingContext.NEAREST
            ),
        ];
        this.output = this.outputs[this.outputIndex];
    }

    public tick(_timeMs: number) {
        this.context.useProgram(this.program.program);
        twgl.setBuffersAndAttributes(this.context, this.program, this.buffer);
        twgl.setUniforms(this.program, {
            backgroundColor: this.piece.features.colorsRGB[
                ColorType.BACKGROUND
            ].slice(0, 3),
            pixelSize: 1.0 / this.piece.baseSize,
            pixels: this.outputs[this.outputIndex].attachments[0],
            blob: this.piece.blob.output.attachments[0],
            blobDepth: this.piece.blob.output.attachments[1],
            debugLevel: this.piece.debugLevel,
            colorChanging: this.piece.kiosk.colorChanging,
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
        this.canvas.width = this.piece.baseSize;
        this.canvas.height = this.piece.baseSize;
        document.body.append(this.canvas);
    }

    public async init() {
        let fontFace = new FontFace('Outfit', 'url(e73e1a1110a1f162e027.woff)');
        await fontFace.load();
        document.fonts.add(fontFace);

        this.updateSize(this.piece.baseSize, this.piece.baseSize);
    }

    public updateSize(width: number, height: number) {
        this.canvas.width = width;
        this.canvas.height = height;

        this.canvas.style.letterSpacing = `${-0.0005 * this.piece.baseSize}px`;

        let context = this.canvas.getContext('2d') as CanvasRenderingContext2D;

        context.fillStyle = '#ffffff';
        context.translate(this.canvas.width / 2, this.canvas.height / 2);
        context.textAlign = 'left';
        context.font = `${0.12 * this.piece.baseSize}px 'Outfit'`;
        context.fillText(
            'Est',
            -0.47 * this.piece.baseSize,
            0.47 * this.piece.baseSize
        );
        context.textAlign = 'right';
        context.font = `${0.03 * this.piece.baseSize}px 'Outfit'`;
        context.fillText(
            'THU, January 5, 2023, 19:00 UTC',
            0.47 * this.piece.baseSize,
            0.47 * this.piece.baseSize
        );
        context.fillText(
            'on fxhash.xyz',
            0.47 * this.piece.baseSize,
            0.43 * this.piece.baseSize
        );

        this.texture = twgl.createTexture(this.context, {
            src: this.canvas,
        });
    }
}

export enum ScreenMode {
    DEFAULT,
    RAW,
    ALTERNATIVE,
    RASTERIZED,
    FACETES,
    LINEBLOCKS,
    ALL,
}
export const ScreenModeValues = getEnumValues(ScreenMode);

export class Screen {
    public mode: ScreenMode = ScreenMode.DEFAULT;
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
            uniform float baseSize;
            uniform float combination;
            uniform float frames;
            uniform float factor;
            uniform sampler2D announcement;
            uniform bool announcementActive;
            uniform vec3 announceColor;
            uniform vec3 backgroundColor;
            uniform bool debug;
            uniform int debugLevel;
            uniform int mode;
            uniform int[36] ditherMatrix;

            vec2 rotate(vec2 v, float a) {
                float s = sin(a);
                float c = cos(a);
                mat2 m = mat2(c, -s, s, c);
                return m * v;
            }

            vec2 random2 (in vec2 st) {
                float a = sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123;
                return vec2(
                fract(st.x * a),
                fract(st.y * a)
                );
            }

            void main() {
                if (debug == true) {
                    color = texture(pixels, pos);
                } else {
                    vec2 p;
                    float f = 0.05;
                    int m = mode;

                    if (m == ${ScreenMode.ALL}) {
                        vec2 pr = rotate(pos, mod(combination + pos.y, 18.0) * 1.0 * PI/18.0);
                        m = int(mod((pr.y - pr.x) * 36.0, 6.0));
                    }

                    if (m == ${ScreenMode.DEFAULT}) {
                        float s = 3.5 * f;
                        vec2 r = (random2(pos) - 0.5) * s;
                        float d = distance(vec2(0.5) + r, pos) - s;
                        if (d <= 0.00) {
                            p = pos;
                            if (debugLevel == 3) {
                                color = vec4(1.0);
                                return;
                            }

                        } else {
                            if (debugLevel == 3) {
                                color = vec4(0.5, 0.5, 0.5, 1.0);
                                return;
                            }
                            color = texture(pixels, pos);
                            float a = distance(color.rgb, backgroundColor.rgb);
                            float b = distance(color.rgb, announceColor.rgb) * f;
                            vec2 ra = rotate(vec2(a,b), mod(combination + (pos.y + pos.x) * 2.0, 6.0) * 3.0 * PI/18.0);
                            p = pos - ra * d * s;
                        }
                    }
                    else if (m == ${ScreenMode.RAW}) {
                        p = pos;
                    }
                    else if (m == ${ScreenMode.ALTERNATIVE}) {
                        color = texture(pixels, pos);
                        float a = (dot(vec3(1.0) - color.rgb, vec3(1.0)) - 1.5);
                        p = pos + a * f / 2.0;
                    }
                    else if (m == ${ScreenMode.RASTERIZED}) {
                        f = f * factor;
                        p = vec2(
                        pos.x - mod(pos.x, f * cos(pos.y * PI)),
                        pos.y - mod(pos.y, f * cos(pos.x * PI))
                        );
                    }
                    else if (m == ${ScreenMode.FACETES}) {
                        p = vec2(
                        pos.x - (f/2.0 - mod(pos.x, f)),
                        pos.y - (f/2.0 - mod(pos.y, f))
                        );
                    }
                    else if (m == ${ScreenMode.LINEBLOCKS}) {
                        p = vec2(
                        pos.x,
                        pos.y - mod(pos.y, f) + f/2.0
                        );
                    }
                    color = texture(pixels, p);
                    color = vec4(color.rgb, 1.0);

                    if (announcementActive) {
                        vec4 a = texture(announcement, pos * vec2(1.0, -1.0));
                        if (a.a > 0.0) {
                            color = vec4(mix(color.rgb, announceColor, a.a), 1.0);
                        }
                    }
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
                baseSize: Piece.defaultSize,
                frames: this.piece.frames.total,
                debug: false,
                debugLevel: this.piece.debugLevel,
                announcementActive: this.piece.announcement.active,
                announcement: this.piece.announcement
                    ? this.piece.announcement.texture
                    : null,
                announceColor: this.piece.features.colorsRGB[
                    ColorType.BOTTOM
                ].slice(0, 3),
                backgroundColor: this.piece.features.colorsRGB[
                    ColorType.BACKGROUND
                ].slice(0, 3),
                ditherMatrix: this.piece.features.ditherMatrix.matrix,
                mode: this.mode,
                combination: this.piece.features.combination,
                factor: Math.sin(
                    this.piece.features.combination +
                        0.016 * this.piece.frames.total
                ),
            });
        } else {
            twgl.setUniforms(this.program, {
                pixels: this.piece.outputs.buffers[this.piece.outputIndex]
                    .attachments[0],
                baseSize: Piece.defaultSize,
                frames: this.piece.frames.total,
                debug: true,
                debugLevel: this.piece.debugLevel,
                announcementActive: false,
                announcement: null,
                announceColor: this.piece.features.colorsRGB[
                    ColorType.BOTTOM
                ].slice(0, 3),
                backgroundColor: this.piece.features.colorsRGB[
                    ColorType.BACKGROUND
                ].slice(0, 3),
                ditherMatrix: this.piece.features.ditherMatrix.matrix,
                mode: this.mode,
                combination: this.piece.features.combination,
                factor: Math.sin(
                    this.piece.features.combination *
                        0.016 *
                        this.piece.frames.total
                ),
            });
        }
        twgl.bindFramebufferInfo(this.context, null);
        twgl.drawBufferInfo(this.context, this.buffer);
    }
}

export class Piece {
    public features!: Features;

    public static title: string = 'Est';
    public static defaultPixelRatio: number = 1;
    public static defaultSize: number = 3000;
    public static maxDebugLevel: number = 3;

    public width: number = 0;
    public height: number = 0;
    public fps: number = 60;

    public canvas: HTMLCanvasElement;
    public context!: WebGL2RenderingContext;

    public frames!: Frames;

    public combination: number;

    public pauseAfterBase: number = Blob.maxObjects / 2;
    public pauseAfter: number;
    public inPreviewPhase: boolean;

    public paused: boolean = false;

    public outputs!: Outputs;
    public outputIndex: number | null = null;
    public blobTextures!: BlobTextures;
    public blob!: Blob;
    public pixels!: Pixels;
    public screen!: Screen;

    public announcement!: Announcement;

    public kiosk!: Kiosk;

    private initWebglDone: boolean = false;

    public debugLevel: number = 0;

    public constructor(
        canvas: HTMLCanvasElement,
        width: number,
        height: number,
        combination: number,
        public pixelRatio: number = Piece.defaultPixelRatio,
        announcementActive: boolean = false,
        kioskSpeed: number | null = null,
        kioskMode: KioskMode | null = null,
        public baseSize: number = Piece.defaultSize,
        screenMode: ScreenMode | null = null
    ) {
        this.canvas = canvas;
        this.combination = combination;

        randInit(window.fxhash);

        this.features = new Features(this.combination);
        this.paused = false;
        this.pauseAfter = this.pauseAfterBase;
        this.inPreviewPhase = true;

        this.frames = new Frames(this);

        this.kiosk = new Kiosk(this);
        this.kiosk.setSpeedAndMode(kioskSpeed, kioskMode ?? KioskMode.FEATURES);

        this.init(announcementActive, screenMode ?? ScreenMode.DEFAULT);

        this.updateSize(width, height, pixelRatio);
    }

    private async init(announcementActive: boolean, screenMode: ScreenMode) {
        if (this.context instanceof WebGL2RenderingContext) {
            return;
        }

        this.initWebglDone = false;

        this.context = twgl.getContext(this.canvas, {
            depth: false,
            preserveDrawingBuffer: true,
            premultipliedAlpha: true,
            antialias: false,
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

        this.blobTextures = new BlobTextures(this.context, this);
        this.blob = new Blob(this.context, this);
        this.pixels = new Pixels(this.context, this);
        this.screen = new Screen(this.context, this);
        this.screen.mode = screenMode;

        this.initWebglDone = true;
    }

    public updateSize(
        width: number,
        height: number,
        pixelRatio: number | null = null
    ) {
        if (pixelRatio === null) {
            pixelRatio = this.pixelRatio;
        }
        this.pixelRatio = pixelRatio;
        this.width = this.baseSize * this.pixelRatio;
        this.height = this.baseSize * this.pixelRatio;

        let f = Math.min(width, height) / this.baseSize;
        this.canvas.style.width = `${
            (((this.width * f) / width) * 100) / this.pixelRatio
        }%`;
        this.canvas.style.height = `${
            (((this.height * f) / height) * 100) / this.pixelRatio
        }%`;
        if (this.context.canvas instanceof HTMLCanvasElement) {
            this.context.canvas.style.width = `${
                (((this.width * f) / width) * 100) / this.pixelRatio
            }%`;
            this.context.canvas.style.height = `${
                (((this.height * f) / height) * 100) / this.pixelRatio
            }%`;
        }

        this.canvas.dispatchEvent(new Event('piece.updateSize'));

        this.context.canvas.width = this.width;
        this.context.canvas.height = this.height;
        this.context.viewport(0, 0, this.width, this.height);

        this.setBackgroundColor();
    }

    public setBackgroundColor() {
        document.body.style.backgroundColor =
            this.features.colorsCSS[ColorType.BACKGROUND];
    }

    public tick(timeMs: number) {
        if (!this.initWebglDone) {
            return;
        }

        this.tickCaptureImage();

        this.frames.tick(timeMs);

        this.kiosk.tick(timeMs);

        if (!this.paused) {
            this.blob.tick(timeMs);
            this.pixels.tick(timeMs);
        }

        this.screen.tick(timeMs);

        if (this.pauseAfter > 0) {
            this.pauseAfter--;
            if (this.pauseAfter == 0) {
                this.paused = true;
                this.inPreviewPhase = false;
            }
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

        this.canvas.toBlob((blob) => {
            if (blob === null) {
                return;
            }
            const a = document.createElement('a');
            document.body.appendChild(a);
            a.style.display = 'none';
            a.href = window.URL.createObjectURL(blob);
            a.download = name;
            a.onclick = (ev: MouseEvent) => ev.stopPropagation();
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

    public touch() {
        this.pauseAfter = this.pauseAfterBase;
        this.paused = false;
    }
}

export enum KioskMode {
    ANIMATE,
    OBJECTS,
    FEATURES,
    SPECIAL,
}

export const KioskModeValues = getEnumValues(KioskMode);

export class Kiosk {
    private changeInterval!: NodeJS.Timer;
    public colorChanging: boolean = false;
    public changing: boolean = false;
    private _speedSec: number | null = null;
    private _mode: KioskMode = KioskMode.FEATURES;

    private oldColors!: LCH[];
    private newColors!: LCH[];

    private oldBlobTextures!: BlobTextures;
    private newBlobTextures!: BlobTextures;
    private replacedBlobObjects: number = 0;

    public constructor(public piece: Piece) {}

    public setSpeedAndMode(speedSec: number | null, mode: KioskMode) {
        this._speedSec = speedSec;
        this._mode = mode;
        if (this.changeInterval) {
            clearInterval(this.changeInterval);
        }
        if (speedSec) {
            this.changeInterval = setInterval(() => {
                if (this.piece.paused) {
                    this.change(mode);
                }
            }, 1000 * speedSec);
        }
    }

    public tick(_timeMs: number) {
        if (!this.changing) {
            return;
        }
        this.onChanging();

        if (this.piece.paused) {
            this.onChangeDone();
        }
    }

    private onChanging() {
        this.colorChanging = this.piece.pauseAfter > this.piece.pauseAfterBase;
        if (this.colorChanging) {
            this.oldColors.forEach((c, i) =>
                this.piece.features.updateColor(
                    i as ColorType,
                    lch(
                        srgb(
                            mix(
                                [],
                                srgb(this.newColors[i]),
                                srgb(c),
                                (this.piece.pauseAfter -
                                    this.piece.pauseAfterBase) /
                                    this.piece.pauseAfterBase
                            )
                        )
                    )
                )
            );
            this.piece.setBackgroundColor();
        }

        // replace objects
        if (this.replacedBlobObjects > 0) {
            this.piece.blob.replaceObject(this.newBlobTextures);
            this.replacedBlobObjects--;
            this.piece.blob.replaceObject(this.newBlobTextures);
            this.replacedBlobObjects--;
        }
    }

    private onChangeDone() {
        this.changing = false;
        this.piece.blobTextures = this.newBlobTextures;
        this.oldBlobTextures.delete();
    }

    public change(mode: KioskMode) {
        if (mode !== KioskMode.ANIMATE) {
            randSkip(7);
            this.replacedBlobObjects = Blob.maxObjects;
            this.changing = true;
            this.colorChanging = true;
            this.oldColors = [...this.piece.features.colors];

            if (mode === KioskMode.OBJECTS) {
                this.newColors = [...this.oldColors];
            } else {
                this.piece.features = new Features(
                    randInt(Features.combinations)
                );
                this.newColors = [...this.piece.features.colors];
            }

            this.newBlobTextures = new BlobTextures(
                this.piece.context,
                this.piece
            );
            this.oldBlobTextures = this.piece.blobTextures;

            this.piece.setBackgroundColor();
        }

        if (mode === KioskMode.SPECIAL) {
            this.piece.screen.mode = randOptions(ScreenModeValues);
        }

        this.piece.paused = false;
        this.piece.pauseAfter = this.piece.pauseAfterBase * 2; // replace objects then spin for motion blur
    }

    public get active(): boolean {
        return this.speedSec !== null;
    }

    public get speedSec(): number | null {
        return this._speedSec;
    }

    public get mode(): KioskMode {
        return this._mode;
    }
}

export class Frames {
    public total: number = 0;

    public constructor(private piece: Piece) {}

    public tick(_timeMs: number) {
        if (this.piece.paused) {
            return;
        }
        this.total++;
    }
}
