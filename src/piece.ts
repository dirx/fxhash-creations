import { Area, randInit, randInt, randOptions } from './rand';
import { color, ColorSpec } from './color';
import * as isec from '@thi.ng/geom-isec';
import { Circle, Quad, Rect } from './shapes';
import { floorTo } from '@thi.ng/math';
import * as twgl from 'twgl.js';

export type FxhashFeatures = {
    color: string;
    'grid size': number;
    'limiting shapes': string;
    rotation: string;
    'moving blocks': number;
    'moving direction': string;
    'moving distance direction': string;
};

export class Features {
    public combination: number = 0;
    public readonly colorHue: number;
    public readonly colorName: string;
    public readonly colorHueBase: number;
    public readonly color: ColorSpec;
    public readonly colorSaturation: number;
    public maxMovingBlocks: number;
    public framebufferForOffsets: number = 8;
    public framebufferForMovingBlocks: number = 2;
    public readonly gridSize: number;
    public readonly waitBlocks: number;
    public readonly colorValueMin: number;
    public readonly colorValueMax: number;
    public blockConfig: Array<any> = [
        21, 42, 84, 168, 252, 420, 672, 1092, 1764, 2856, 4620,
    ];
    public movingDistances: Array<any> = [];
    public blockBase: number;
    public blockSize: number;
    public stepSizeBase: number;
    public stepSize: number;

    public movingDistanceDirectionBase: number;
    public movingDistanceDirection: number;

    public shapes: Array<Circle | Quad | Rect>;
    public shapeBase: number;
    public shapesCenterX: number;
    public shapesCenterY: number;

    private rotationOptions: Array<number> = [-42, -21, -7, -3, 3, 7, 21, 42];
    public rotationBase: number;
    public rotation: number;
    public rotationRadians: number;
    public rotationCos: number;
    public rotationSin: number;

    public static directionOptions: Array<
        Array<Array<'left' | 'up' | 'down' | 'right'>>
    > = [
        // [['up'], ['left'], ['down'], ['right']],
        // [
        //     ['left', 'up'],
        //     ['left', 'down'],
        //     ['right', 'up'],
        //     ['right', 'down'],
        // ],
        // [
        //     ['left', 'up'],
        //     ['left', 'down'],
        // ],
        // [
        //     ['right', 'up'],
        //     ['right', 'down'],
        // ],
        // [
        //     ['left', 'up'],
        //     ['right', 'up'],
        // ],
        // looks like wood:
        [
            ['left', 'down'],
            ['right', 'up'],
        ],
        // looks like wood:
        [
            ['left', 'up'],
            ['right', 'down'],
        ],
        // [['right'], ['right', 'up'], ['right', 'down']],
        // [['left'], ['left', 'up'], ['left', 'down']],
        // [['up'], ['left', 'up'], ['right', 'up']],
        // [['down'], ['left', 'down'], ['right', 'down']],
        // [
        //     ['up'],
        //     ['left'],
        //     ['down'],
        //     ['right'],
        //     ['left', 'up'],
        //     ['left', 'down'],
        //     ['right', 'up'],
        //     ['right', 'down'],
        // ],
        // [['left'], ['left', 'up'], ['up']],
        // [['left'], ['left', 'down'], ['down']],
        // [['right'], ['right', 'up'], ['up']],
        // [['right'], ['right', 'down'], ['down']],
        // [['right'], ['right', 'down'], ['left'], ['left', 'up']],
        // [['right'], ['right', 'up'], ['left'], ['left', 'down']],
        // [['down'], ['right', 'down'], ['up'], ['left', 'up']],
    ];
    public directionBase: number;
    public direction: Array<Array<'left' | 'up' | 'down' | 'right'>>;

    public static combinations: number =
        2 *
        4 *
        2 *
        Object.keys(color.palettes['unique-css']).length *
        Features.directionOptions.length *
        8;

    public constructor(combination: number) {
        this.combination = combination % Features.combinations;

        this.movingDistanceDirectionBase = combination % 2;
        this.movingDistanceDirection = [-1, -1][
            this.movingDistanceDirectionBase
        ];
        combination = (combination / 2) << 0;

        this.stepSizeBase = 0; // fix 1 pixel
        this.stepSize = [1, 2, 3, 5][this.stepSizeBase];

        this.blockBase = (combination % 4) + 1;
        let blocks = this.blockConfig.slice(this.blockBase, this.blockBase + 4);
        this.maxMovingBlocks = blocks[3];
        this.movingDistances = this.blockConfig.slice(
            this.blockBase,
            this.blockBase + 2
        );
        this.gridSize = blocks[3];
        this.waitBlocks =
            this.blockConfig[this.blockBase + this.stepSizeBase + 2];
        this.blockSize = 21;
        combination = (combination / 4) << 0;

        this.shapeBase = combination % 2;
        let numOfShapes = [3, 5][this.shapeBase];
        this.shapes = [];
        for (let i = 0; i < numOfShapes; i++) {
            if (randInt(2) !== 0) {
                this.shapes.push(
                    new Circle(
                        floorTo(
                            randInt(this.gridSize - blocks[0] * 2) + blocks[0],
                            this.blockSize / 3
                        ) / this.gridSize,
                        floorTo(
                            randInt(this.gridSize - blocks[0] * 2.5) +
                                blocks[0] * 1.5,
                            this.blockSize / 3
                        ) / this.gridSize,
                        (randOptions(
                            [blocks[1], blocks[2]],
                            [numOfShapes + 2, 1]
                        ) /
                            this.gridSize) *
                            0.5641895835
                    )
                );
            } else {
                this.shapes.push(
                    new Quad(
                        floorTo(
                            randInt(this.gridSize - blocks[0] * 3) + blocks[0],
                            this.blockSize / 3
                        ) / this.gridSize,
                        floorTo(
                            randInt(this.gridSize - blocks[0] * 3.5) +
                                blocks[0],
                            this.blockSize / 3
                        ) / this.gridSize,
                        randOptions(
                            [blocks[1] + 10, blocks[2]],
                            [numOfShapes + 2, 1]
                        ) / this.gridSize
                    )
                );
            }
        }
        [this.shapesCenterX, this.shapesCenterY] = this.shapes.reduce(
            (center: Array<number>, shape) => {
                return [
                    center[0] + shape.centerX / this.shapes.length,
                    center[1] + shape.centerY / this.shapes.length,
                ];
            },
            [0, 0]
        );
        combination = (combination / 2) << 0;

        this.directionBase = combination % Features.directionOptions.length;
        this.direction = Features.directionOptions[this.directionBase];
        combination = (combination / Features.directionOptions.length) << 0;
        console.log(this.direction.map((a) => a.join('-')).join(','));

        let colors = Object.values(color.palettes['unique-css']);
        this.colorHueBase = combination % colors.length;
        this.colorName = colors[this.colorHueBase].name;
        this.color = colors[this.colorHueBase];
        this.colorHue = this.color.hsv[0];
        this.colorSaturation = this.color.hsv[1];
        this.colorValueMin = 0.05;
        this.colorValueMax = this.color.hsv[2];
        combination = (combination / colors.length) << 0;

        this.rotationBase = combination % this.rotationOptions.length;
        this.rotation = this.rotationOptions[this.rotationBase];
        this.rotationRadians = (Math.PI / 180) * this.rotation;
        this.rotationCos = Math.cos(this.rotationRadians);
        this.rotationSin = Math.sin(this.rotationRadians);
        combination = (combination / this.rotationOptions.length) << 0;
    }

    public getFxhashFeatures(): FxhashFeatures {
        return {
            color: this.getColorName(),
            'limiting shapes': this.getShapes(),
            'grid size': this.gridSize,
            rotation: `${this.rotation}°`,
            'moving blocks': this.maxMovingBlocks,
            'moving direction': this.getDirectionName(),
            'moving distance direction': this.getMovingDistanceDirectionName(),
        };
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

    public getColorName(): string {
        return this.colorName;
    }

    public getMovingDistanceDirectionName(): string {
        return this.movingDistanceDirection === -1 ? 'negative' : 'positive';
    }

    public getDirectionName(): string {
        return this.direction.map((a) => a.join('-')).join(', ');
    }

    public getShapes(): string {
        let sum = this.shapes.reduce(
            (prev, shape) => {
                if (shape instanceof Circle) {
                    prev.circle++;
                }
                if (shape instanceof Quad) {
                    prev.quad++;
                }
                return prev;
            },
            { circle: 0, quad: 0 }
        );
        let text = [];
        if (sum.circle === 1) {
            text.push(`${sum.circle} circle`);
        }
        if (sum.circle > 1) {
            text.push(`${sum.circle} circles`);
        }
        if (sum.quad === 1) {
            text.push(`${sum.quad} quad`);
        }
        if (sum.quad > 1) {
            text.push(`${sum.quad} quads`);
        }
        return text.join(' and ');
    }
}

export class Piece {
    public features!: Features;

    public width: number = 0;
    public height: number = 0;
    public baseHeightWidth: number = 1600;
    public fps: number = 60;
    public pixelRatio: number = 1;

    public canvas: HTMLCanvasElement;
    public context!: WebGL2RenderingContext;

    public movingBlocks!: MovingBlocks;

    public combination: number;

    public inPreviewPhase!: boolean;
    public previewPhaseEndsAfterBase: number = 900;
    public previewPhaseEndsAfter!: number;

    public debug!: DebugPiece;

    public paused: boolean = false;

    public outputBuffer: number | null = null;

    public constructor(
        canvas: HTMLCanvasElement,
        width: number,
        height: number,
        pixelRatio: number | null = null,
        combination: number
    ) {
        this.canvas = canvas;
        this.combination = combination;

        this.updateSize(width, height, pixelRatio);

        this.debug = new DebugPiece(this);
    }

    private initState() {
        randInit(window.fxhash);
        this.features = new Features(this.combination);
        this.inPreviewPhase = true;
        this.paused = false;

        this.movingBlocks = new MovingBlocks(this);
        this.movingBlocks.init();

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
               gl_Position = world * vec4(position, 0.0, 1.0);
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

            uniform sampler2D u_offsets;
            uniform vec3 baseColor;
            uniform float pixelSize;
            uniform float pixelWidth;
            uniform ivec3 colorRGBIndex;
            uniform vec3 colorRGBMin;
            uniform float colorShiftFactor;
            uniform vec2 colorShiftRGBDir;
            uniform float colorShiftDir;
            uniform float timeMs;
    
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
                return vec4(
                    bezier(
                        vec3(0.05),
                        baseColor.rgb - 0.1, 
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
                    color.a = rollover(color.a + 1.0/255.0, 0.0, 1.0);
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
            this.canvas.dispatchEvent(new Event('piece.previewPhaseEnded'));
            this.paused = true;
        }
    }

    public tickWebgl(timeMs: number) {
        if (this.positionBuffer === undefined) {
            return;
        }

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
            world: world,
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
            timeMs: timeMs,
            // colorShiftFactor: this.features.colorShiftFactor,
            // colorShiftDir: this.features.colorShiftDir / 255,
        };
        twgl.setUniforms(this.programPixels, uniform);
        for (let i = 0; i < this.features.framebufferForOffsets; i++) {
            twgl.setUniforms(this.programPixels, {
                world: world,
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
                world: world, // todo rotate: twgl.m4.rotateZ(world, -this.features.rotationRadians),
            };
            twgl.setUniforms(this.programDraw, uniforms);
        } else {
            twgl.setUniforms(this.programDraw, {
                pixels: this.framebuffers[this.outputBuffer].attachments[0],
            });
        }

        twgl.bindFramebufferInfo(this.context, null);
        twgl.drawBufferInfo(this.context, this.positionBuffer);
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
            if (shape instanceof Rect) {
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
            } else {
                this.debugContext.strokeStyle = '#ffff00';
                this.debugContext.fillStyle = `rgba(255, 255, 0, 0.1)`;
                this.debugContext.beginPath();
                this.debugContext.arc(
                    shape.x * this.piece.width - this.translationX,
                    shape.y * this.piece.height - this.translationY,
                    shape.r * Math.min(this.piece.width, this.piece.height),
                    0,
                    2 * Math.PI,
                    false
                );
                this.debugContext.closePath();
                this.debugContext.stroke();
                this.debugContext.fill();
            }
            this.debugContext.fillStyle = `rgba(255, 255, 255, 0.1)`;
            this.debugContext.beginPath();
            this.debugContext.arc(
                shape.centerX * this.piece.width - this.translationX,
                shape.centerY * this.piece.height - this.translationY,
                Math.min(this.piece.width, this.piece.height) * 0.01,
                0,
                2 * Math.PI,
                false
            );
            this.debugContext.closePath();
            this.debugContext.stroke();
            this.debugContext.fill();
        });

        this.debugContext.strokeStyle = '#00ff00';
        this.debugContext.fillStyle = `rgba(0, 255, 0, 0.1)`;
        this.debugContext.beginPath();
        this.debugContext.arc(
            this.piece.features.shapesCenterX * this.piece.width -
                this.translationX,
            this.piece.features.shapesCenterY * this.piece.height -
                this.translationY,
            Math.min(this.piece.width, this.piece.height) * 0.015,
            0,
            2 * Math.PI,
            false
        );
        this.debugContext.closePath();
        this.debugContext.stroke();
        this.debugContext.fill();

        this.unRotate();

        this.debugContext.strokeStyle = '#333333';
        let blockSizeX =
            (this.piece.features.blockSize / this.piece.features.gridSize) *
            this.piece.width;
        let blockSizeY =
            (this.piece.features.blockSize / this.piece.features.gridSize) *
            this.piece.width;
        this.debugContext.strokeRect(
            blockSizeX,
            blockSizeY,
            this.piece.width - blockSizeX * 2,
            this.piece.height - blockSizeX * 2
        );

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
                block.tx,
                block.ty,
                block.area.w,
                block.area.h
            );
            this.debugContext.strokeRect(
                block.tx,
                block.ty,
                block.area.w,
                block.area.h
            );
        });
    }

    public moveMovingBlock(
        tx: number,
        ty: number,
        sw: number,
        sh: number
    ): boolean {
        if (!this.debugContext || !this.debugCanvas) {
            return false;
        }

        this.debugContext.strokeStyle = `rgba(255, 255, 255, 0.3)`;
        this.debugContext.fillStyle = `rgba(255, 255, 255, 0.1)`;
        this.debugContext.fillRect(tx, ty, sw, sh);
        this.debugContext.strokeRect(tx, ty, sw, sh);
        return true;
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
    public vMin!: number;
    public vMax!: number;
    public vDir!: number;

    public tx!: number;
    public ty!: number;
    private movingDistanceX!: number;
    private movingDistanceY!: number;

    private dirXShapesFactor!: number;
    private dirYShapesFactor!: number;

    public constructor(public readonly piece: Piece) {
        this.piece = piece;
    }

    public normalized(r: Float32Array, index: number): Float32Array {
        if (this.active) {
            r[index] = (this.area.x / this.piece.width) * 2 - 1;
            r[index + 1] = 2 - (this.area.y / this.piece.height) * 2 - 1;
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
        let move = randOptions(this.piece.features.direction);
        let stepSize = this.piece.features.stepSize;

        this.dirX = 0;
        this.dirY = 0;
        if (move.includes('left')) {
            this.dirX = -stepSize;
        }
        if (move.includes('right')) {
            this.dirX = stepSize;
        }
        if (move.includes('up')) {
            this.dirY = -stepSize;
        }
        if (move.includes('down')) {
            this.dirY = stepSize;
        }

        let blocksX: number = randOptions(this.piece.features.movingDistances);
        let blocksY: number = randOptions(this.piece.features.movingDistances);
        let x: number = randInt(this.piece.features.gridSize - blocksX);
        let y: number = randInt(this.piece.features.gridSize - blocksY);

        this.area = {
            x: ((x * this.piece.width) / this.piece.features.gridSize) << 0,
            y: ((y * this.piece.height) / this.piece.features.gridSize) << 0,
            w:
                ((this.piece.features.blockSize * this.piece.width) /
                    this.piece.features.gridSize) <<
                0,
            h:
                ((this.piece.features.blockSize * this.piece.height) /
                    this.piece.features.gridSize) <<
                0,
        };

        this.vMin = 255 * this.piece.features.colorValueMin;
        this.vMax = 255 * this.piece.features.colorValueMax;
        this.vDir = this.piece.pixelRatio * 2;

        this.dirXShapesFactor =
            this.area.x > this.piece.features.shapesCenterX * this.piece.width
                ? -1
                : 1;
        this.dirYShapesFactor =
            this.area.y > this.piece.features.shapesCenterY * this.piece.height
                ? -1
                : 1;

        this.movingDistanceX = 0;
        this.movingDistanceY = 0;
        if (this.dirX !== 0) {
            this.movingDistanceX =
                ((blocksX * this.piece.width) / this.piece.features.gridSize) <<
                0;
        }
        if (this.dirY !== 0) {
            this.movingDistanceY =
                ((blocksY * this.piece.height) /
                    this.piece.features.gridSize) <<
                0;
        }
        this.area.x += this.movingDistanceX;
        this.area.y += this.movingDistanceY;

        this.active = true;
    }

    public deactivate() {
        this.active = false;
    }

    public tick(): boolean {
        if (!this.active) {
            this.activate();
        }

        if (this.movingDistanceX < 0 || this.movingDistanceY < 0) {
            this.deactivate();
            return false;
        }

        let sx: number = this.area.x;
        let sy: number = this.area.y;
        let tx: number = this.area.x;
        let ty: number = this.area.y;

        if (this.dirX !== 0) {
            tx =
                this.area.x +
                this.dirX *
                    this.dirXShapesFactor *
                    Math.sin(this.movingDistanceX / this.piece.width);
        }

        if (this.dirY !== 0) {
            ty =
                this.area.y +
                this.dirY *
                    this.dirYShapesFactor *
                    Math.cos(this.movingDistanceY / this.piece.height);
        }

        this.tx = tx;
        this.ty = ty;

        if (!this.intersectsWithShapes(sx, sy, this.area.w, this.area.h)) {
            this.deactivate();
            return false;
        }

        if (!this.intersectsWithDrawingArea(sx, sy, this.area.w, this.area.h)) {
            this.deactivate();
            return false;
        }

        this.area.x -= this.dirX * this.piece.features.movingDistanceDirection;
        this.area.y -= this.dirY * this.piece.features.movingDistanceDirection;

        // note: this runs towards 0 or runs into box constraints
        this.movingDistanceX -=
            this.dirX * this.piece.features.movingDistanceDirection;
        this.movingDistanceY -=
            this.dirY * this.piece.features.movingDistanceDirection;

        return true;
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
            [w, h],
            [this.piece.width - w * 2, this.piece.height - h * 2]
        );
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

        return this.piece.features.shapes.some(
            (shape: Circle | Rect | Quad) => {
                if (shape instanceof Circle) {
                    return isec.testRectCircle(
                        [x, y],
                        [1, 1],
                        [
                            shape.x * this.piece.width,
                            shape.y * this.piece.height,
                        ],
                        shape.r * Math.min(this.piece.width, this.piece.height)
                    );
                }
                return isec.testRectRect(
                    [x, y],
                    [1, 1],
                    [shape.x * this.piece.width, shape.y * this.piece.height],
                    [shape.w * this.piece.width, shape.h * this.piece.height]
                );
            }
        );
    }

    // public shiftColor(data: ImageData, sx: number, sy: number) {
    //     let l: number = data.data.length;
    //     let f: number = Math.sin(
    //         (sx + sy) /
    //             (this.piece.width + this.piece.height) /
    //             this.piece.pixelRatio
    //     );
    //     let fC = f * 7;
    //     let hBase = mod(this.piece.features.colorHue - fC, 360) / 60;
    //
    //     for (let i: number = 0; i < l; i += 4) {
    //         this.shiftColorPixel(data, i, hBase);
    //     }
    //     return data;
    // }
    //
    // private shiftColorPixel(data: ImageData, offset: number, h: number): void {
    //     // get v
    //     let s = this.piece.features.colorSaturation,
    //         v = Math.max(
    //             data.data[offset],
    //             data.data[offset + 1],
    //             data.data[offset + 2]
    //         );
    //
    //     // rotate value
    //     v += this.vDir;
    //     if (v > this.vMax) v = this.vMin;
    //     else if (v < this.vMin) v = this.vMax;
    //
    //     // back to rgb
    //     if (s === 0) {
    //         data.data[offset] = v;
    //         data.data[offset + 1] = v;
    //         data.data[offset + 2] = v;
    //     } else {
    //         const i = h << 0;
    //         const f = h - i;
    //         const p = v * (1 - s);
    //         const q = v * (1 - s * f);
    //         const t = v * (1 - s * (1 - f));
    //
    //         switch (i) {
    //             case 0:
    //                 data.data[offset] = v;
    //                 data.data[offset + 1] = t;
    //                 data.data[offset + 2] = p;
    //                 break;
    //             case 1:
    //                 data.data[offset] = q;
    //                 data.data[offset + 1] = v;
    //                 data.data[offset + 2] = p;
    //                 break;
    //             case 2:
    //                 data.data[offset] = p;
    //                 data.data[offset + 1] = v;
    //                 data.data[offset + 2] = t;
    //                 break;
    //             case 3:
    //                 data.data[offset] = p;
    //                 data.data[offset + 1] = q;
    //                 data.data[offset + 2] = v;
    //                 break;
    //             case 4:
    //                 data.data[offset] = t;
    //                 data.data[offset + 1] = p;
    //                 data.data[offset + 2] = v;
    //                 break;
    //             case 5:
    //             default:
    //                 data.data[offset] = v;
    //                 data.data[offset + 1] = p;
    //                 data.data[offset + 2] = q;
    //         }
    //     }
    // }
}
