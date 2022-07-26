import { Area, rand, randInit, randInt, randOptions } from './rand';
import { color, ColorSpec } from './color';
import * as isec from '@thi.ng/geom-isec';
import { Circle, Quad, Rect } from './shapes';
import * as twgl from 'twgl.js';

export type FxhashFeatures = {
    color: string;
    shapes: string;
    clusters: number;
    rotation: string;
    'grid size': number;
    'moving blocks': number;
    'moving direction': string;
    'moving speed': number;
    'moving behavior': string;
};

export type MoveDirection = ('left' | 'up' | 'down' | 'right')[];
export type MoveDirections = MoveDirection[];

export class Features {
    public combination: number = 0;
    public readonly colorBase: number;
    public readonly color: ColorSpec;

    public blockConfig: Array<any> = [
        13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597, 2584, 4181, 6765,
        10946,
    ];
    public blockBase: number;
    public blockSize: number;
    public readonly gridSize: number;
    public maxMovingBlocks: number;

    public movingSpeedBase: number;
    public movingSpeed: number;
    public movingBehaviorBase: number;
    public movingBehavior: number;
    public movingDistances: Array<number> = [];
    public readonly maxFramesBeforeReset: number;

    public shapes: Array<Circle | Quad | Rect>;
    public shapeBase: number;
    public shapesCenterX: number;
    public shapesCenterY: number;

    public clusters: number;

    public rotationBase: number;
    public rotation: number;
    public rotationRadians: number;
    public rotationCos: number;
    public rotationSin: number;

    public directionsBase: number;
    public directions: MoveDirections;

    public static colors: Array<ColorSpec> = Object.values(
        color.palettes['unique-css']
    );
    public static shapesOptions = [3, 5, 7];
    public static clusterOption = 3;
    public static rotationOptions: Array<number> = [
        -168, -84, -42, -21, -7, -3, 3, 7, 21, 42, 84, 168,
    ];
    public static blockOption = 5;
    private static movingDirectionOptions: Array<MoveDirections>;
    public static getMovingDirectionOptions(): Array<MoveDirections> {
        if (Features.movingDirectionOptions) {
            return Features.movingDirectionOptions;
        }
        const all: MoveDirections = [
            ['up'],
            ['left'],
            ['down'],
            ['right'],
            ['left', 'up'],
            ['left', 'down'],
            ['right', 'up'],
            ['right', 'down'],
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
            (c) => (c.length >= 3 && c.length <= 4) || c.length == 8
        );

        return Features.movingDirectionOptions;
    }
    public static movingSpeedOptions = [1, 2, 3];
    public static movingBehaviorOptions = [-1, 1];

    public static combinations: number =
        Features.colors.length *
        Features.shapesOptions.length *
        Features.clusterOption *
        Features.rotationOptions.length *
        Features.blockOption *
        Features.getMovingDirectionOptions().length *
        Features.movingSpeedOptions.length *
        Features.movingBehaviorOptions.length;

    public constructor(combination: number) {
        this.combination = combination % Features.combinations;

        this.movingBehaviorBase =
            combination % Features.movingBehaviorOptions.length;
        combination =
            (combination / Features.movingBehaviorOptions.length) << 0;
        this.movingBehavior =
            Features.movingBehaviorOptions[this.movingBehaviorBase];

        this.movingSpeedBase = combination % Features.movingSpeedOptions.length;
        combination = (combination / Features.movingSpeedOptions.length) << 0;
        this.movingSpeed = Features.movingSpeedOptions[this.movingSpeedBase];

        this.blockBase = (combination % Features.blockOption) + 4;
        combination = (combination / Features.blockOption) << 0;
        let blocks = this.blockConfig.slice(
            this.blockBase - 1,
            this.blockBase + 4
        );
        this.maxMovingBlocks = blocks[3];
        this.movingDistances = this.blockConfig.slice(
            this.blockBase - 2,
            this.blockBase
        );
        this.gridSize = blocks[4];
        this.maxFramesBeforeReset = blocks[2];
        this.blockSize = this.blockConfig[1];

        this.shapeBase = combination % Features.shapesOptions.length;
        combination = (combination / Features.shapesOptions.length) << 0;
        let numOfShapes = Features.shapesOptions[this.shapeBase];
        this.shapes = [];

        this.clusters = (combination % Features.clusterOption) + 1;
        combination = (combination / Features.clusterOption) << 0;
        for (let i = 0; i < numOfShapes; i++) {
            let cluster = i % this.clusters;
            let wh = randOptions(
                [blocks[0], blocks[1], blocks[2]],
                [1, numOfShapes, 1]
            );
            let angle =
                (120 / this.clusters) * rand() +
                cluster * (360 / this.clusters) -
                60;
            let centerPadding = this.clusters > 1 ? wh / 2 + this.blockSize : 0;
            let distance =
                (this.gridSize * 0.5 -
                    wh * 0.6 -
                    this.blockSize -
                    centerPadding) *
                    rand() +
                centerPadding;
            let x =
                this.gridSize / 2 +
                distance * Math.cos((angle / 180) * Math.PI);
            let y =
                this.gridSize / 2 +
                distance * Math.sin((angle / 180) * Math.PI);
            if (randInt(2) !== 0) {
                this.shapes.push(
                    new Circle(
                        x / this.gridSize,
                        y / this.gridSize,
                        (wh / this.gridSize) * 0.5641895835
                    )
                );
            } else {
                this.shapes.push(
                    new Quad(
                        (x - wh / 2) / this.gridSize,
                        (y - wh / 2) / this.gridSize,
                        wh / this.gridSize
                    )
                );
            }
        }
        this.shapes.forEach((s, _index) => {
            s.valueX =
                (rand() + randOptions([0.23, 0.29, 0.37])) *
                randOptions([-2, 2]);
            s.valueY =
                (rand() + randOptions([0.23, 0.29, 0.37])) *
                randOptions([-2, 2]);
        });
        [this.shapesCenterX, this.shapesCenterY] = this.shapes.reduce(
            (center: Array<number>, shape) => {
                return [
                    center[0] + shape.centerX / this.shapes.length,
                    center[1] + shape.centerY / this.shapes.length,
                ];
            },
            [0, 0]
        );

        this.rotationBase = combination % Features.rotationOptions.length;
        combination = (combination / Features.rotationOptions.length) << 0;
        this.rotation = Features.rotationOptions[this.rotationBase];
        this.rotationRadians = (Math.PI / 180) * this.rotation;
        this.rotationCos = Math.cos(-this.rotationRadians);
        this.rotationSin = Math.sin(-this.rotationRadians);

        this.directionsBase =
            combination % Features.getMovingDirectionOptions().length;
        combination =
            (combination / Features.getMovingDirectionOptions().length) << 0;
        this.directions =
            Features.getMovingDirectionOptions()[this.directionsBase];

        this.colorBase = combination % Features.colors.length;
        combination = (combination / Features.length) << 0;
        this.color = Features.colors[this.colorBase];
    }

    public getFxhashFeatures(): FxhashFeatures {
        return {
            color: this.getColorName(),
            shapes: this.getShapes(),
            clusters: this.clusters,
            rotation: `${this.rotation}°`,
            'grid size': this.gridSize,
            'moving blocks': this.maxMovingBlocks,
            'moving direction': this.getMovingDirection(),
            'moving speed': this.movingSpeed,
            'moving behavior': this.getMovingBehavior(),
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
        return this.color.name;
    }

    public getMovingBehavior(): string {
        return this.movingBehavior === -1 ? 'negative' : 'positive';
    }

    public getMovingDirection(): string {
        return this.directions.map((a) => a.join('-')).join(', ');
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
    public baseHeightWidth: number = 1980;
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
    private autoPause: boolean;

    private programInit!: twgl.ProgramInfo;
    private programOffsets!: twgl.ProgramInfo;
    private programPixels!: twgl.ProgramInfo;
    private programDraw!: twgl.ProgramInfo;

    private positionBuffer!: twgl.BufferInfo;
    private bufferOffsets!: twgl.BufferInfo;

    private framebuffers!: Array<twgl.FramebufferInfo>;
    private framebufferPixelsIndex: number = 0;
    private framebufferForOffsets: number = 8;
    private framebufferForPixels: number = 2;

    public outputBuffer: number | null = null;
    public totalOutputBuffer!: number;

    public constructor(
        canvas: HTMLCanvasElement,
        width: number,
        height: number,
        pixelRatio: number | null = null,
        combination: number,
        autoPause: boolean = true
    ) {
        this.canvas = canvas;
        this.combination = combination;
        this.autoPause = autoPause;

        this.initState();
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
            premultipliedAlpha: false,
        }) as WebGL2RenderingContext;

        if (!twgl.isWebGL2(this.context)) {
            console.error(
                'A webgl2 enabled browser is required to view this piece.'
            );
            this.paused = true;
            return;
        }

        // init pixels program that applies offset maps to alternating framebuffers
        const vPixels = `#version 300 es
            ${precision}

            in vec2 position;
            out vec2 v_position;
            
            uniform float pixelSize;
            uniform mat4 world;
        
            void main() {
               gl_Position = world * vec4(position, 0.0, 1.0);
               v_position = 0.5 * (position + 1.0);
            }`;
        const fPixels = `#version 300 es
            ${precision}
        
            in vec2 v_position;
            in vec2 offset;
            
            out vec4 outColor;
            
            uniform sampler2D pixels;
            uniform sampler2D offsets;
            uniform vec3 baseColor;
            uniform float pixelSize;
            uniform float pixelWidth;
            uniform float timeMs;
    
            float rollover(float value, float min, float max) {
                if (value > max) {
                    return mod(abs(max - value), abs(max - min)) + min;
                }
                
                if (value < min) {
                    return max - mod(abs(value - min), abs(max - min));
                }
                
                return value;
            }
            
            vec3 bezier(vec3 A, vec3 B, vec3 C, vec3 D, float t) {
              vec3 E = mix(A, B, t);
              vec3 F = mix(B, C, t);
              vec3 G = mix(C, D, t);
            
              vec3 H = mix(E, F, t);
              vec3 I = mix(F, G, t);
            
              return mix(H, I, t);
            }

            // using alpha for gradient state
            vec4 shiftColor(vec4 color, float t) {
                color.a = rollover(color.a + t, 0.0, 1.0);
                return vec4(
                    bezier(
                        vec3(0.00),
                        vec3(0.05),
                        baseColor.rgb, 
                        mix(baseColor.rgb, vec3(1.0), 0.1), 
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
                    color = shiftColor(color, 1.0/255.0);
                }
                outColor = color;
            }`;

        this.framebufferPixelsIndex = 0;
        this.programPixels = twgl.createProgramInfo(this.context, [
            vPixels,
            fPixels,
        ]);

        const blocks = {
            block: {
                data: this.movingBlocks.data,
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
                   color = vec4(0.5 * (block.zw + 1.0), 1.0, 1.0); // convert to color 0-1
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
        this.programOffsets = twgl.createProgramInfo(this.context, [
            vOffsets,
            fOffsets,
        ]);

        // init framebuffers for offsets and pixels
        this.totalOutputBuffer =
            this.framebufferForOffsets + this.framebufferForPixels;
        this.framebuffers = [...Array(this.totalOutputBuffer)].map((_) => {
            let attachments = [
                {
                    attachmentPoint: WebGL2RenderingContext.COLOR_ATTACHMENT0,
                    format: this.context.RGBA,
                    type: this.context.UNSIGNED_BYTE,
                    min: this.context.NEAREST,
                    mag: this.context.NEAREST,
                    wrap: this.context.CLAMP_TO_EDGE,
                },
            ];

            return twgl.createFramebufferInfo(
                this.context,
                attachments,
                this.baseHeightWidth,
                this.baseHeightWidth
            );
        });

        // colorize framebuffers that are used for moving pixels
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
            this.framebuffers[this.framebufferForOffsets]
        );
        twgl.drawBufferInfo(this.context, this.positionBuffer);

        twgl.bindFramebufferInfo(
            this.context,
            this.framebuffers[1 + this.framebufferForOffsets]
        );
        twgl.drawBufferInfo(this.context, this.positionBuffer);

        // init canvas drawing
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
            uniform bool debug;
           
            void main() {
                if (debug == true) {
                    outColor = texture(pixels, v_position); 
                } else {
                    outColor = vec4(texture(pixels, v_position).rgb, 1.0); 
                }
            }`;
        this.programDraw = twgl.createProgramInfo(this.context, [vDraw, fDraw]);
    }

    public updateSize(
        width: number,
        height: number,
        pixelRatio: number | null = null
    ) {
        let wh = Math.min(width, height);
        let f = wh / this.baseHeightWidth;
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
        document.body.style.backgroundColor = this.features.color.hex;
    }

    public tick(timeMs: number) {
        this.tickCaptureImage();

        this.debug.tickPiece();

        if (!this.paused) {
            this.movingBlocks.tick();
            this.tickWebgl(timeMs);
        }

        this.draw();

        if (
            this.inPreviewPhase &&
            this.movingBlocks.totalFrames >= this.previewPhaseEndsAfter
        ) {
            this.inPreviewPhase = false;
            this.canvas.dispatchEvent(new Event('piece.previewPhaseEnded'));
            this.paused = this.autoPause;
        }
    }

    public tickWebgl(timeMs: number) {
        if (this.positionBuffer === undefined) {
            return;
        }

        let world = twgl.m4.identity();

        const movingBlocksChunkLength =
            this.features.maxMovingBlocks / this.framebufferForOffsets;

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
            this.movingBlocks.data
        );
        twgl.setUniforms(this.programOffsets, {
            pixelSize:
                (this.features.blockSize / this.features.gridSize) *
                this.baseHeightWidth,
            blockWidthHeight: this.features.blockSize / this.features.gridSize,
            world: world,
        });

        for (let i = 0; i < this.framebufferForOffsets; i++) {
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
                this.baseHeightWidth,
            pixelWidth: 1 / this.baseHeightWidth,
            pixels: this.framebuffers[
                this.framebufferPixelsIndex + this.framebufferForOffsets
            ].attachments[0],
            offsets: this.framebuffers[0].attachments[0],
            timeMs: timeMs,
        };
        twgl.setUniforms(this.programPixels, uniform);
        for (let i = 0; i < this.framebufferForOffsets; i++) {
            twgl.setUniforms(this.programPixels, {
                world: world,
                offsets: this.framebuffers[i].attachments[0],
                pixels: this.framebuffers[
                    this.framebufferPixelsIndex + this.framebufferForOffsets
                ].attachments[0],
            });

            twgl.bindFramebufferInfo(
                this.context,
                this.framebuffers[
                    1 - this.framebufferPixelsIndex + this.framebufferForOffsets
                ]
            );
            twgl.drawBufferInfo(this.context, this.positionBuffer);
            this.framebufferPixelsIndex = 1 - this.framebufferPixelsIndex;
        }
    }

    private draw() {
        let world = twgl.m4.identity();

        // draw the latest pixel or selected debug buffer to canvas
        this.context.useProgram(this.programDraw.program);
        twgl.setBuffersAndAttributes(
            this.context,
            this.programDraw,
            this.positionBuffer
        );

        if (this.outputBuffer === null) {
            let uniforms = {
                pixels: this.framebuffers[
                    this.framebufferPixelsIndex + this.framebufferForOffsets
                ].attachments[0],
                world: twgl.m4.rotateZ(world, -this.features.rotationRadians),
                debug: false,
            };
            twgl.setUniforms(this.programDraw, uniforms);
        } else {
            twgl.setUniforms(this.programDraw, {
                pixels: this.framebuffers[this.outputBuffer].attachments[0],
                debug: true,
            });
        }
        twgl.bindFramebufferInfo(this.context, null);

        this.context.clearColor(
            this.features.color.rgb[0] / 255,
            this.features.color.rgb[1] / 255,
            this.features.color.rgb[2] / 255,
            1.0
        );
        this.context.clear(this.context.COLOR_BUFFER_BIT);

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
    private active: boolean = false;
    public canvas!: HTMLCanvasElement;
    public context!: CanvasRenderingContext2D;
    private piece: Piece;

    private translationX!: number;
    private translationY!: number;

    public constructor(piece: Piece) {
        this.piece = piece;
        this.piece.canvas.addEventListener('piece.updateSize', () => {
            if (this.active) {
                this.remove();
                this.create();
            }
        });
    }

    public toggle() {
        if (this.active) {
            this.remove();
        } else {
            this.create();
        }
    }

    private remove() {
        if (!this.active) {
            return;
        }
        this.canvas.remove();
        this.active = false;
    }

    private create() {
        if (this.active) {
            return;
        }
        this.canvas = this.piece.canvas.cloneNode(false) as HTMLCanvasElement;
        this.canvas.id = 'debug-canvas';
        this.canvas.style.backgroundColor = 'transparent';
        this.canvas.width = this.piece.width;
        this.canvas.height = this.piece.height;
        document.body.prepend(this.canvas);
        this.context = this.canvas.getContext('2d') as CanvasRenderingContext2D;

        this.translationX = this.piece.width / 2;
        this.translationY = this.piece.height / 2;

        this.active = true;

        this.tickPiece();
    }

    public isActive(): boolean {
        return this.active;
    }

    private rotate() {
        this.context.translate(this.translationX, this.translationY);
        this.context.rotate(this.piece.features.rotationRadians);
    }

    private unRotate() {
        this.context.resetTransform();
    }

    public tickPiece() {
        if (!this.active) {
            return;
        }

        this.context.clearRect(0, 0, this.piece.width, this.piece.height);

        this.rotate();

        this.shapes();
        this.shapesCenter();
        this.movingBlocks();
        this.cluster();

        this.unRotate();
    }

    private shapes() {
        this.piece.features.shapes.map((shape) => {
            if (shape instanceof Rect) {
                this.context.strokeStyle = '#00ffff';
                this.context.lineWidth = 1;
                this.context.fillStyle = `rgba(0, ${230 - shape.valueX * 10}, ${
                    230 - shape.valueY * 10
                }, 0.2)`;
                this.context.strokeRect(
                    shape.x * this.piece.width - this.translationX,
                    shape.y * this.piece.height - this.translationY,
                    shape.w * this.piece.width,
                    shape.h * this.piece.height
                );
                this.context.fillRect(
                    shape.x * this.piece.width - this.translationX,
                    shape.y * this.piece.height - this.translationY,
                    shape.w * this.piece.width,
                    shape.h * this.piece.height
                );
            } else {
                this.context.strokeStyle = '#ffff00';
                this.context.lineWidth = 1;
                this.context.fillStyle = `rgba(${230 - shape.valueX * 10}, ${
                    230 - shape.valueY * 10
                }, 0, 0.2)`;
                this.context.beginPath();
                this.context.arc(
                    shape.x * this.piece.width - this.translationX,
                    shape.y * this.piece.height - this.translationY,
                    shape.r * Math.min(this.piece.width, this.piece.height),
                    0,
                    2 * Math.PI,
                    false
                );
                this.context.closePath();
                this.context.stroke();
                this.context.fill();
            }
            this.context.lineWidth = 1;
            this.context.fillStyle = `rgba(255, 255, 255, 0.1)`;
            this.context.beginPath();
            this.context.arc(
                shape.centerX * this.piece.width - this.translationX,
                shape.centerY * this.piece.height - this.translationY,
                Math.min(this.piece.width, this.piece.height) * 0.01,
                0,
                2 * Math.PI,
                false
            );
            this.context.closePath();
            this.context.stroke();
            this.context.fill();
        });
    }

    private shapesCenter() {
        this.context.strokeStyle = '#00ff00';
        this.context.fillStyle = `rgba(0, 255, 0, 0.1)`;
        this.context.beginPath();
        this.context.arc(
            this.piece.features.shapesCenterX * this.piece.width -
                this.translationX,
            this.piece.features.shapesCenterY * this.piece.height -
                this.translationY,
            Math.min(this.piece.width, this.piece.height) * 0.015,
            0,
            2 * Math.PI,
            false
        );
        this.context.closePath();
        this.context.stroke();
        this.context.fill();
    }

    private cluster() {
        this.context.strokeStyle = '#000000';
        this.context.fillStyle = `rgba(0, 0, 0, 0.1)`;
        this.context.lineWidth = 2;
        for (let i = 0; i < this.piece.features.clusters; i++) {
            let angleStart = (360 / this.piece.features.clusters) * i - 60;
            let angleEnd =
                (360 / this.piece.features.clusters) * i +
                120 / this.piece.features.clusters -
                60;

            this.context.beginPath();
            this.context.moveTo(
                this.piece.width / 2 - this.translationX,
                this.piece.height / 2 - this.translationY
            );
            this.context.arc(
                this.piece.width / 2 - this.translationX,
                this.piece.height / 2 - this.translationY,
                Math.min(this.piece.width, this.piece.height) *
                    (0.5 -
                        this.piece.features.blockSize /
                            this.piece.features.gridSize),
                (angleStart / 180) * Math.PI,
                (angleEnd / 180) * Math.PI,
                false
            );
            this.context.lineTo(
                this.piece.width / 2 - this.translationX,
                this.piece.height / 2 - this.translationY
            );
            this.context.stroke();
            this.context.fill();
        }
    }

    private movingBlocks() {
        this.piece.movingBlocks.blocks.forEach((block) => {
            if (!this.context || !this.canvas) {
                return;
            }
            if (!block.active) {
                return;
            }
            this.context.strokeStyle = `rgba(255, 255, 255, 0.3)`;
            this.context.fillStyle = `rgba(255, 255, 255, 0.1)`;
            this.context.fillRect(
                block.area.x - this.translationX,
                block.area.y - this.translationY,
                block.area.w,
                block.area.h
            );
            this.context.strokeRect(
                block.area.x - this.translationX,
                block.area.y - this.translationY,
                block.area.w,
                block.area.h
            );
        });
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

    public tick(): boolean {
        this.totalFrames++;

        this.count = this.blocks.reduce(
            (c, block) => (block.tick() ? c + 1 : c),
            0
        );
        this.total += BigInt(this.piece.features.maxMovingBlocks - this.count);

        return true;
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
    public shapeX: number = 0;
    public shapeY: number = 0;
    private movingDistanceX!: number;
    private movingDistanceY!: number;
    private maxTicks!: number;

    public constructor(
        public index: number,
        public data: Float32Array,
        public readonly piece: Piece
    ) {
        this.piece = piece;
        this.dataIndex = index * MovingBlock.dataPoints;
    }

    public activate() {
        let move = randOptions(this.piece.features.directions);
        let stepSize = this.piece.features.movingSpeed;

        this.maxTicks = this.piece.features.maxFramesBeforeReset + this.index;

        this.shapeX = 0;
        this.shapeY = 0;

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

        if (randInt(this.piece.features.movingSpeed + 1) == 0) {
            this.dirX *= rand() * (this.piece.features.movingSpeed - 1) + 1.0;
            this.dirY *= rand() * (this.piece.features.movingSpeed - 1) + 1.0;
        }

        let blocksX: number = randOptions(this.piece.features.movingDistances);
        let blocksY: number = randOptions(this.piece.features.movingDistances);
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

        let x: number = randInt(this.piece.features.gridSize);
        let y: number = randInt(this.piece.features.gridSize);

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

        this.updateData();

        this.active = true;
    }

    private updateData() {
        this.data[this.dataIndex] = (this.area.x / this.piece.width) * 2 - 1;
        this.data[this.dataIndex + 1] =
            2 - (this.area.y / this.piece.height) * 2 - 1;
        this.data[this.dataIndex + 2] = (this.dirX + this.shapeX) / 40; // max -40 / 40 => - 1 / 1
        this.data[this.dataIndex + 3] = -(this.dirY + this.shapeY) / 40; // max -40 / 40  => - 1 / 1
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

        // release blocks to prevent lock-ins (but allow pseudo-lock-ins) after x ticks
        this.maxTicks--;
        if (this.maxTicks == 0) {
            this.deactivate();
            return false;
        }

        if (this.movingDistanceX < 0 || this.movingDistanceY < 0) {
            this.deactivate();
            return false;
        }

        let sx: number = this.area.x;
        let sy: number = this.area.y;

        [this.shapeX, this.shapeY] = this.intersectsWithShapes(
            sx,
            sy,
            this.area.w,
            this.area.h
        );

        if (this.shapeX == 0.0 && this.shapeY == 0.0) {
            this.deactivate();
            return false;
        }

        let mx = this.dirX * this.piece.features.movingBehavior + this.shapeX;
        let my = this.dirY * this.piece.features.movingBehavior + this.shapeY;

        if (mx == 0 && my == 0) {
            this.deactivate();
            return false;
        }

        this.area.x -= mx;
        this.area.y -= my;

        this.movingDistanceX -= mx;
        this.movingDistanceY -= my;

        this.updateData();

        return true;
    }

    private intersectsWithShapes(
        x: number,
        y: number,
        w: number,
        h: number
    ): Array<number> {
        x = x + w / 2;
        y = y + h / 2;

        return this.piece.features.shapes.reduce(
            (v: Array<number>, shape: Circle | Rect | Quad) => {
                if (shape instanceof Circle) {
                    if (
                        isec.testRectCircle(
                            [x, y],
                            [1, 1],
                            [
                                shape.x * this.piece.width,
                                shape.y * this.piece.height,
                            ],
                            shape.r *
                                Math.min(this.piece.width, this.piece.height)
                        )
                    ) {
                        v[0] += shape.valueX;
                        v[1] += shape.valueY;
                    }
                } else if (
                    isec.testRectRect(
                        [x, y],
                        [1, 1],
                        [
                            shape.x * this.piece.width,
                            shape.y * this.piece.height,
                        ],
                        [
                            shape.w * this.piece.width,
                            shape.h * this.piece.height,
                        ]
                    )
                ) {
                    v[0] += shape.valueX;
                    v[1] += shape.valueY;
                }
                return v;
            },
            [0, 0]
        );
    }
}
