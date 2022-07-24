import { Area, rand, randInit, randInt, randOptions } from './rand';
import { color, ColorSpec } from './color';
import * as isec from '@thi.ng/geom-isec';
import { Circle, Quad, Rect } from './shapes';
import * as twgl from 'twgl.js';

export type FxhashFeatures = {
    color: string;
    'grid size': number;
    shapes: string;
    cluster: number;
    rotation: string;
    'moving blocks': number;
    'moving direction': string;
    'moving distance direction': string;
    'max step size': number;
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
    public readonly maxFramesBeforeReset: number;
    public readonly colorValueMin: number;
    public readonly colorValueMax: number;
    public blockConfig: Array<any> = [
        21, 34, 55, 89, 144, 233, 377, 610, 987, 1597, 2584, 4181, 6765, 10946,
    ];
    public movingDistances: Array<any> = [];
    public blockBase: number;
    public blockSize: number;
    public maxStepSizeBase: number;
    public maxStepSize: number;

    public movingDistanceDirectionBase: number;
    public movingDistanceDirection: number;

    public shapes: Array<Circle | Quad | Rect>;
    public shapeBase: number;
    public shapesCenterX: number;
    public shapesCenterY: number;

    public clusters: number;

    private rotationOptions: Array<number> = [-42, -21, -7, -3, 3, 7, 21, 42];
    public rotationBase: number;
    public rotation: number;
    public rotationRadians: number;
    public rotationCos: number;
    public rotationSin: number;

    public directionBase: number;
    public direction: Array<Array<'left' | 'up' | 'down' | 'right'>>;

    private static directionOptions: Array<
        Array<Array<'left' | 'up' | 'down' | 'right'>>
    >;
    public static getDirectionOptions(): Array<
        Array<Array<'left' | 'up' | 'down' | 'right'>>
    > {
        if (Features.directionOptions) {
            return Features.directionOptions;
        }
        const all: Array<Array<'left' | 'up' | 'down' | 'right'>> = [
            ['up'],
            ['left'],
            ['down'],
            ['right'],
            ['left', 'up'],
            ['left', 'down'],
            ['right', 'up'],
            ['right', 'down'],
        ];

        let combinations: Array<
            Array<Array<'left' | 'up' | 'down' | 'right'>>
        > = [];
        let temp: Array<Array<'left' | 'up' | 'down' | 'right'>> = [];
        let length = Math.pow(2, all.length);

        for (let i = 0; i < length; i++) {
            temp = [];
            for (let j = 0; j < all.length; j++) {
                if (i & Math.pow(2, j)) {
                    temp.push(all[j]);
                }
            }
            if (temp.length > 0) {
                combinations.push(temp);
            }
        }

        Features.directionOptions = combinations.filter(
            (c) => c.length >= 3 && c.length <= 4
        );
        return Features.directionOptions;
    }

    // todo: improve combination handling
    public static combinations: number =
        2 *
        5 *
        3 *
        3 *
        3 *
        Object.keys(color.palettes['unique-css']).length *
        Features.getDirectionOptions().length *
        8;

    public constructor(combination: number) {
        this.combination = combination % Features.combinations;

        this.movingDistanceDirectionBase = combination % 2;
        this.movingDistanceDirection = [-1, 1][
            this.movingDistanceDirectionBase
        ];
        combination = (combination / 2) << 0;

        this.maxStepSizeBase = combination % 3;
        this.maxStepSize = [1, 2, 3][this.maxStepSizeBase];
        combination = (combination / 3) << 0;

        this.blockBase = (combination % 5) + 3;
        let blocks = this.blockConfig.slice(
            this.blockBase - 1,
            this.blockBase + 4
        );
        this.maxMovingBlocks = blocks[3];
        this.movingDistances = this.blockConfig.slice(
            this.blockBase - 1,
            this.blockBase + 3
        );
        this.gridSize = blocks[4];
        this.maxFramesBeforeReset = blocks[3];
        this.blockSize = this.blockConfig[0];
        combination = (combination / 5) << 0;

        this.shapeBase = combination % 3;
        let numOfShapes = [3, 5, 7][this.shapeBase];
        this.shapes = [];
        combination = (combination / 3) << 0;

        this.clusters = (combination % 3) + 1;
        combination = (combination / 3) << 0;
        for (let i = 0; i < numOfShapes; i++) {
            let cluster = i % this.clusters;
            let wh = randOptions(
                [blocks[0], blocks[1], blocks[2]],
                [1, numOfShapes, 1]
            );
            let centerPadding = this.clusters > 1 ? wh / 2 + this.blockSize : 0;
            let angle =
                (120 / this.clusters) * rand() +
                cluster * (360 / this.clusters) +
                90;
            let distance =
                (this.gridSize * 0.5 -
                    wh / 2 -
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
                2 *
                randOptions([1, -1]);
            s.valueY =
                (rand() + randOptions([0.23, 0.29, 0.37])) *
                2 *
                randOptions([1, -1]);
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

        this.directionBase =
            combination % Features.getDirectionOptions().length;
        this.direction = Features.getDirectionOptions()[this.directionBase];
        combination =
            (combination / Features.getDirectionOptions().length) << 0;

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
        this.rotationCos = Math.cos(-this.rotationRadians);
        this.rotationSin = Math.sin(-this.rotationRadians);
        combination = (combination / this.rotationOptions.length) << 0;
    }

    public getFxhashFeatures(): FxhashFeatures {
        return {
            color: this.getColorName(),
            shapes: this.getShapes(),
            cluster: this.clusters,
            'grid size': this.gridSize,
            rotation: `${this.rotation}°`,
            'moving blocks': this.maxMovingBlocks,
            'moving direction': this.getDirectionName(),
            'moving distance direction': this.getMovingDistanceDirectionName(),
            'max step size': this.maxStepSize,
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

    public programInit!: twgl.ProgramInfo;
    public programOffsets!: twgl.ProgramInfo;
    public programPixels!: twgl.ProgramInfo;
    public programDraw!: twgl.ProgramInfo;

    public positionBuffer!: twgl.BufferInfo;
    public bufferOffsets!: twgl.BufferInfo;

    public framebuffers!: Array<twgl.FramebufferInfo>;
    public framebufferPixelsIndex: number = 0;

    public outputBuffer: number | null = null;

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
        }) as WebGL2RenderingContext;

        if (!twgl.isWebGL2(this.context)) {
            console.error(
                'A browser with webgl2 enabled is required to view this piece.'
            );
            this.paused = true;
            return;
        }

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
            
            uniform sampler2D pixels;
            uniform sampler2D offsets;
            uniform vec3 baseColor;
            uniform float pixelSize;
            uniform float pixelWidth;
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

            vec4 shiftColor(vec4 color) {
                return vec4(
                    bezier(
                        vec3(0.00),
                        vec3(0.05),
                        baseColor.rgb, 
                        baseColor.rgb + 0.05, 
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
            this.movingBlocks.data
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
    }

    private draw() {
        let world = twgl.m4.identity();

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
                world: twgl.m4.rotateZ(world, -this.features.rotationRadians),
            };
            twgl.setUniforms(this.programDraw, uniforms);
        } else {
            twgl.setUniforms(this.programDraw, {
                pixels: this.framebuffers[this.outputBuffer].attachments[0],
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
                this.debugContext.lineWidth = 1;
                this.debugContext.fillStyle = `rgba(0, ${
                    230 - shape.valueX * 10
                }, ${230 - shape.valueY * 10}, 0.2)`;
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
                this.debugContext.lineWidth = 1;
                this.debugContext.fillStyle = `rgba(${
                    230 - shape.valueX * 10
                }, ${230 - shape.valueY * 10}, 0, 0.2)`;
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
            this.debugContext.lineWidth = 1;
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

        this.movingBlocks();

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
                block.area.x - this.translationX,
                block.area.y - this.translationY,
                block.area.w,
                block.area.h
            );
            this.debugContext.strokeRect(
                block.area.x - this.translationX,
                block.area.y - this.translationY,
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
        this.total += this.piece.features.maxMovingBlocks - this.count;

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
        this.total = 0;
        this.data = new Float32Array(
            this.piece.features.maxMovingBlocks * MovingBlock.dataPoints
        );

        do {
            this.add();
        } while (this.total < this.piece.features.maxMovingBlocks);
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
        let move = randOptions(this.piece.features.direction);
        let stepSize = this.piece.features.maxStepSize;

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

        if (randInt(this.piece.features.maxStepSize + 1) == 0) {
            this.dirX *= rand() * (this.piece.features.maxStepSize - 1) + 1.0;
            this.dirY *= rand() * (this.piece.features.maxStepSize - 1) + 1.0;
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

        this.data[this.dataIndex] = (this.area.x / this.piece.width) * 2 - 1;
        this.data[this.dataIndex + 1] =
            2 - (this.area.y / this.piece.height) * 2 - 1;
        this.data[this.dataIndex + 2] = (this.dirX + this.shapeX) / 40; // max -40 / 40 => - 1 / 1
        this.data[this.dataIndex + 3] = -(this.dirY + this.shapeY) / 40; // max -40 / 40  => - 1 / 1

        this.active = true;
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

        // release blocks to prevent lock-ins (but allow pseudo-lock-ins).
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

        let mx =
            this.dirX * this.piece.features.movingDistanceDirection +
            this.shapeX;
        let my =
            this.dirY * this.piece.features.movingDistanceDirection +
            this.shapeY;

        if (mx == 0 && my == 0) {
            this.deactivate();
            return false;
        }

        this.area.x -= mx;
        this.area.y -= my;

        this.movingDistanceX -= mx;
        this.movingDistanceY -= my;

        this.data[this.dataIndex] = (this.area.x / this.piece.width) * 2 - 1;
        this.data[this.dataIndex + 1] =
            2 - (this.area.y / this.piece.height) * 2 - 1;
        this.data[this.dataIndex + 2] = (this.dirX + this.shapeX) / 40; // max -40 / 40 => - 1 / 1
        this.data[this.dataIndex + 3] = -(this.dirY + this.shapeY) / 40; // max -40 / 40  => - 1 / 1

        return true;
    }

    private intersectsWithShapes(
        x: number,
        y: number,
        w: number,
        h: number
    ): Array<number> {
        [x, y] = [x + w / 2, y + h / 2];

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
