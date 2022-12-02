import { rand, randInit, randInt, randOptions, randSkip } from './rand';
import { colors } from './colors';
import * as twgl from 'twgl.js';
import { AttachmentOptions, m4 } from 'twgl.js';
import {
    css,
    distHsvLuma,
    distHsvSat,
    lch,
    LCH,
    mix,
    proximity,
    sort,
    srgb,
    TypedColor,
} from '@thi.ng/color';
import { pnoise, precisionAndDefaults } from './glsl';
import {
    combinationFn,
    featureNumber,
    features,
    featureSet,
    variation,
} from './combinations';
import { clamp01 } from '@thi.ng/math';

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
                [0, 0, 0, 1, 2],
                [0, 1, 1, 1, 2],
                [0, 1, 2, 2, 2],
            ],
            ['more s', 'more m', 'more l']
        ),
    ]);

    public static combinations: number =
        Features.variations(0).numberOfVariations;

    public combination: number = 0;

    public topColor: LCH;
    public topColorCSS: string;
    public topColorRGB: number[];
    public bottomColor: LCH;
    public bottomColorCSS: string;
    public bottomColorRGB: number[];
    public backgroundColor: LCH;
    public backgroundColorCSS: string;
    public backgroundColorRGB: number[];
    public oddColor: LCH;
    public oddColorCSS: string;
    public oddColorRGB: number[];
    public evenColor: LCH;
    public evenColorCSS: string;
    public evenColorRGB: number[];

    public constructor(combination: number) {
        this.combination = combination % Features.combinations;

        this.variation = Features.variations(combination);

        let colors: Array<string> = this.variation.value.palette.value;
        let c: LCH[] = sort(
            colors.map((c: string) => lch(srgb(c))),
            proximity(lch('#ffffff'), distHsvSat),
            this.variation.value.colorSortDirection.value
        ) as LCH[];
        let co: LCH[] = sort(
            c,
            proximity(
                c[this.variation.value.colorSortReference.value],
                distHsvLuma
            ),
            this.variation.value.colorSortDirection.value
        ) as LCH[];

        this.topColor = co[2];
        this.topColorCSS = css(this.topColor);
        this.topColorRGB = srgb(this.topColor)
            .buf.slice(0, 4)
            .map((v) => clamp01(v)) as number[];

        this.bottomColor = co[1];
        this.bottomColorCSS = css(this.bottomColor);
        this.bottomColorRGB = srgb(this.bottomColor)
            .buf.slice(0, 4)
            .map((v) => clamp01(v)) as number[];

        this.backgroundColor = co[0];
        this.backgroundColorCSS = css(this.backgroundColor);
        this.backgroundColorRGB = srgb(this.backgroundColor)
            .buf.slice(0, 4)
            .map((v) => clamp01(v)) as number[];

        this.evenColor = co[3];
        this.evenColorCSS = css(this.evenColor);
        this.evenColorRGB = srgb(this.evenColor)
            .buf.slice(0, 4)
            .map((v) => clamp01(v)) as number[];

        this.oddColor = co[4];
        this.oddColorCSS = css(this.oddColor);
        this.oddColorRGB = srgb(this.oddColor)
            .buf.slice(0, 4)
            .map((v) => clamp01(v)) as number[];

        this.log();
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
        logColor(this.backgroundColor, 'background');
        logColor(this.topColor, 'top');
        logColor(this.bottomColor, 'bottom');
        logColor(this.oddColor, 'odd');
        logColor(this.evenColor, 'even');
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
                src: [
                    ...this.piece.features.bottomColorRGB.map((v) =>
                        Math.floor(v * 255)
                    ),
                    ...this.piece.features.topColorRGB
                        .slice(0, 3)
                        .map((v) => Math.floor(v * 255)),
                    (rand() * 0.2 + 0.5) * 255,
                    ...this.piece.features.bottomColorRGB.map((v) =>
                        Math.floor(v * 255)
                    ),
                ],
            },
            1: {
                internalFormat: WebGL2RenderingContext.RGBA,
                format: WebGL2RenderingContext.RGBA,
                type: WebGL2RenderingContext.UNSIGNED_BYTE,
                src: [
                    ...this.piece.features.backgroundColorRGB
                        .slice(0, 3)
                        .map((v) => Math.floor(v * 255)),
                    123,
                ],
            },
            2: {
                internalFormat: WebGL2RenderingContext.RGBA,
                format: WebGL2RenderingContext.RGBA,
                type: WebGL2RenderingContext.UNSIGNED_BYTE,
                src: [
                    ...this.piece.features.backgroundColorRGB
                        .slice(0, 3)
                        .map((v) => Math.floor(v * 255)),
                    0.5 * 255,
                    ...this.piece.features.topColorRGB.map((v) =>
                        Math.floor(v * 255)
                    ),
                    ...this.piece.features.backgroundColorRGB
                        .slice(0, 3)
                        .map((v) => Math.floor(v * 255)),
                    0.5 * 255,
                ],
            },
            3: {
                internalFormat: WebGL2RenderingContext.RGBA,
                format: WebGL2RenderingContext.RGBA,
                type: WebGL2RenderingContext.UNSIGNED_BYTE,
                src: this.piece.features.bottomColorRGB.map((v) =>
                    Math.floor(v * 255)
                ),
            },
            4: {
                internalFormat: WebGL2RenderingContext.RGBA,
                format: WebGL2RenderingContext.RGBA,
                type: WebGL2RenderingContext.UNSIGNED_BYTE,
                src: this.piece.features.topColorRGB.map((v) =>
                    Math.floor(v * 255)
                ),
            },
            5: {
                internalFormat: WebGL2RenderingContext.RGBA,
                format: WebGL2RenderingContext.RGBA,
                type: WebGL2RenderingContext.UNSIGNED_BYTE,
                minMag: WebGL2RenderingContext.NEAREST,
                src: Array(500)
                    .fill(1)
                    .map((_v, i) =>
                        i % 3 != 0
                            ? [
                                  ...this.piece.features.topColorRGB.slice(
                                      0,
                                      3
                                  ),
                                  rand() * 0.6 + 0.2,
                              ]
                            : [
                                  ...this.piece.features.bottomColorRGB.slice(
                                      0,
                                      3
                                  ),
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
                src: Array(1000)
                    .fill(1)
                    .map((_v, i) =>
                        i % 2 != 0
                            ? [
                                  ...this.piece.features.oddColorRGB.slice(
                                      0,
                                      3
                                  ),
                                  rand() * 0.6 + 0.2,
                              ]
                            : [
                                  ...this.piece.features.evenColorRGB.slice(
                                      0,
                                      3
                                  ),
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
                src: [
                    ...this.piece.features.oddColorRGB
                        .slice(0, 3)
                        .map((v) => Math.floor(v * 255)),
                    (rand() * 0.6 + 0.2) * 255,
                    ...this.piece.features.topColorRGB.map((v) =>
                        Math.floor(v * 255)
                    ),
                    ...this.piece.features.oddColorRGB
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
                src: Array(1000)
                    .fill(1)
                    .map((_v, i) =>
                        i % 7 != 0
                            ? [
                                  ...this.piece.features.topColorRGB.slice(
                                      0,
                                      3
                                  ),
                                  rand() * 0.6 + 0.2,
                              ]
                            : [
                                  ...this.piece.features.bottomColorRGB.slice(
                                      0,
                                      3
                                  ),
                                  0.95,
                              ]
                    )
                    .flat()
                    .map((v) => Math.floor(v * 255)),
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
            ${pnoise}

            uniform mat4 worldViewProjection;
            uniform float frames;

            in vec4 position;
            in vec2 texcoord;

            out vec4 v_position;
            out vec2 v_texcoord;

            void main() {
                float distortion = pnoise(
                position.xyz + frames * 0.0016,
                vec3(20.0)
                );

                v_texcoord = texcoord + distortion * 0.11;
                v_position = worldViewProjection * position + distortion * 1.0;
                gl_Position = v_position;
            }`;

        // language=glsl
        const fragmentShader = `
            #version 300 es
            ${precisionAndDefaults}

            in vec4 v_position;
            in vec2 v_texcoord;

            uniform sampler2D diffuse;
            uniform float frames;

            out vec4 color;

            void main() {
                vec4 diffuseColor = texture(diffuse, v_texcoord);
                if (diffuseColor.a < 0.1) {
                    discard;
                    return;
                }
                color = diffuseColor;
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
            this.piece.features.backgroundColorRGB[0],
            this.piece.features.backgroundColorRGB[1],
            this.piece.features.backgroundColorRGB[2],
            this.piece.features.backgroundColorRGB[3]
        );

        this.shapes = [
            twgl.primitives.createSphereBufferInfo(this.context, 0.8, 150, 50),
            twgl.primitives.createSphereBufferInfo(this.context, 0.6, 100, 50),
            twgl.primitives.createSphereBufferInfo(this.context, 0.4, 50, 50),
            twgl.primitives.createTorusBufferInfo(
                this.context,
                0.4,
                0.4,
                64,
                64
            ),
            twgl.primitives.createCubeBufferInfo(this.context, 1),
            twgl.primitives.createPlaneBufferInfo(this.context, 1.35, 1.35),
        ];

        this.objects = [];
        this.objectsVars = [];

        for (let i = 0; i < Blob.maxObjects; ++i) {
            this.addObject(this.piece.blobTextures);
        }

        // fix offset for left/right intro movement and also stable for kiosk mode
        this.eyeOffset = ((randInt(6) * 60) / 180) * Math.PI;
    }

    public addObject(textures: BlobTextures) {
        const t = randInt(textures.length);
        // const t = randOptions([5, 6]);
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

        const objectVars = {
            translation: [
                rf(rand() * 0.2 * (shape * 0.5 + 1)),
                rf(rand() * 0.2 * (shape * 0.5 + 1)),
                rf(rand() * 0.2 * (shape * 0.5 + 1)),
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
        this.context.enable(WebGL2RenderingContext.DEPTH_TEST);
        this.context.enable(WebGL2RenderingContext.BLEND);
        this.context.blendFunc(
            WebGL2RenderingContext.SRC_ALPHA,
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
            u.frames = this.piece.frames.total; // + this.piece.combination;
        });

        twgl.bindFramebufferInfo(this.context, this.output);
        this.context.clear(
            WebGL2RenderingContext.COLOR_BUFFER_BIT |
                WebGL2RenderingContext.DEPTH_BUFFER_BIT
        );
        this.context.clearColor(
            this.piece.features.backgroundColorRGB[0],
            this.piece.features.backgroundColorRGB[1],
            this.piece.features.backgroundColorRGB[2],
            this.piece.features.backgroundColorRGB[3]
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
                vec4 b = texture(blob, pos * (1.0 + pixelSize) * 0.5 + 0.5);
                vec4 p = texture(pixels, (pos * (1.0 - pixelSize) * 0.5 + 0.5));

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
                        color = color = vec4(dd, dd, dd, 1.0);
                        return;
                    }
                    color = mix(b, p, dd * 0.9);
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
            backgroundColor: this.piece.features.backgroundColorRGB.slice(0, 3),
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
            'Iacta',
            -0.47 * this.piece.baseSize,
            0.47 * this.piece.baseSize
        );
        context.textAlign = 'right';
        context.font = `${0.03 * this.piece.baseSize}px 'Outfit'`;
        context.fillText(
            'FRI, December 9, 2022, 19:00 UTC',
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
            uniform sampler2D announcement;
            uniform bool announcementActive;
            uniform vec3 evenColor;
            uniform bool debug;

            void main() {
                if (debug == true) {
                    color = texture(pixels, pos);
                } else {
                    color = texture(pixels, pos);
                    color = vec4(color.rgb, 1.0);
                    if (announcementActive) {
                        vec4 a = texture(announcement, pos * vec2(1.0, -1.0));
                        if (a.a > 0.0) {
                            color = vec4(mix(color.rgb, evenColor, a.a), 1.0);
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
                debug: false,
                announcementActive: this.piece.announcement.active,
                announcement: this.piece.announcement
                    ? this.piece.announcement.texture
                    : 0,
                evenColor: this.piece.features.evenColorRGB.slice(0, 3),
            });
        } else {
            twgl.setUniforms(this.program, {
                pixels: this.piece.outputs.buffers[this.piece.outputIndex]
                    .attachments[0],
                debug: true,
                announcementActive: false,
                announcement: 0,
                evenColor: this.piece.features.evenColorRGB.slice(0, 3),
            });
        }
        twgl.bindFramebufferInfo(this.context, null);
        twgl.drawBufferInfo(this.context, this.buffer);
    }
}

export class Piece {
    public features!: Features;

    public static title: string = 'Alea';
    public static defaultPixelRatio: number = 1;
    public static defaultSize: number = 3000;

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
        public baseSize: number = Piece.defaultSize
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
        document.body.style.backgroundColor = this.features.backgroundColorCSS;
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
    ANIMATE = 'animate',
    OBJECTS = 'objects',
    FEATURES = 'features',
}

export class Kiosk {
    private changeInterval!: NodeJS.Timer;
    public colorChanging: boolean = false;
    public changing: boolean = false;
    private _speedSec: number | null = null;
    private _mode: KioskMode = KioskMode.FEATURES;

    private oldBackgroundColor!: LCH;
    private newBackgroundColor!: LCH;

    private oldTopColor!: LCH;
    private newTopColor!: LCH;

    private oldEvenColor!: LCH;
    private newEvenColor!: LCH;

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
            this.piece.features.backgroundColor = lch(
                mix(
                    [],
                    this.newBackgroundColor,
                    this.oldBackgroundColor,
                    (this.piece.pauseAfter - this.piece.pauseAfterBase) /
                        this.piece.pauseAfterBase
                )
            );
            this.piece.features.backgroundColorCSS = css(
                this.piece.features.backgroundColor
            );
            this.piece.features.backgroundColorRGB = srgb(
                this.piece.features.backgroundColor
            )
                .buf.slice(0, 4)
                .map((v) => clamp01(v)) as number[];
            this.piece.setBackgroundColor();

            this.piece.features.topColor = lch(
                mix(
                    [],
                    this.newTopColor,
                    this.oldTopColor,
                    (this.piece.pauseAfter - this.piece.pauseAfterBase) /
                        this.piece.pauseAfterBase
                )
            );
            this.piece.features.topColorCSS = css(this.piece.features.topColor);
            this.piece.features.topColorRGB = srgb(this.piece.features.topColor)
                .buf.slice(0, 4)
                .map((v) => clamp01(v)) as number[];

            this.piece.features.evenColor = lch(
                mix(
                    [],
                    this.newEvenColor,
                    this.oldEvenColor,
                    (this.piece.pauseAfter - this.piece.pauseAfterBase) /
                        this.piece.pauseAfterBase
                )
            );
            this.piece.features.evenColorCSS = css(
                this.piece.features.evenColor
            );
            this.piece.features.evenColorRGB = srgb(
                this.piece.features.evenColor
            )
                .buf.slice(0, 4)
                .map((v) => clamp01(v)) as number[];
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
            this.oldBackgroundColor = this.piece.features.backgroundColor;
            this.oldTopColor = this.piece.features.topColor;
            this.oldEvenColor = this.piece.features.evenColor;

            if (mode === KioskMode.OBJECTS) {
                this.newBackgroundColor = this.oldBackgroundColor;
                this.newTopColor = this.oldTopColor;
                this.newEvenColor = this.oldEvenColor;
            } else {
                this.piece.features = new Features(
                    randInt(Features.combinations)
                );

                this.newBackgroundColor = this.piece.features.backgroundColor;
                this.newTopColor = this.piece.features.topColor;
                this.newEvenColor = this.piece.features.evenColor;
            }

            this.newBlobTextures = new BlobTextures(
                this.piece.context,
                this.piece
            );
            this.oldBlobTextures = this.piece.blobTextures;

            this.piece.setBackgroundColor();
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
