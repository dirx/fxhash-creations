import { Area, randInit, randInt, randOptions } from './rand';
import { color, ColorSpec } from './color';
import * as isec from '@thi.ng/geom-isec';
import { Circle, Quad, Rect } from './shapes';
import { floorTo, mod } from '@thi.ng/math';

export type FxhashFeatures = {
    color: string;
    'grid size': number;
    'limiting shapes': string;
    rotation: number;
    'moving blocks': number;
    'moving direction': string;
    'moving diagonal': boolean;
    'moving distance direction': string;
};

export class Features {
    public static combinations: number =
        2 *
        2 *
        4 *
        4 *
        2 *
        Object.keys(color.palettes['unique-css']).length *
        8;
    public combination: number = 1;
    public readonly colorHue: number;
    public readonly colorName: string;
    public readonly colorHueBase: number;
    public readonly color: ColorSpec;
    public readonly colorSaturation: number;
    public maxMovingBlocks: number;
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

    public diagonalBase: number;
    public diagonal: boolean;

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

    public directions: Array<Array<'left' | 'up' | 'down' | 'right'>> = [
        ['right', 'up'],
        ['right', 'down'],
        ['left', 'down'],
        ['left', 'up'],
    ];
    public direction: Array<'left' | 'up' | 'down' | 'right'> = [
        'left',
        'up',
        'right',
        'down',
    ];
    public directionBase: number;

    public constructor(combination: number) {
        this.combination = combination % Features.combinations;

        this.movingDistanceDirectionBase = combination % 2;
        this.movingDistanceDirection = [-1, 1][
            this.movingDistanceDirectionBase
        ];
        combination = (combination / 2) << 0;

        this.diagonalBase = combination % 2;
        this.diagonal = this.diagonalBase === 1;
        combination = (combination / 2) << 0;

        this.stepSizeBase = 0; // fix 1 pixel
        this.stepSize = [1, 2, 3, 5][this.stepSizeBase];

        this.blockBase = (combination % 4) + 1;
        let blocks = this.blockConfig.slice(this.blockBase, this.blockBase + 4);
        this.maxMovingBlocks = blocks[1];
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
                            [blocks[0], blocks[1]],
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
                            [blocks[0] + 10, blocks[1]],
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

        this.directionBase = combination % 4;
        this.direction = this.directions[this.directionBase];
        combination = (combination / 4) << 0;

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
            rotation: this.rotation,
            'moving blocks': this.maxMovingBlocks,
            'moving direction': this.direction.join(' '),
            'moving diagonal': this.diagonal,
            'moving distance direction': this.getMovingDistanceDirectionName(),
        };
    }

    public getFeatureName(): string {
        return [
            this.getColorName(),
            this.shapes.length,
            this.gridSize,
            this.rotation,
            this.maxMovingBlocks,
            this.direction.join('-'),
            this.diagonal,
            this.getMovingDistanceDirectionName(),
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
    public baseHeightWidth: number = 960;
    public pixelRatio: number = 1;
    public fps: number = 60;

    public canvas: HTMLCanvasElement;
    public context: CanvasRenderingContext2D;

    public movingBlocks!: MovingBlocks;

    public combination: number;

    public inPreviewPhase: boolean = true;
    public previewPhaseEndsAfter: number = 900;
    public readonly previewPhaseEndsAfterBase: number = 900;

    public debug: DebugPiece;

    public constructor(
        canvas: HTMLCanvasElement,
        width: number,
        height: number,
        pixelRatio: number | null = null,
        combination: number
    ) {
        this.canvas = canvas;
        this.context = canvas.getContext('2d', {
            alpha: false,
        }) as CanvasRenderingContext2D;
        this.combination = combination;

        this.updateSize(width, height, pixelRatio);
        this.setSmoothing(false);

        this.debug = new DebugPiece(this);
    }

    private initState() {
        randInit(window.fxhash);
        this.features = new Features(this.combination);
        this.inPreviewPhase = true;

        this.movingBlocks = new MovingBlocks(this);
        this.movingBlocks.init();
    }

    public updateSize(
        width: number,
        height: number,
        pixelRatio: number | null = null
    ) {
        this.initState();
        if (pixelRatio === null) {
            this.pixelRatio = Math.ceil(
                (width + height) / 2 / this.baseHeightWidth
            );
        } else {
            this.pixelRatio = pixelRatio;
        }
        this.previewPhaseEndsAfter =
            this.previewPhaseEndsAfterBase / this.pixelRatio;
        this.context.scale(this.pixelRatio, this.pixelRatio);
        this.width = (width / this.pixelRatio) << 0;
        this.height = (height / this.pixelRatio) << 0;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

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
        this.debug.tickPiece();
        if (!this.movingBlocks.tick()) {
            return;
        }

        if (
            this.inPreviewPhase &&
            this.movingBlocks.totalFrames > this.previewPhaseEndsAfter
        ) {
            this.inPreviewPhase = false;
            this.canvas.dispatchEvent(new Event('piece.previewPhaseEnded'));
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
        previewCanvas.style.imageRendering = this.canvas.style.imageRendering;
        resizedContext?.drawImage(
            this.canvas,
            0,
            0,
            previewCanvas.width,
            previewCanvas.height
        );
        1;

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
    }

    public toggle() {
        if (this.debugContext && this.debugCanvas) {
            this.debugCanvas.remove();
            this.debugCanvas = null;
            this.debugContext = null;
        } else {
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
            this.debugContext.scale(
                this.piece.pixelRatio,
                this.piece.pixelRatio
            );

            this.translationX = this.piece.width / 2;
            this.translationY = this.piece.height / 2;

            this.tickPiece();
        }
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
                this.debugContext.fillStyle = '#00000011';
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
                this.debugContext.fillStyle = '#00000011';
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
            this.debugContext.fillStyle = '#ffffff11';
            this.debugContext.beginPath();
            this.debugContext.arc(
                shape.centerX * this.piece.width - this.translationX,
                shape.centerY * this.piece.height - this.translationY,
                (10 / this.piece.width) *
                    Math.min(this.piece.width, this.piece.height),
                0,
                2 * Math.PI,
                false
            );
            this.debugContext.closePath();
            this.debugContext.stroke();
            this.debugContext.fill();
        });

        this.debugContext.strokeStyle = '#00ff00';
        this.debugContext.fillStyle = '#ffffff11';
        this.debugContext.beginPath();
        this.debugContext.arc(
            this.piece.features.shapesCenterX * this.piece.width -
                this.translationX,
            this.piece.features.shapesCenterY * this.piece.height -
                this.translationY,
            (15 / this.piece.width) *
                Math.min(this.piece.width, this.piece.height),
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

        this.debugContext.strokeStyle = `rgba(0, 0, 0, 0.3)`;
        this.debugContext.strokeRect(tx, ty, sw, sh);
        return true;
    }
}

export class MovingBlocks {
    public totalFrames: number = 0;
    private blocks: Array<MovingBlock> = [];
    public count: number = 0;
    public total: number = 0;
    private piece: Piece;

    public constructor(piece: Piece) {
        this.piece = piece;
        this.init();
    }

    public tick(): boolean {
        this.totalFrames++;

        this.blocks = this.blocks.filter((block) => block.tick());
        this.count = this.blocks.length;

        if (this.count >= this.piece.features.maxMovingBlocks) {
            return false;
        }

        do {
            this.add();
        } while (this.count < this.piece.features.maxMovingBlocks);

        return true;
    }

    private add(): void {
        this.blocks.push(new MovingBlock(this.piece));
        this.count = this.blocks.length;
        this.total++;
    }

    public init(): void {
        this.blocks = [];
        this.count = 0;
        this.total = 0;
    }
}

export class MovingBlock {
    public readonly area: Area;
    public readonly dirX: number = 0;
    public readonly dirY: number = 0;
    public readonly vMin: number;
    public readonly vMax: number;
    public readonly vDir: number;

    private movingDistanceX: number = 0;
    private movingDistanceY: number = 0;

    private dirXShapesFactor: number;
    private dirYShapesFactor: number;

    public constructor(public readonly piece: Piece) {
        let move: Array<string>;

        let blocksX: number = randOptions(this.piece.features.movingDistances);
        let blocksY: number = randOptions(this.piece.features.movingDistances);

        if (this.piece.features.diagonal) {
            let m: string = randOptions(piece.features.direction);
            move =
                {
                    left: ['left', 'down'],
                    up: ['left', 'up'],
                    right: ['right', 'up'],
                    down: ['right', 'down'],
                }[m] ?? [];
        } else {
            move = [randOptions(piece.features.direction)];
        }

        let stepSize = this.piece.features.stepSize;

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

        let h: number = piece.features.blockSize;
        let w: number = piece.features.blockSize;
        let x: number = randInt(
            piece.features.gridSize -
                blocksX * (this.piece.features.diagonalBase * 2)
        );
        let y: number = randInt(
            piece.features.gridSize -
                blocksY * (this.piece.features.diagonalBase * 2)
        );

        let area: Area = {
            x: x,
            y: y,
            w: w,
            h: h,
        };

        area.x = (area.x * piece.width) / piece.features.gridSize;
        area.y = (area.y * piece.height) / piece.features.gridSize;
        area.w = (area.w * piece.width) / piece.features.gridSize;
        area.h = (area.h * piece.height) / piece.features.gridSize;

        area.x = area.x << 0;
        area.y = area.y << 0;
        area.w = area.w << 0;
        area.h = area.h << 0;

        this.area = area;

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
    }

    public tick(): boolean {
        if (this.movingDistanceX < 0 || this.movingDistanceY < 0) {
            return false;
        }

        let sx: number;
        let sy: number;
        let sw: number = this.area.w;
        let sh: number = this.area.h;
        let tx: number;
        let ty: number;

        tx = sx = this.area.x;
        ty = sy = this.area.y;

        if (this.dirX !== 0) {
            sx = this.area.x + this.movingDistanceX;
            tx =
                sx +
                this.dirX *
                    this.dirXShapesFactor *
                    Math.sin(this.movingDistanceX / this.piece.width);
        }

        if (this.dirY !== 0) {
            sy = this.area.y + this.movingDistanceY;
            ty =
                sy +
                this.dirY *
                    this.dirYShapesFactor *
                    Math.cos(this.movingDistanceY / this.piece.height);
        }

        if (sw <= 0 || sh <= 0) {
            return false;
        }

        if (!this.intersectsWithShapes(sx, sy, sw, sh)) {
            return false;
        }

        if (!this.intersectsWithDrawingArea(sx, sy, sw, sh)) {
            return false;
        }

        this.move(sx << 0, sy << 0, sw << 0, sh << 0, tx << 0, ty << 0);

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
            x,
            y
        );

        return this.piece.features.shapes.some(
            (shape: Circle | Rect | Quad) => {
                if (shape instanceof Circle) {
                    return isec.testRectCircle(
                        [x + w / 2, y + h / 2],
                        [1, 1],
                        [
                            shape.x * this.piece.width,
                            shape.y * this.piece.height,
                        ],
                        shape.r * Math.min(this.piece.width, this.piece.height)
                    );
                }
                return isec.testRectRect(
                    [x + w / 2, y + h / 2],
                    [1, 1],
                    [shape.x * this.piece.width, shape.y * this.piece.height],
                    [shape.w * this.piece.width, shape.h * this.piece.height]
                );
            }
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
        // debug
        if (this.piece.debug.moveMovingBlock(tx, ty, sw, sh)) {
            return;
        }

        this.piece.context.putImageData(
            this.shiftColor(
                this.piece.context.getImageData(sx, sy, sw, sh),
                sx,
                sy
            ),
            tx,
            ty
        );
        return;
    }

    private shiftColor(data: ImageData, sx: number, sy: number) {
        let l: number = data.data.length;
        let f: number = Math.sin(
            (sx + sy) /
                (this.piece.width + this.piece.height) /
                this.piece.pixelRatio
        );
        let fC = f * 7;

        for (let i: number = 0; i < l; i += 4) {
            let r = data.data[i];
            let g = data.data[i + 1];
            let b = data.data[i + 2];

            [r, g, b] = color.rotate(
                r,
                g,
                b,
                this.vMin,
                this.vMax,
                this.vDir,
                this.piece.features.colorSaturation,
                mod(this.piece.features.colorHue - fC, 360)
            );

            data.data[i] = r;
            data.data[i + 1] = g;
            data.data[i + 2] = b;
        }
        return data;
    }
}
