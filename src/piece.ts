import { Area, rand, randInit, randInt, randOptions } from './rand';
import { color, ColorSpec } from './color';
import * as isec from '@thi.ng/geom-isec';
import { mod } from '@thi.ng/math';
import { Circle, Quad } from './shapes';

export type FxhashFeatures = {
    color: string;
    colorShiftDir: number;
    colorShiftFactor: number;
    shape: string;
    rotation: number;
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

    public maxMovingBlocks: number = 400;

    public readonly gridSize: number = 200;
    public readonly blockSize: number = 10;

    public readonly shapeBase: number;
    public readonly shapes: Array<Circle | Quad> = [];

    public readonly colorRGBMax: number;
    public readonly colorShiftPixelFn: (
        data: ImageData,
        i: number,
        inShape: boolean,
        pixelRatio: number
    ) => void;

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

    public static combinations: number =
        Object.keys(color.palettes['unique-css-light']).length *
        2 *
        3 *
        2 *
        2 *
        Features.animationOptions.length;

    public constructor(combination: number) {
        this.combination = combination % Features.combinations;

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

        this.animationBase = combination % Features.animationOptions.length;
        this.animation = Features.animationOptions[this.animationBase];
        combination = (combination / Features.animationOptions.length) << 0;

        let colors = Object.values(color.palettes['unique-css-light']);
        this.colorHueBase = combination % colors.length;
        this.colorName = colors[this.colorHueBase].name;
        this.color = colors[this.colorHueBase];
        this.colorHue = this.color.hsv[0];
        this.colorSaturation = this.color.hsv[1];
        this.colorValueMin = 0.4;
        this.colorValueMax = this.color.hsv[2];
        combination = (combination / colors.length) << 0;

        this.colorRGBMax = Math.max(...this.color.rgb);
        let colorRGBMin = this.color.rgb.map((rgb) => (rgb !== 0 ? rgb : 51));

        let rgbIndex = [0, 1, 2];
        if (
            this.color.rgb[0] >= this.color.rgb[1] &&
            this.color.rgb[1] >= this.color.rgb[2]
        ) {
            rgbIndex = [0, 1, 2];
        } else if (
            this.color.rgb[0] >= this.color.rgb[2] &&
            this.color.rgb[2] >= this.color.rgb[1]
        ) {
            rgbIndex = [0, 2, 1];
        } else if (
            this.color.rgb[1] >= this.color.rgb[0] &&
            this.color.rgb[0] >= this.color.rgb[2]
        ) {
            rgbIndex = [1, 0, 2];
        } else if (
            this.color.rgb[1] >= this.color.rgb[2] &&
            this.color.rgb[2] >= this.color.rgb[0]
        ) {
            rgbIndex = [1, 2, 0];
        } else if (
            this.color.rgb[2] >= this.color.rgb[0] &&
            this.color.rgb[0] >= this.color.rgb[1]
        ) {
            rgbIndex = [2, 0, 1];
        } else {
            rgbIndex = [2, 1, 0];
        }
        this.colorShiftPixelFn = (
            data: ImageData,
            i: number,
            inShape: boolean,
            pixelRatio: number
        ) => {
            data.data[rgbIndex[0] + i] = mod(
                data.data[rgbIndex[0] + i] +
                    this.colorShiftDir * pixelRatio * 2 * this.colorShiftFactor,
                colorRGBMin[rgbIndex[0]] * (inShape ? 1 : 0.6)
            );
            data.data[rgbIndex[2] + i] = mod(
                data.data[rgbIndex[2] + i] -
                    this.colorShiftDir * 2 * pixelRatio,
                colorRGBMin[rgbIndex[2]] * (inShape ? 1 : 0.5)
            );
            data.data[rgbIndex[1] + i] = mod(
                Math.abs(
                    data.data[rgbIndex[0] + i] - data.data[rgbIndex[2] + i]
                ),
                colorRGBMin[rgbIndex[1]] * (inShape ? 1 : 0.4)
            );
        };
        console.log(this.color.rgb);
        console.log(rgbIndex);

        let r = 0.45;
        let c = 0; //rand() * 0.2 - 0.1;
        let p = this.shapeBase === 0 ? 0.05 : 0.08;
        this.shapes.push(new Circle(0.5, 0.5, r));
        let w = 0.25 - p + rand() * 0.1;
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
        // r -= rand() * 0.05 + 0.1;
        // this.shapes.push(new Circle(0.5, 0.5, r));
    }

    public getFxhashFeatures(): FxhashFeatures {
        return {
            color: this.colorName,
            colorShiftDir: this.colorShiftDir,
            colorShiftFactor: this.colorShiftFactor,
            shape: this.shapeBase === 0 ? 'circle' : 'quad',
            rotation: this.rotation,
            animation: this.animation.map((i) => i.join('-')).join(','),
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
}

export class Piece {
    public features!: Features;

    public width: number = 0;
    public height: number = 0;
    public baseHeightWidth: number = 960;
    public fps: number = 60;
    public pixelRatio: number = 2;

    public canvas: HTMLCanvasElement;
    public context: CanvasRenderingContext2D;

    public movingBlocks!: MovingBlocks;

    public combination: number;

    public inPreviewPhase!: boolean;
    public previewPhaseEndsAfterBase: number = 900;
    public previewPhaseEndsAfter!: number;

    public debug!: DebugPiece;

    public paused: boolean = false;

    public constructor(
        canvas: HTMLCanvasElement,
        width: number,
        height: number,
        combination: number
    ) {
        this.canvas = canvas;
        this.context = canvas.getContext('2d') as CanvasRenderingContext2D;
        this.combination = combination;

        this.updateSize(width, height);
        this.setSmoothing(false);

        this.debug = new DebugPiece(this);
    }

    private initState() {
        randInit(window.fxhash);
        this.features = new Features(this.combination);
        this.movingBlocks = new MovingBlocks(this);
        this.inPreviewPhase = true;
        this.movingBlocks.init();
        this.paused = false;
    }

    public updateSize(
        width: number,
        height: number,
        pixelRatio: number | null = null
    ) {
        this.initState();
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
        this.context.scale(this.pixelRatio, this.pixelRatio);
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
        this.initImage();
    }

    private setSmoothing(active: boolean) {
        this.context.imageSmoothingEnabled = active;
        this.canvas.style.imageRendering = active ? 'auto' : 'pixelated';
    }

    private getSmoothing(): boolean {
        return this.context.imageSmoothingEnabled;
    }

    public toggleSmoothing(): boolean {
        let active: boolean = !this.getSmoothing();
        this.setSmoothing(active);
        return active;
    }

    public initImage() {
        let css = color.hsvCss(
            this.features.colorHue,
            this.features.colorSaturation,
            this.features.colorValueMax
        );
        document.body.style.backgroundColor = css;
        this.context.fillStyle = css;
        this.context.fillRect(0, 0, this.width, this.height);
    }

    public tick() {
        if (this.paused) {
            return;
        }

        this.debug.tickPiece();

        if (!this.movingBlocks.tick()) {
            return;
        }

        if (
            this.inPreviewPhase &&
            this.movingBlocks.totalFrames >= this.previewPhaseEndsAfter
        ) {
            this.inPreviewPhase = false;
            this.paused = true;
        }
    }

    public captureImage(name: string) {
        let previewCanvas = this.preparePreviewCanvas();

        let link = document.createElement('a');
        link.download = name + '.png';
        link.href = previewCanvas.toDataURL();
        link.click();
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

        resizedContext.imageSmoothingEnabled =
            this.context.imageSmoothingEnabled;
        resizedContext?.drawImage(
            this.canvas,
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
            ((this.area.w + 1) * this.piece.width) /
            this.piece.features.gridSize;
        this.area.h =
            ((this.area.h + 1) * this.piece.height) /
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

        let sx: number = this.area.x - this.dirX;
        let sy: number = this.area.y - this.dirY;

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

        this.move(sx, sy, this.area.w, this.area.h, this.area.x, this.area.y);

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

    private move(
        sx: number,
        sy: number,
        sw: number,
        sh: number,
        tx: number,
        ty: number
    ) {
        this.piece.context.putImageData(
            this.shiftColor(this.piece.context.getImageData(sx, sy, sw, sh)),
            tx,
            ty
        );
    }

    private shiftColor(data: ImageData) {
        let l: number = data.data.length;

        for (let i: number = 0; i < l; i += 4) {
            this.piece.features.colorShiftPixelFn(
                data,
                i,
                this.inShape,
                this.piece.pixelRatio
            );
        }
        return data;
    }
}
