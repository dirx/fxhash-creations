// todo: cleanup & credits & readme & selection
import { rand, randBoolean, randInit, randInt, randOptions, RND } from './rand';
import * as twgl from 'twgl.js';
import {
    ColorRange,
    colorsFromRange,
    css,
    LCH,
    srgb,
    TypedColor,
} from '@thi.ng/color';
import { precisionAndDefaults } from './glsl';
import {
    combinationFn,
    featureNumber,
    features,
    featureSet,
    variation,
} from './combinations';
import { clamp, mod } from '@thi.ng/math';

export type FxhashFeatures = {
    'top color': string;
    'bottom color': string;
    'top image': string;
    'bottom photo': string;
    horizon: string;
    hectic: string;
    'horizontal fold': number;
    'vertical fold': number;
    'min stripes': number;
};

type FeaturesType = {
    topColor: variation<number>;
    bottomColor: variation<number>;
    horizon: variation<string>;
    horizontalFold: variation<number>;
    verticalFold: variation<number>;
    hectic: variation<number>;
    topPhoto: variation<string>;
    bottomPhoto: variation<string>;
    minStripes: variation<number>;
};

export const logColor = (c: TypedColor<any>, msg: string = '') =>
    console.log(
        `%c${msg}       ${css(c)}`,
        `background-color: ${css(c)}; color:#ffffff; padding: 2px;`
    );
export const getColor = (range: ColorRange): LCH => {
    return colorsFromRange(range, {
        variance: 0.0,
        rnd: RND,
    }).next().value as LCH;
};

export class Features {
    public variation: variation<FeaturesType>;
    public static variations: combinationFn<FeaturesType> = features('piece', [
        featureNumber('topColor', 12),
        featureNumber('bottomColor', 6),
        featureSet<number>(
            'horizon',
            [0.618, 0.5, 0.382],
            ['down', 'center', 'up']
        ),
        featureSet<number>('horizontalFold', [113, 365, 997, 2153, 3987]),
        featureSet<number>('verticalFold', [7, 37, 127, 571, 1501, 3147]),
        featureSet<number>('hectic', [3, 5, 11], ['calm', 'slightly', 'very']),
        featureSet<string>('topPhoto', [
            'zingst',
            'birds',
            'xmas',
            'zustand',
            'zebra',
            'moving-blocks-mono',
            'fischbach',
            'santanyi',
            'goldblume',
            '♠4',
            'driften',
            'brand-pyramide',
            'zäpfle',
            'bc',
            'tisa',
            'lieblingspulli',
        ]),
        featureSet<string>('bottomPhoto', [
            'zingst',
            'birds',
            'xmas',
            'zustand',
            'zebra',
            'moving-blocks-mono',
            'fischbach',
            'santanyi',
            'goldblume',
            '♠4',
            'driften',
            'brand-pyramide',
            'zäpfle',
            'bc',
            'tisa',
            'lieblingspulli',
        ]),
        featureSet<number>('minStripes', [1, 3, 5]),
    ]);

    public static combinations: number =
        Features.variations(0).numberOfVariations;

    public combination: number = 0;

    public maxStripes: number = 10;
    public currentStripes: number = 9;
    public minStripes: number = 1;
    public hectic: number;
    public collageMode: boolean = true;

    public topColor: LCH;
    public topColorCSS: string;
    public topColorRGB: number[];
    public bottomColor: LCH;
    public bottomColorCSS: string;
    public bottomColorRGB: number[];
    public horizon: number;
    public horizontalFold: number;
    public verticalFold: number;
    public topPhoto: string;
    public bottomPhoto: string;
    public topPhotoOffset: number = 0;
    public bottomPhotoOffset: number = 0;

    public constructor(combination: number) {
        this.combination = combination % Features.combinations;

        this.variation = Features.variations(combination);

        this.horizon = this.variation.value.horizon.value;

        let topColor =
            this.variation.value.topColor.value /
            this.variation.value.topColor.variations;
        this.topColor = getColor({
            h: [
                [
                    topColor == 0.0 ? topColor : topColor - Number.EPSILON,
                    topColor == 1.0 ? topColor : topColor + Number.EPSILON,
                ],
            ],
            c: [[0.8, 1.0]],
            l: [[0.8, 0.95]],
        });
        this.topColorCSS = css(this.topColor);
        this.topColorRGB = srgb(this.topColor).buf.slice(0, 3) as number[];

        let bottomColor =
            this.variation.value.bottomColor.value /
            this.variation.value.bottomColor.variations;
        bottomColor = mod(topColor + bottomColor * 0.4 + 0.2, 1.0);
        this.bottomColor = getColor({
            h: [
                [
                    bottomColor == 0.0
                        ? bottomColor
                        : bottomColor - Number.EPSILON,
                    bottomColor == 1.0
                        ? bottomColor
                        : bottomColor + Number.EPSILON,
                ],
            ],
            c: [[0.5, 0.7]],
            l: [[0.5, 0.7]],
        });
        this.bottomColorCSS = css(this.bottomColor);
        this.bottomColorRGB = srgb(this.bottomColor).buf.slice(
            0,
            3
        ) as number[];

        this.horizontalFold = this.variation.value.horizontalFold.value;
        this.verticalFold = this.variation.value.verticalFold.value;

        this.topPhoto = this.variation.value.topPhoto.value;
        this.bottomPhoto = this.variation.value.bottomPhoto.value;

        this.minStripes = this.variation.value.minStripes.value;

        this.hectic = this.variation.value.hectic.value;

        this.topPhotoOffset = rand() * 2 - 1;
        this.bottomPhotoOffset = rand() * 2 - 1;

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
            'top color': this.topColorCSS,
            'bottom color': this.bottomColorCSS,
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
        logColor(this.topColor, 'top');
        logColor(this.bottomColor, 'bottom');
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
}

export class Memories {
    private textures!: {
        [key: string]: WebGLTexture;
    };
    public loaded: boolean = false;
    public div!: HTMLDivElement;

    public constructor(
        private context: WebGL2RenderingContext,
        private piece: Piece
    ) {}

    public init() {
        if (!this.div) {
            this.div = document.createElement('div');
        }
        this.div.id = 'remembering';
        this.div.innerText = 'Remembering...';
        document.body.prepend(this.div);
        this.loaded = false;
        let options =
            this.piece.features.variation.value.topPhoto.variations.reduce(
                (pi: { [key: string]: { src: string } }, ci: string) => {
                    pi[ci] = {
                        src: `./memories/${ci}.jpg`,
                    };
                    return pi;
                },
                {}
            );
        this.textures = twgl.createTextures(this.context, options, () => {
            this.loaded = true;
            this.div.remove();
        });
    }

    public get topPhoto(): WebGLTexture {
        return this.textures[this.piece.features.topPhoto];
    }

    public get bottomPhoto(): WebGLTexture {
        return this.textures[this.piece.features.bottomPhoto];
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

            uniform float totalFrames;
            uniform float combination;
            uniform vec3 topColor;
            uniform vec3 bottomColor;
            uniform float horizonalAlignment;
            uniform float horizontalFold;
            uniform float verticalFold;
            uniform bool announcementActive;
            uniform sampler2D announcement;
            uniform sampler2D pixels;
            uniform sampler2D topPhoto;
            uniform sampler2D bottomPhoto;
            uniform vec4[${this.piece.features.maxStripes}] stripes;
            uniform float pixelSize;
            uniform float topPhotoOffset;
            uniform float bottomPhotoOffset;
            uniform int maxStripes;
            uniform int minStripes;
            uniform int currentStripes;
            uniform bool blackout;
            uniform float hectic;
            uniform int debugLevel;

            out vec4 color;

            void main() {
                
                float t = combination + totalFrames * 0.00166;
                
                float dx = sin(pos.y * verticalFold + t) + sin(pos.x * horizontalFold + t) * 0.1 + fract(pos.x * t) * 0.1;
                float dy = sin(pos.y * verticalFold + t) * 0.1 + sin(pos.x * horizontalFold + t) + fract(pos.y * t) * 0.1;
                
                float dc =  pixelSize * dx;
                float ds =  pixelSize * dy;
                
                vec4 downPixel = texture(bottomPhoto, (pos * 0.5 + 0.5) * vec2(1.0, -1.0) + vec2(dc, ds) + vec2(bottomPhotoOffset, 1.0 - topPhotoOffset));
                vec4 upPixel = texture(topPhoto, (pos * 0.5 + 0.5) * vec2(1.0, -1.0) + vec2(ds, dc) + vec2(1.0 - bottomPhotoOffset, topPhotoOffset));

                // up / down photo avg color
                vec2 di = vec2(
                    (downPixel.r + downPixel.g + downPixel.b),
                    (upPixel.r + upPixel.g + upPixel.b)
                ) / 3.0;

                if (debugLevel > 0) {
                    int si = int((pos.x * 0.5 + 0.5) * float(currentStripes));
                    int se = currentStripes + 1;
                    color = vec4(0.0);
                    for (int i = si; i < se; i++) {
                        vec4 stripe = stripes[i];

                        if (debugLevel > 1) {
                            float diffX = abs(pos.x - stripe.x);
                            float diffY = abs(pos.y - stripe.y);
                            if (diffX > pixelSize * stripe.z + di.x || diffY > pixelSize * stripe.w + di.y) {
                                continue;
                            }
                        }

                        if (dy < 0.0) {
                            if (stripe.z == 0.0) {
                                continue;
                            }
                            color = vec4(mix(
                            vec3(0.0),
                            bottomColor,
                            clamp(abs(pos.x - stripe.x / stripe.z), 0.0, 1.0)
                            ), 1.0);
                            return;
                        } else {
                            if (stripe.w == 0.0) {
                                continue;
                            }
                            color = vec4(mix(
                            vec3(0.0),
                            topColor,
                            clamp(abs(pos.y - stripe.y / stripe.w), 0.0, 1.0)
                            ), 1.0);
                            return;
                        }
                    }
                    return;
                }

                // rare moving variants depend on this ... somehow its magic
                color = texture(pixels, (pos * 0.5 + 0.5 - vec2(dc, ds)));
                
                // cut horizon up/down areas
                // todo: check values < -1 and > 1 with textures
                if (pos.y - di.y - ds > horizonalAlignment || pos.y + di.x + dc < horizonalAlignment) {
                    if (blackout) {
                        color = mix(vec4(0.0, 0.0, 0.0, 1.0), color, 1.0 - 1.0 / hectic);
                    } else {
                        discard;
                    }
                    return;
                }

                vec4 downRef = mix(
                    downPixel,
                    color,
                    di.x
                );

                vec4 upRef = mix(
                    upPixel,
                    color,
                    di.y
                );

                int currentx = 0;
                int currenty = 0;
                
                // check all stripes
                int si = int(floor((pos.x * 0.5 + 0.5)) * float(currentStripes));
                int se = currentStripes + 1;
                for (int i = si; i < se; i++) {
                    vec4 stripe = stripes[i];
                    
                    // find x boarders
                    if (stripe.x - stripe.z > dx || stripe.x + stripe.z < dx) {
                        currentx++;
                        if (currentx > minStripes) {
                            if (blackout) {
                                color = mix(vec4(0.0, 0.0, 0.0, 1.0), color, 1.0 - 0.1 / hectic);
                            } else {
                                discard;
                            }
                            return;
                        }
                        continue;
                    }

                    // find y boarders
                    if (stripe.y - stripe.w > dy || stripe.y + stripe.w < dy) {
                        currenty++;
                        if (currenty > minStripes) {
                            if (blackout) {
                                color = mix(vec4(0.0, 0.0, 0.0, 1.0), color, 1.0 - 0.1 / hectic);
                            } else {
                                discard;
                            }
                            return;
                        }
                        continue;
                    }

                    float diffX = abs(pos.x - stripe.x);
                    float diffY = abs(pos.y - stripe.y);
                    if (diffX > pixelSize * stripe.z + di.x || diffY > pixelSize * stripe.w + di.y) {
                        continue;
                    }
                    
                     // stripe, fold & paint
                     if (dy < 0.0) {
                         if (stripe.z == 0.0) {
                             continue;
                         }
                        vec4 shift = texture(topPhoto, pos * 0.5 + 0.5 + pixelSize * vec2(stripe.z, stripe.w));
                        vec2 s = vec2(
                        distance(shift, upRef) * stripe.z,
                        distance(shift, downRef) * stripe.w
                        );
                        vec4 ref = texture(pixels, pos * 0.5 + 0.5 + pixelSize * s);
                        color = mix(
                            ref, 
                            vec4(
                                mix(
                                    ref.rgb, 
                                    bottomColor * 0.5 - downRef.rgb * 0.618, 
                                    clamp(abs(pos.x - stripe.x / stripe.z), -1.0, 2.0)
                                ), 
                                1.0
                            ), 
                            clamp(-dy, 0.0, 1.0)
                        );
                    } else {
                         if (stripe.w == 0.0) {
                             continue;
                         }
                        vec4 shift = texture(bottomPhoto, pos * 0.5 + 0.5 - pixelSize * vec2(stripe.z, stripe.w));
                        vec2 s = vec2(
                        distance(shift, downRef) * stripe.w,
                        distance(shift, upRef) * stripe.z
                        );
                        vec4 ref = texture(pixels, pos * 0.5 + 0.5 - pixelSize * s);
                        color = mix(
                            ref,
                            vec4(
                                mix(
                                    ref.rgb,
                                    topColor * 0.618 + upRef.rgb * 0.5,
                                    clamp(abs(pos.y- stripe.y / stripe.w), -1.0, 2.0)
                                ), 
                                1.0
                            ),
                            clamp(dy, 0.0, 1.0)
                        );
                    }
                    break;
                }
                
                if (announcementActive) {
                    vec4 a = texture(announcement, vec2(1.05, -1.05) * (pos.xy * 0.5 + 0.5));
                    if (a.a > 0.0) { 
                        color = mix(color, vec4(0.0, 0.0, 0.0, 1.0), 0.618);
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
    }

    public tick(_timeMs: number) {
        if (!this.piece.memories.loaded) {
            return;
        }
        this.context.useProgram(this.program.program);
        twgl.setBuffersAndAttributes(this.context, this.program, this.buffer);
        twgl.setUniforms(this.program, {
            totalFrames: Number(this.piece.stripes.totalFrames),
            combination: this.piece.combination * 0.00000001, // based on max glsl float size
            announcementActive: this.piece.announcement.active,
            announcement: this.piece.announcement
                ? this.piece.announcement.texture
                : 0,
            topColor: this.piece.features.topColorRGB,
            bottomColor: this.piece.features.bottomColorRGB,
            horizon: this.piece.features.horizon * 2.0 - 1.0,
            stripes: this.piece.stripes.data, // vec4
            foldsTotal: this.piece.stripes.total,
            pixelSize: 1.0 / this.piece.baseHeightWidth,
            pixels: this.outputs[this.outputIndex].attachments[0],
            horizontalFold: this.piece.features.horizontalFold,
            verticalFold: this.piece.features.verticalFold,
            topPhoto: this.piece.memories.topPhoto,
            topPhotoOffset: this.piece.features.topPhotoOffset,
            bottomPhoto: this.piece.memories.bottomPhoto,
            bottomPhotoOffset: this.piece.features.bottomPhotoOffset,
            maxStripes: this.piece.features.maxStripes,
            minStripes: this.piece.features.minStripes,
            currentStripes: this.piece.features.currentStripes,
            blackout: this.piece.features.collageMode,
            hectic: this.piece.features.hectic,
            debugLevel: this.piece.debugLevel,
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
        this.canvas.style.letterSpacing = '-3px';

        let context = this.canvas.getContext('2d') as CanvasRenderingContext2D;

        context.fillStyle = '#ffffff';
        context.translate(this.canvas.width / 2, this.canvas.height / 2);
        // context.rotate((-7 / 180) * Math.PI);
        context.textAlign = 'center';
        context.font = '350px sans-serif';
        context.fillText('Fischbach', 20, 100);
        context.font = '80px sans-serif';
        context.fillText('THU 17th November 2022, 19:00 UTC', 100, 170);
        context.fillText('on fxhash.xyz #fxhashturnsone', -100, 240);

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
            uniform vec3 topColor;
            uniform bool debug;

            void main() {
                if (debug == true) {
                    color = texture(pixels, pos);
                } else {
                    color = texture(pixels, pos);
                    color = vec4(color.rgb, 1.0);
                    if (announcementActive) {
                        vec4 a = texture(announcement, pos * vec2(1.05, -1.05));
                        if (a.a > 0.0) {
                            color = vec4(mix(color.rgb, topColor, a.a), 1.0);
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
                topColor: this.piece.features.topColorRGB,
            });
        } else {
            twgl.setUniforms(this.program, {
                pixels: this.piece.outputs.buffers[this.piece.outputIndex]
                    .attachments[0],
                debug: true,
                announcementActive: false,
                announcement: 0,
                topColor: this.piece.features.topColorRGB,
            });
        }
        twgl.bindFramebufferInfo(this.context, null);
        twgl.drawBufferInfo(this.context, this.buffer);
    }
}

export class Piece {
    public features!: Features;

    public static title: string = 'Fischbach';
    public static defaultPixelRatio: number = window.devicePixelRatio;
    public static defaultNextTouch: number = 200;

    public width: number = 0;
    public height: number = 0;
    public baseHeightWidth: number = 1980;
    public fps: number = 60;

    public canvas: HTMLCanvasElement;
    public context!: WebGL2RenderingContext;

    public stripes!: Stripes;

    public combination: number;

    public inPreviewPhase!: boolean;
    public previewPhaseEndsAfterBase: number = 300;
    public previewPhaseEndsAfter!: number;

    public nextTouchBase: number = 50;
    public nextTouch: number = Piece.defaultNextTouch;

    public paused: boolean = false;

    public outputs!: Outputs;
    public outputIndex: number | null = null;

    public memories!: Memories;
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
        public autoPause: boolean = true,
        public pixelRatio: number = Piece.defaultPixelRatio,
        announcementActive: boolean = false,
        public kioskSpeed: number | null = null
    ) {
        this.canvas = canvas;
        this.combination = combination;

        randInit(window.fxhash);

        this.features = new Features(this.combination);
        this.inPreviewPhase = true;
        this.paused = false;

        this.stripes = new Stripes(this);
        this.stripes.init();

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
            premultipliedAlpha: true,
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

        this.memories = new Memories(this.context, this);
        this.memories.init();
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
        this.previewPhaseEndsAfter = this.previewPhaseEndsAfterBase;
        this.width = width * this.pixelRatio;
        this.height = height * this.pixelRatio;

        this.canvas.dispatchEvent(new Event('piece.updateSize'));

        this.context.canvas.width = this.width;
        this.context.canvas.height = this.height;
        this.context.viewport(0, 0, this.width, this.height);

        this.initBackground();
    }

    public initBackground() {
        document.body.style.backgroundColor = '#000000';
    }

    public tick(timeMs: number) {
        if (!this.initWebglDone) {
            return;
        }

        this.tickCaptureImage();

        if (!this.memories.loaded) {
            return;
        }

        if (this.nextTouch-- < 0) {
            this.nextTouch = 0;
            this.touch();
        }

        this.stripes.tick(timeMs);

        if (!this.paused) {
            this.pixels.tick(timeMs);
        }

        this.kiosk.tick(timeMs);
        this.screen.tick(timeMs);

        if (
            this.inPreviewPhase &&
            this.stripes.totalFrames >= this.previewPhaseEndsAfter
        ) {
            this.inPreviewPhase = false;
            this.paused = this.autoPause;
        }
    }

    public touch() {
        if (this.paused) {
            return;
        }

        this.features.horizontalFold =
            randOptions(
                this.features.variation.value.horizontalFold.variations
            ) * randOptions([-1, 1]);
        this.features.verticalFold =
            randOptions(this.features.variation.value.verticalFold.variations) *
            randOptions([-1, 1]);
        this.features.topPhotoOffset = rand() * 2 - 1;
        this.features.bottomPhotoOffset = rand() * 2 - 1;
        this.features.minStripes = randOptions(
            this.features.variation.value.minStripes.variations
        );
        this.features.currentStripes =
            randInt(this.features.maxStripes - this.features.minStripes - 1) +
            1 +
            this.features.minStripes;
        this.features.collageMode = randInt(7) == 0;

        console.debug(
            this.features.horizon,
            this.features.horizontalFold,
            this.features.verticalFold,
            this.features.topPhotoOffset,
            this.features.bottomPhotoOffset,
            this.features.minStripes,
            this.features.currentStripes,
            this.features.collageMode
        );

        this.nextTouch =
            randInt(this.previewPhaseEndsAfterBase) + this.nextTouchBase;
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
        this.piece.nextTouch = Piece.defaultNextTouch;
    }

    public get active(): boolean {
        return this.speedSec !== null;
    }

    public get speedSec(): number | null {
        return this._speedSec;
    }
}

export class Stripes {
    public totalFrames: bigint = BigInt(0);
    public items: Array<Stripe> = [];
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

        this.count = this.items.reduce(
            (c, item) => (item.tick() ? c + 1 : c),
            0
        );

        this.total += BigInt(this.piece.features.maxStripes - this.count);
    }

    private add(): void {
        this.items.push(new Stripe(this.items.length, this.data, this.piece));
        this.total++;
    }

    public init(): void {
        this.items = [];
        this.count = 0;
        this.total = BigInt(0);
        this.data = new Float32Array(
            this.piece.features.maxStripes * Stripe.dataPoints
        );

        do {
            this.add();
        } while (this.items.length < this.piece.features.maxStripes);
    }
}

export class Stripe {
    public static dataPoints: number = 4;
    private static distance: number = 10;
    private dataIndex: number;
    public x: number = 0.0;
    public y: number = 0.0;
    public distanceX: number = 0.0;
    public distanceY: number = 0.0;
    public active: boolean = false;
    public update: boolean = false;

    public constructor(
        public index: number,
        public data: Float32Array,
        public readonly piece: Piece
    ) {
        this.piece = piece;
        this.dataIndex = index * Stripe.dataPoints;
    }

    public activate() {
        this.x = rand();
        this.y = this.piece.features.horizon;
        this.distanceX = rand() * Stripe.distance;
        this.distanceY = rand() * Stripe.distance;
        this.active = true;
        this.update = randBoolean();

        this.updateData();
    }

    private updateData() {
        this.data[this.dataIndex] = this.x * 2.0 - 1.0;
        this.data[this.dataIndex + 1] = 2.0 - this.y * 2.0 - 1.0;
        this.data[this.dataIndex + 2] = this.distanceY;
        this.data[this.dataIndex + 3] = this.distanceX;
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

        if (!this.update) {
            this.update = randBoolean();
            return true;
        }

        this.x += (rand() * 0.01 - 0.005) * this.piece.features.hectic;
        this.y += (rand() * 0.01 - 0.005) * this.piece.features.hectic;

        this.x = clamp(this.x, 0, 1);
        this.y = clamp(this.y, 0, 1);

        this.update = randBoolean();

        this.distanceY += (rand() * 0.01 - 0.005) * this.piece.features.hectic;
        this.distanceX += (rand() * 0.01 - 0.005) * this.piece.features.hectic;

        this.distanceY = clamp(this.distanceY, 0, Stripe.distance);
        this.distanceX = clamp(this.distanceX, 0, Stripe.distance);

        this.updateData();
        return true;
    }
}
