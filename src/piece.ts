import { Area, rand, randInit, randInt, randOptions } from './rand';
import { color, ColorSpec } from './color';
import * as isec from '@thi.ng/geom-isec';
import { Circle, Quad } from './shapes';
import * as twgl from 'twgl.js';

export type FxhashFeatures = {
    color: string;
    colorShiftDir: number;
    colorShiftFactor: number;
    gradientSteps: string;
    gradient: string;
    shape: string;
    rotation: number;
    rotationDir: number;
    animation: string;
};

export class Features {
    public combination: number = 1;

    public readonly colorHue: number;
    public readonly colorName: string;
    public readonly colorHueBase: number;
    public readonly color: ColorSpec;
    public readonly colorSaturation: number;
    public readonly colorValueMin: number;
    public readonly colorValueMax: number;

    public readonly gradientStepsBase: number;
    public readonly gradientSteps: number;
    public readonly gradient: Array<ColorSpec>;

    public readonly colorShiftDirBase: number;
    public readonly colorShiftDir: number;

    public readonly colorShiftFactorBase: number;
    public readonly colorShiftFactor: number;

    private rotationOptions: Array<number> = [45, 0];
    public rotationBase: number;
    public rotation: number;
    public rotationRadians: number;
    public rotationCos: number;
    public rotationSin: number;

    public rotationDirBase: number;
    public rotationDir: number;

    public maxMovingBlocks: number = 8 * 128;
    public framebufferForOffsets: number = 8;
    public framebufferForMovingBlocks: number = 2;

    public readonly gridSize: number = 8 * 24;
    public readonly blockSize: number = 8;

    public readonly shapeBase: number;
    public readonly shapes: Array<Circle | Quad> = [];

    public readonly colorRGBMax: number;

    public static animationOptions: Array<
        Array<Array<'left' | 'up' | 'down' | 'right'>>
    > = [
        [['up'], ['left'], ['down'], ['right']],
        [
            ['left', 'up'],
            ['left', 'down'],
            ['right', 'up'],
            ['right', 'down'],
        ],
        [['right'], ['right', 'up'], ['right', 'down']],
        [['left'], ['left', 'up'], ['left', 'down']],
        [['up'], ['left', 'up'], ['right', 'up']],
        [['down'], ['left', 'down'], ['right', 'down']],
        [
            ['up'],
            ['left'],
            ['down'],
            ['right'],
            ['left', 'up'],
            ['left', 'down'],
            ['right', 'up'],
            ['right', 'down'],
        ],
        [['left'], ['left', 'up'], ['up']],
        [['left'], ['left', 'down'], ['down']],
        [['right'], ['right', 'up'], ['up']],
        [['right'], ['right', 'down'], ['down']],
        [['right'], ['right', 'down'], ['left'], ['left', 'up']],
        [['right'], ['right', 'up'], ['left'], ['left', 'down']],
        [['down'], ['right', 'down'], ['up'], ['left', 'up']],
    ];
    public animationBase: number;
    public animation: Array<Array<'left' | 'up' | 'down' | 'right'>>;

    // todo: organize combinations
    public static combinations: number =
        2 *
        3 *
        2 *
        2 *
        3 *
        Features.animationOptions.length *
        Object.keys(color.palettes['unique-css-light']).length *
        3;

    public constructor(combination: number) {
        this.combination = combination % Features.combinations;
        console.log(combination);

        this.colorShiftDirBase = combination % 2;
        this.colorShiftDir = [-1, 1][this.colorShiftDirBase];
        combination = (combination / 2) << 0;

        this.colorShiftFactorBase = combination % 3;
        this.colorShiftFactor = [1, 2, 3][this.colorShiftFactorBase];
        combination = (combination / 3) << 0;

        this.shapeBase = combination % 2;
        combination = (combination / 2) << 0;

        this.rotationBase = combination % this.rotationOptions.length;
        this.rotation = this.rotationOptions[this.rotationBase];
        this.rotationRadians = (Math.PI / 180) * this.rotation;
        this.rotationCos = Math.cos(this.rotationRadians);
        this.rotationSin = Math.sin(this.rotationRadians);
        combination = (combination / this.rotationOptions.length) << 0;

        this.rotationDirBase = combination % 3;
        this.rotationDir = [-1, 0, 1][this.rotationDirBase];
        combination = (combination / 3) << 0;

        this.animationBase = combination % Features.animationOptions.length;
        this.animation = Features.animationOptions[this.animationBase];
        combination = (combination / Features.animationOptions.length) << 0;

        let colors = Object.values(color.palettes['unique-css-light']);
        let colorsDark = Object.values(color.palettes['unique-css-dark']);
        let colorsLight = Object.values(color.palettes['unique-css-light']);
        let colorsRGB = [
            Object.values(color.palettes['unique-css-red']),
            Object.values(color.palettes['unique-css-green']),
            Object.values(color.palettes['unique-css-blue']),
        ];
        this.colorHueBase = combination % colors.length;
        this.colorName = colors[this.colorHueBase].name;
        this.color = colors[this.colorHueBase];
        this.colorHue = this.color.hsv[0];
        this.colorSaturation = this.color.hsv[1];
        this.colorValueMin = 0.4;
        this.colorValueMax = this.color.hsv[2];
        combination = (combination / colors.length) << 0;

        this.colorRGBMax = Math.max(...this.color.rgb);

        let rgbIndex = color.rgbIndex(
            ...(this.color.rgb as [number, number, number])
        );

        console.log(this.color.rgb);
        console.log(rgbIndex);

        this.gradientStepsBase = combination % 3;
        this.gradientSteps = [1, 2, 6][this.gradientStepsBase];
        this.gradient = [
            colorsRGB[rgbIndex[0]][randInt(colorsRGB[rgbIndex[0]].length)],
            colorsDark[randInt(colorsDark.length)],
            colorsRGB[rgbIndex[2]][randInt(colorsRGB[rgbIndex[2]].length)],
            colorsRGB[rgbIndex[2]][randInt(colorsRGB[rgbIndex[2]].length)],
            colorsLight[randInt(colorsLight.length)],
            colorsDark[randInt(colorsDark.length)],
        ];

        console.log(this.gradient.map((cs) => cs.name));

        let r = 0.45;
        this.shapes.push(new Circle(0.5, 0.5, r));
        let c = 0; //rand() * 0.2 - 0.1;
        let p = 0.02;
        let w = 0.1 - p + rand() * 0.1;
        r = r - w;

        this.shapes.push(
            this.shapeBase === 0
                ? new Circle(0.5 + c, 0.5 + c, r)
                : new Quad(0.5 + c - r / 2, 0.5 + c - r / 2, r)
        );
        r -= p;
        this.shapes.push(
            this.shapeBase === 0
                ? new Circle(0.5 + c, 0.5 + c, r)
                : new Quad(0.5 + c - r / 2, 0.5 + c - r / 2, r)
        );
    }

    public getFxhashFeatures(): FxhashFeatures {
        return {
            color: this.colorName,
            colorShiftDir: this.colorShiftDir,
            colorShiftFactor: this.colorShiftFactor,
            gradientSteps: ['mono', 'duo', 'hexa'][this.gradientStepsBase],
            gradient: this.getGradientFeature(),
            shape: this.shapeBase === 0 ? 'circle' : 'quad',
            rotation: this.rotation,
            animation: this.animation.map((i) => i.join('-')).join(', '),
            rotationDir: this.rotationDir,
        };
    }

    public getGradientFeature() {
        return [
            [this.gradient[1]],
            [this.gradient[1], this.gradient[2]],
            this.gradient,
        ][this.gradientStepsBase]
            .map((c) => c.name)
            .join(', ');
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
}

export class Piece {
    public features!: Features;

    public width: number = 0;
    public height: number = 0;
    public baseHeightWidth: number = 1600;
    public fps: number = 60;
    public pixelRatio: number = 2;

    public canvas: HTMLCanvasElement;
    public context!: WebGL2RenderingContext;

    public movingBlocks!: MovingBlocks;

    public combination: number;

    public inPreviewPhase!: boolean;
    public previewPhaseEndsAfterBase: number = 400;
    public previewPhaseEndsAfter!: number;

    public debug!: DebugPiece;

    public outputBuffer: number | null = null;

    public paused: boolean = false;

    public rotationState: number = 0;

    public constructor(
        canvas: HTMLCanvasElement,
        width: number,
        height: number,
        combination: number
    ) {
        this.canvas = canvas;
        this.combination = combination;

        this.updateSize(width, height);

        this.debug = new DebugPiece(this);
    }

    private initState() {
        randInit(window.fxhash);
        this.features = new Features(this.combination);
        this.movingBlocks = new MovingBlocks(this);
        this.inPreviewPhase = true;
        this.movingBlocks.init();
        this.paused = false;
        this.initWebgl();
    }

    public programDraw!: twgl.ProgramInfo;
    public positionBuffer!: twgl.BufferInfo;
    public programPixels!: twgl.ProgramInfo;

    public programOffsets!: twgl.ProgramInfo;
    public programInit!: twgl.ProgramInfo;

    public framebuffers!: Array<twgl.FramebufferInfo>;
    public framebufferPixelsIndex: number = 0;
    public bufferOffsets!: twgl.BufferInfo;

    private initWebgl() {
        if (this.context instanceof WebGL2RenderingContext) {
            return;
        }
        let precision = `
            precision mediump float;
            precision mediump int;
            precision mediump sampler2D;
            `;
        // init canvas & context
        this.context = twgl.getContext(this.canvas, {
            depth: false,
            preserveDrawingBuffer: true,
        }) as WebGL2RenderingContext;

        // init framebuffers
        const vInit = `#version 300 es
            ${precision}

            in vec2 position;

            void main() {
                gl_Position = vec4(position, 0.0, 1.0);
            }`;
        const fInit = `#version 300 es
            precision mediump float;

            uniform vec3 baseColor;
            
            out vec4 outColor;

            void main() {
                outColor = vec4(baseColor, 0.0);
            }`;

        const vDraw = `#version 300 es
            ${precision}
        
            in vec2 position;
            out vec2 v_position;
            
            uniform mat4 world;
        
            void main() {
               gl_Position = vec4(position, 0.0, 1.0);
               v_position = 0.5 * (position + 1.0);
            }`;
        const fDraw = `#version 300 es
            ${precision}
            
            in vec2 v_position;
            out vec4 outColor;
            
            uniform sampler2D pixels;
           
            void main() {
              outColor = vec4(texture(pixels, v_position).rgb, 1.0); 
            }`;
        this.programDraw = twgl.createProgramInfo(this.context, [vDraw, fDraw]);
        this.context.useProgram(this.programDraw.program);

        const vOffsets = `#version 300 es
            ${precision}
        
            in vec4 block;
            out vec4 color;
            
            uniform float pixelSize;
            uniform float blockWidthHeight;
            
            uniform mat4 world;
        
            void main() {
               // ignore inactive ones
               if (block.x == 0.0 && block.y == 0.0 && block.z == 0.0 && block.w == 0.0) {
                    color = vec4(0.0);
                    gl_PointSize = 0.0;
                    gl_Position = world * vec4(0.0, 0.0, 0.0, 1.0);
               } else {
                   color = vec4(0.5 * (block.zw + 1.0), 1.0, 0.0); // convert to color 0-1
                   gl_PointSize = pixelSize;
                   gl_Position = world * vec4(block.x + blockWidthHeight, block.y - blockWidthHeight, 0.0, 1.0);
               }        
            }`;
        const fOffsets = `#version 300 es
            precision mediump float;
            
            in vec4 color;
            out vec4 outColor;
            
            void main() {
                outColor = color;
            }`;

        // create framebuffer for texture
        const vMoveBlocks = `#version 300 es
            ${precision}

            in vec2 position;
            out vec2 v_position;
            
            uniform float pixelSize;
            uniform mat4 world;
        
            void main() {
               gl_Position = world * vec4(position, 0.0, 1.0);
               v_position = 0.5 * (position + 1.0);
            }`;
        const fMoveBlocks = `#version 300 es
            ${precision}
        
            in vec2 v_position;
            in vec2 offset;
            
            out vec4 outColor;
            
            uniform int drawId;
            uniform sampler2D pixels;
            uniform sampler2D offsets;
            uniform int gradientSteps;
            uniform vec3[6] gradient;
            uniform sampler2D u_offsets;
            uniform vec3 baseColor;
            uniform float pixelSize;
            uniform float pixelWidth;
            uniform ivec3 colorRGBIndex;
            uniform vec3 colorRGBMin;
            uniform float colorShiftFactor;
            uniform vec2 colorShiftRGBDir;
            uniform float colorShiftDir;
            uniform float  timeMs;
    
            float rollover(float value, float min, float max) {
                if (value > max) {
                    return abs(max - value) + min;
                }
                
                if (value < min) {
                    return max - abs(value - min);
                }
                
                return value;
            }
            
            // see https://github.com/dmnsgn/glsl-rotate
            mat2 rotation2d(float angle) {
              float s = sin(angle);
              float c = cos(angle);
            
              return mat2(
                c, -s,
                s, c
              );
            }
            
            vec2 rotate(vec2 v, float angle) {
              return rotation2d(angle) * v;
            }
            
            mat4 rotation3d(vec3 axis, float angle) {
              axis = normalize(axis);
              float s = sin(angle);
              float c = cos(angle);
              float oc = 1.0 - c;
            
              return mat4(
                oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                0.0,                                0.0,                                0.0,                                1.0
              );
            }
            
            vec3 rotate(vec3 v, vec3 axis, float angle) {
              return (rotation3d(axis, angle) * vec4(v, 1.0)).xyz;
            }
            
            vec3 bezier(vec3 A, vec3 B, float t) {
              return mix(A, B, t);
            }
            
            vec3 bezier(vec3 A, vec3 B, vec3 C, float t) {
              vec3 E = mix(A, B, t);
              vec3 F = mix(B, C, t);
            
              vec3 P = mix(E, F, t);
            
              return P;
            }
            
            vec3 bezier(vec3 A, vec3 B, vec3 C, vec3 D, float t) {
              vec3 E = mix(A, B, t);
              vec3 F = mix(B, C, t);
              vec3 G = mix(C, D, t);
            
              vec3 H = mix(E, F, t);
              vec3 I = mix(F, G, t);
            
              vec3 P = mix(H, I, t);
            
              return P;
            }

            vec3 bezier(vec3 A, vec3 B, vec3 C, vec3 D, vec3 E, float t) {
              vec3 A1 = mix(A, B, t);
              vec3 B1 = mix(B, C, t);
              vec3 C1 = mix(C, D, t);
              vec3 D1 = mix(D, E, t);
            
              vec3 A2 = mix(A1, B1, t);
              vec3 B2 = mix(B1, C1, t);
              vec3 C2 = mix(C1, D1, t);
            
              vec3 A3 = mix(A2, B2, t);
              vec3 B3 = mix(B2, C2, t);
              
              vec3 P = mix(A3, B3, t);
            
              return P;
            }
            
            vec3 bezier(vec3 A, vec3 B, vec3 C, vec3 D, vec3 E, vec3 F, vec3 G, float t) {
              vec3 A1 = mix(A, B, t);
              vec3 B1 = mix(B, C, t);
              vec3 C1 = mix(C, D, t);
              vec3 D1 = mix(D, E, t);
              vec3 E1 = mix(E, F, t);
              vec3 F1 = mix(F, G, t);
            
              vec3 A2 = mix(A1, B1, t);
              vec3 B2 = mix(B1, C1, t);
              vec3 C2 = mix(C1, D1, t);
              vec3 D2 = mix(D1, E1, t);
              vec3 E2 = mix(E1, F1, t);
            
              vec3 A3 = mix(A2, B2, t);
              vec3 B3 = mix(B2, C2, t);
              vec3 C3 = mix(C2, D2, t);
              vec3 D3 = mix(D2, E2, t);
            
              vec3 A4 = mix(A3, B3, t);
              vec3 B4 = mix(B3, C3, t);
              vec3 C4 = mix(C3, D3, t);
            
              vec3 A5 = mix(A4, B4, t);
              vec3 B5 = mix(B4, C4, t);
              
              vec3 P = mix(A5, B5, t);
            
              return P;
            }

            vec4 shiftColor(vec4 color) {
                if (gradientSteps == 1) {
                    return vec4(
                        bezier(
                            baseColor.rgb, 
                            gradient[1],
                            color.a
                        ),
                        color.a
                    );
                }
                
                if (gradientSteps == 2) {
                    return vec4(
                        bezier(
                            baseColor.rgb, 
                            gradient[1],
                            gradient[2],
                            color.a
                        ),
                        color.a
                    );
                }
                
                return vec4(
                    bezier(
                        baseColor.rgb, 
                        gradient[0], 
                        gradient[1],
                        gradient[2], 
                        gradient[3], 
                        gradient[4],
                        gradient[5],
                        color.a
                    ),
                    color.a
                );
            }

            void main() {
                vec4 singleOffset;
                vec2 offset;
                vec2 offsetPos;
                vec4 color;
    
                singleOffset = texture(offsets, v_position);
                
                offset = singleOffset.rg * 2.0 - 1.0; // convert back from color > -1 to 1
                offsetPos = offset.xy * 40.0 * pixelWidth; // convert back to -100 / 100 and normalize 
                
                if (singleOffset.b == 0.0) {
                    color = texture(pixels, v_position);
                } else {
                    color = texture(pixels, v_position - offsetPos.xy);
                    color.a = rollover(color.a + colorShiftDir * colorShiftFactor, 0.0, 1.0);
                    color = shiftColor(color);
                }
                outColor = color;
            }`;

        const n = this.baseHeightWidth; //this.gl.canvas.width;
        const m = this.baseHeightWidth; //this.gl.canvas.height;
        // const initColor = [...this.features.color.rgb.map((c) => c / 255), 1.0];
        this.framebuffers = [
            ...Array(
                this.features.framebufferForOffsets +
                    this.features.framebufferForMovingBlocks
            ),
        ].map((_) => {
            let attachments = [
                {
                    attachmentPoint: WebGL2RenderingContext.COLOR_ATTACHMENT0,
                    format: this.context.RGBA,
                    type: this.context.UNSIGNED_BYTE,
                    min: this.context.NEAREST,
                    mag: this.context.NEAREST,
                    wrap: this.context.CLAMP_TO_EDGE,
                    // color: [1.0, 0.5, 0.0, 1.0],
                },
            ];

            return twgl.createFramebufferInfo(this.context, attachments, n, m);
        });

        this.framebufferPixelsIndex = 0; // point to the first index
        this.programPixels = twgl.createProgramInfo(this.context, [
            vMoveBlocks,
            fMoveBlocks,
        ]);

        const blocks = {
            block: {
                data: this.movingBlocks.normalized(),
                numComponents: 4,
            },
        };
        this.bufferOffsets = twgl.createBufferInfoFromArrays(
            this.context,
            blocks
        );

        const position = {
            position: {
                data: [-1, 1, 1, 1, 1, -1, 1, -1, -1, -1, -1, 1],
                numComponents: 2,
            },
        };
        this.positionBuffer = twgl.createBufferInfoFromArrays(
            this.context,
            position
        );

        // init offsets program
        this.programOffsets = twgl.createProgramInfo(this.context, [
            vOffsets,
            fOffsets,
        ]);

        // colorize framebuffers that are used for moving pixels
        this.programInit = twgl.createProgramInfo(this.context, [vInit, fInit]);

        this.context.useProgram(this.programInit.program);
        twgl.setBuffersAndAttributes(
            this.context,
            this.programInit,
            this.positionBuffer
        );

        twgl.setUniforms(this.programInit, {
            baseColor: this.features.color.rgb.map((v) => v / 255),
        });
        twgl.bindFramebufferInfo(
            this.context,
            this.framebuffers[this.features.framebufferForOffsets]
        );
        twgl.drawBufferInfo(this.context, this.positionBuffer);

        twgl.bindFramebufferInfo(
            this.context,
            this.framebuffers[1 + this.features.framebufferForOffsets]
        );
        twgl.drawBufferInfo(this.context, this.positionBuffer);
    }

    public updateSize(
        width: number,
        height: number,
        pixelRatio: number | null = null
    ) {
        this.initState();
        let wh = Math.min(width, height);
        let f = wh / this.baseHeightWidth;
        // todo: handle pixel ratio on webgl2 context
        if (pixelRatio === null) {
            this.pixelRatio = Math.ceil(
                (wh + wh) / 2 / this.baseHeightWidth / 2
            );
        } else {
            this.pixelRatio = pixelRatio;
        }
        this.previewPhaseEndsAfter =
            this.previewPhaseEndsAfterBase / this.pixelRatio;
        this.width = (this.baseHeightWidth / this.pixelRatio) << 0;
        this.height = (this.baseHeightWidth / this.pixelRatio) << 0;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.canvas.style.width = `${
            ((this.width * f) / width) * 100 * this.pixelRatio
        }%`;
        this.canvas.style.height = `${
            ((this.height * f) / height) * 100 * this.pixelRatio
        }%`;

        this.canvas.dispatchEvent(new Event('piece.updateSize'));

        // twgl.resizeCanvasToDisplaySize(this.gl.canvas);
        this.context.canvas.width = this.width;
        this.context.canvas.height = this.height;
        this.context.canvas.style.width = `${
            ((this.width * f) / width) * 100 * this.pixelRatio
        }%`;
        this.context.canvas.style.height = `${
            ((this.height * f) / height) * 100 * this.pixelRatio
        }%`;
        this.context.viewport(
            0,
            0,
            this.context.canvas.width,
            this.context.canvas.height
        );

        this.initBackground();
    }

    public initBackground() {
        document.body.style.backgroundColor = color.hsvCss(
            this.features.colorHue,
            this.features.colorSaturation,
            this.features.colorValueMax
        );
    }

    public init: number = 1;
    public tick(timeMs: number) {
        this.tickCaptureImage();

        if (this.paused) {
            return;
        }

        this.debug.tickPiece();

        this.movingBlocks.tick();

        this.tickWebgl(timeMs);

        if (
            this.inPreviewPhase &&
            this.movingBlocks.totalFrames >= this.previewPhaseEndsAfter
        ) {
            this.inPreviewPhase = false;
            this.paused = true;
        }
    }

    public tickWebgl(timeMs: number) {
        if (this.positionBuffer === undefined) {
            return;
        }

        this.rotationState += 1000 / 60; // 60fps

        let world = twgl.m4.identity();

        // todo: use fix array reference instead of building up new one each frame
        const movingBlocks = this.movingBlocks.normalized();
        const movingBlocksChunkLength =
            this.features.maxMovingBlocks / this.features.framebufferForOffsets;

        // draw offsets maps - distribute blocks over multiple layers to minimize overlapping / enable multi offset shifts
        this.context.useProgram(this.programOffsets.program);
        twgl.setBuffersAndAttributes(
            this.context,
            this.programOffsets,
            this.bufferOffsets
        );
        twgl.setAttribInfoBufferFromArray(
            this.context,
            this.bufferOffsets.attribs?.block as twgl.AttribInfo,
            movingBlocks
        );
        twgl.setUniforms(this.programOffsets, {
            pixelSize:
                (this.features.blockSize / this.features.gridSize) *
                this.context.canvas.width,
            blockWidthHeight: this.features.blockSize / this.features.gridSize,
            world: twgl.m4.rotateZ(world, -0.005 * this.features.rotationDir),
        });

        for (let i = 0; i < this.features.framebufferForOffsets; i++) {
            twgl.bindFramebufferInfo(this.context, this.framebuffers[i]);

            this.context.clearColor(0.0, 0.0, 0.0, 0.0);
            this.context.clear(this.context.COLOR_BUFFER_BIT);

            twgl.drawBufferInfo(
                this.context,
                this.bufferOffsets,
                WebGL2RenderingContext.POINTS,
                movingBlocksChunkLength,
                movingBlocksChunkLength * i
            );
        }

        // draw moving pixels based on offset layers - toggle pixel buffers per layer
        this.context.useProgram(this.programPixels.program);
        twgl.setBuffersAndAttributes(
            this.context,
            this.programPixels,
            this.positionBuffer
        );

        let uniform = {
            baseColor: this.features.color.rgb.map((c) => c / 255),
            pixelSize:
                (this.features.blockSize / this.features.gridSize) *
                this.context.canvas.width,
            pixelWidth: 1 / this.context.canvas.width,
            pixels: this.framebuffers[
                this.framebufferPixelsIndex +
                    this.features.framebufferForOffsets
            ].attachments[0],
            offsets: this.framebuffers[0].attachments[0],
            gradientSteps: this.features.gradientSteps,
            gradient: this.features.gradient
                .map((cs) => cs.rgb.map((c) => c / 255))
                .flat(),
            timeMs: timeMs,
            colorShiftFactor: this.features.colorShiftFactor,
            colorShiftDir: this.features.colorShiftDir / 255,
        };
        let scaleFactor = this.features.rotationDir === 0 ? 0.996 : 0.998;
        twgl.setUniforms(this.programPixels, uniform);
        for (let i = 0; i < this.features.framebufferForOffsets; i++) {
            twgl.setUniforms(this.programPixels, {
                world:
                    i === this.features.framebufferForOffsets - 1
                        ? twgl.m4.rotateZ(
                              twgl.m4.scaling(
                                  [scaleFactor, scaleFactor, scaleFactor],
                                  world
                              ),
                              0.005 * this.features.rotationDir
                          )
                        : world,
                offsets: this.framebuffers[i].attachments[0],
                pixels: this.framebuffers[
                    this.framebufferPixelsIndex +
                        this.features.framebufferForOffsets
                ].attachments[0],
            });

            twgl.bindFramebufferInfo(
                this.context,
                this.framebuffers[
                    1 -
                        this.framebufferPixelsIndex +
                        this.features.framebufferForOffsets
                ]
            );
            twgl.drawBufferInfo(this.context, this.positionBuffer);
            this.framebufferPixelsIndex = 1 - this.framebufferPixelsIndex;
        }

        // draw latest moving blocks buffer to screen
        this.context.useProgram(this.programDraw.program);
        twgl.setBuffersAndAttributes(
            this.context,
            this.programDraw,
            this.positionBuffer
        );

        if (this.outputBuffer === null) {
            let uniforms = {
                pixels: this.framebuffers[
                    this.framebufferPixelsIndex +
                        this.features.framebufferForOffsets
                ].attachments[0],
                world: world,
            };
            twgl.setUniforms(this.programDraw, uniforms);
        } else {
            twgl.setUniforms(this.programDraw, {
                pixels: this.framebuffers[this.outputBuffer].attachments[0],
            });
        }

        twgl.bindFramebufferInfo(this.context, null);
        twgl.drawBufferInfo(this.context, this.positionBuffer);

        this.init = 0;
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

        previewCanvas.height =
            this.height * (this.pixelRatio < 1 ? 1 : this.pixelRatio);
        previewCanvas.width =
            this.width * (this.pixelRatio < 1 ? 1 : this.pixelRatio);

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

export class DebugPiece {
    public debugCanvas: HTMLCanvasElement | null = null;
    public debugContext: CanvasRenderingContext2D | null = null;
    private piece: Piece;

    private translationX!: number;
    private translationY!: number;

    public constructor(piece: Piece) {
        this.piece = piece;
        this.piece.canvas.addEventListener('piece.updateSize', () => {
            let active = this.debugContext && this.debugCanvas;
            this.remove();
            if (active) {
                this.create();
            }
        });
    }

    public toggle() {
        if (this.debugContext && this.debugCanvas) {
            this.remove();
        } else {
            this.create();
        }
    }

    private remove() {
        if (!this.debugContext || !this.debugCanvas) {
            return;
        }

        this.debugCanvas.remove();
        this.debugCanvas = null;
        this.debugContext = null;
    }

    private create() {
        if (this.debugContext && this.debugCanvas) {
            return;
        }

        this.debugCanvas = this.piece.canvas.cloneNode(
            false
        ) as HTMLCanvasElement;
        this.debugCanvas.id = 'debug-canvas';
        this.debugCanvas.style.backgroundColor = 'transparent';
        this.debugCanvas.width = this.piece.width;
        this.debugCanvas.height = this.piece.height;
        document.body.prepend(this.debugCanvas);
        this.debugContext = this.debugCanvas.getContext(
            '2d'
        ) as CanvasRenderingContext2D;

        this.translationX = this.piece.width / 2;
        this.translationY = this.piece.height / 2;

        this.tickPiece();
    }

    public isEnabled(): boolean {
        return this.debugContext !== null;
    }

    private rotate() {
        if (!this.debugContext || !this.debugCanvas) {
            return;
        }
        this.debugContext.translate(this.translationX, this.translationY);
        this.debugContext.rotate(this.piece.features.rotationRadians);
    }

    private unRotate() {
        if (!this.debugContext || !this.debugCanvas) {
            return;
        }
        this.debugContext.resetTransform();
    }

    public tickPiece() {
        if (!this.debugContext || !this.debugCanvas) {
            return;
        }

        this.debugContext.clearRect(0, 0, this.piece.width, this.piece.height);

        this.rotate();

        this.piece.features.shapes.map((shape) => {
            if (!this.debugContext) {
                return;
            }

            if (shape instanceof Circle) {
                this.debugContext.strokeStyle = '#ffff00';
                this.debugContext.fillStyle = `rgba(255, 255, 0, 0.1)`;
                this.debugContext.beginPath();
                this.debugContext.arc(
                    shape.x * this.piece.width - this.translationX,
                    shape.y * this.piece.height - this.translationY,
                    shape.r * this.piece.width,
                    0,
                    2 * Math.PI,
                    false
                );
                this.debugContext.closePath();
                this.debugContext.stroke();
                this.debugContext.fill();
            } else {
                this.debugContext.strokeStyle = '#00ffff';
                this.debugContext.fillStyle = `rgba(0, 255, 255, 0.1)`;
                this.debugContext.strokeRect(
                    shape.x * this.piece.width - this.translationX,
                    shape.y * this.piece.height - this.translationY,
                    shape.w * this.piece.width,
                    shape.h * this.piece.height
                );
                this.debugContext.fillRect(
                    shape.x * this.piece.width - this.translationX,
                    shape.y * this.piece.height - this.translationY,
                    shape.w * this.piece.width,
                    shape.h * this.piece.height
                );
            }
        });

        this.unRotate();

        this.movingBlocks();
    }

    private movingBlocks() {
        if (!this.debugContext || !this.debugCanvas) {
            return;
        }
        this.piece.movingBlocks.blocks.forEach((block) => {
            if (!this.debugContext || !this.debugCanvas) {
                return;
            }
            if (!block.active) {
                return;
            }
            this.debugContext.strokeStyle = `rgba(255, 255, 255, 0.3)`;
            this.debugContext.fillStyle = `rgba(255, 255, 255, 0.1)`;
            this.debugContext.fillRect(
                block.area.x,
                block.area.y,
                block.area.w,
                block.area.h
            );
            this.debugContext.strokeRect(
                block.area.x,
                block.area.y,
                block.area.w,
                block.area.h
            );
        });
    }
}

export class MovingBlocks {
    public totalFrames: number = 0;
    public blocks: Array<MovingBlock> = [];
    public count: number = 0;
    public total: number = 0;
    private piece: Piece;

    public constructor(piece: Piece) {
        this.piece = piece;
        this.init();
    }

    public tick(): boolean {
        this.totalFrames++;

        this.count = this.blocks.reduce(
            (c, block) => (block.tick() ? c + 1 : c),
            0
        );
        this.total += this.piece.features.maxMovingBlocks - this.count;

        return true;
    }

    private add(): void {
        this.blocks.push(new MovingBlock(this.piece));
        this.total++;
    }

    public init(): void {
        this.blocks = [];
        this.count = 0;
        this.total = 0;

        do {
            this.add();
        } while (this.total < this.piece.features.maxMovingBlocks);
    }

    public normalized(): Float32Array {
        return (
            this.blocks
                // .sort((a, b) =>
                //     a.active &&
                //     b.active &&
                //     a.area.x + a.area.y > b.area.x + b.area.y
                //         ? -1
                //         : 1
                // )
                // .sort((a, b) =>
                //     a.active &&
                //     b.active &&
                //     Math.abs(a.area.x - b.area.x) > a.area.w * 2 &&
                //     Math.abs(a.area.y - b.area.y) > a.area.h * 2
                //         ? -1
                //         : 1
                // )
                .reduce((r, block, currentIndex) => {
                    block.normalized(r, currentIndex * 4);
                    return r;
                }, new Float32Array(this.piece.features.maxMovingBlocks * 4))
        );
    }
}

export class MovingBlock {
    public active: boolean = false;
    public area!: Area;
    public dirX: number = 0;
    public dirY: number = 0;
    public inShape: boolean = false;

    public constructor(public readonly piece: Piece) {
        this.piece = piece;
    }

    public normalized(r: Float32Array, index: number): Float32Array {
        if (this.active) {
            r[index] = ((this.area.x + 0) / this.piece.width) * 2 - 1;
            r[index + 1] = 2 - ((this.area.y + 0) / this.piece.height) * 2 - 1;
            r[index + 2] = this.dirX / 40; // max -40 / 40 => - 1 / 1
            r[index + 3] = -this.dirY / 40; // max -40 / 40  => - 1 / 1
        } else {
            r[index] = 0.0;
            r[index + 1] = 0.0;
            r[index + 2] = 0.0;
            r[index + 3] = 0.0;
        }

        return r;
    }

    public activate() {
        this.area = {
            x: randInt(
                this.piece.features.gridSize - this.piece.features.blockSize
            ),
            y: randInt(
                this.piece.features.gridSize - this.piece.features.blockSize
            ),
            w: this.piece.features.blockSize,
            h: this.piece.features.blockSize,
        };

        this.area.x =
            (this.area.x * this.piece.width) / this.piece.features.gridSize;
        this.area.y =
            (this.area.y * this.piece.height) / this.piece.features.gridSize;
        this.area.w =
            ((this.area.w + 0) * this.piece.width) /
            this.piece.features.gridSize;
        this.area.h =
            ((this.area.h + 0) * this.piece.height) /
            this.piece.features.gridSize;

        this.area.x = this.area.x << 0;
        this.area.y = this.area.y << 0;
        this.area.w = this.area.w << 0;
        this.area.h = this.area.h << 0;

        this.dirX = 0;
        this.dirY = 0;
        let move = randOptions(this.piece.features.animation);
        if (move.includes('up')) {
            this.dirX = -1;
        }
        if (move.includes('down')) {
            this.dirX = 1;
        }
        if (move.includes('left')) {
            this.dirY = -1;
        }
        if (move.includes('right')) {
            this.dirY = 1;
        }

        this.active = true;
    }

    public deactivate() {
        this.active = false;
    }

    public tick(): boolean {
        if (!this.active) {
            this.activate();
        }

        let sx: number = this.area.x - this.dirX * (this.inShape ? -1 : 1);
        let sy: number = this.area.y - this.dirY * (this.inShape ? -1 : 1);

        if (!this.intersectsWithDrawingArea(sx, sy, this.area.w, this.area.h)) {
            this.deactivate();
            return false;
        }

        let inShape = this.intersectsWithShapes(
            sx,
            sy,
            this.area.w,
            this.area.h
        );
        if (inShape === 0) {
            this.deactivate();
            return false;
        }

        this.inShape = inShape < 2;

        this.area.x = sx;
        this.area.y = sy;

        return true;
    }

    private rotatePoint(
        cx: number,
        cy: number,
        x: number,
        y: number
    ): Array<number> {
        if (this.piece.features.rotation === 0) {
            return [x, y];
        }
        return [
            this.piece.features.rotationCos * (x - cx) +
                this.piece.features.rotationSin * (y - cy) +
                cx,
            this.piece.features.rotationCos * (y - cy) -
                this.piece.features.rotationSin * (x - cx) +
                cy,
        ];
    }

    private intersectsWithShapes(x: number, y: number, w: number, h: number) {
        [x, y] = this.rotatePoint(
            this.piece.width / 2,
            this.piece.height / 2,
            x + w / 2,
            y + h / 2
        );

        let l = this.piece.features.shapes.length;
        let f = 0;
        for (let i = 0; i < l; i++) {
            let shape = this.piece.features.shapes[i];
            let inShape: boolean;
            if (shape instanceof Circle) {
                inShape = isec.testRectCircle(
                    [x, y],
                    [1, 1],
                    [shape.x * this.piece.width, shape.y * this.piece.height],
                    shape.r * Math.min(this.piece.width, this.piece.height)
                );
            } else {
                inShape = isec.testRectRect(
                    [x, y],
                    [1, 1],
                    [shape.x * this.piece.width, shape.y * this.piece.height],
                    [shape.w * this.piece.width, shape.h * this.piece.height]
                );
            }

            if (!inShape) {
                if (i === 0) {
                    return 0;
                }
            } else {
                f = i + 1;
            }
        }

        return f % 2 == 0 ? 0 : f;
    }

    private intersectsWithDrawingArea(
        x: number,
        y: number,
        w: number,
        h: number
    ) {
        return isec.testRectRect(
            [x + w / 2, y + h / 2],
            [1, 1],
            [w / 2 + 1, h / 2 + 1],
            [this.piece.width - w - 2, this.piece.height - h - 2]
        );
    }
}
