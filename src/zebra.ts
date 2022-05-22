import { Area, randInt, randOptions, randInit, randBoolean } from './rand';
import { color, ColorSpec } from './color';

export type FxhashFeatures = {
    color: string;
};

export class ZebraFeatures {
    public static combinations: number = Object.entries(color.uniqueColorSpec)
        .length;
    public combination: number = 1;
    public readonly colorHue: number;
    public readonly colorName: string;
    public readonly colorHueBase: number;
    public readonly color: ColorSpec;
    public readonly colorSaturation: number;
    public maxMovingBlocks: number = 63;
    public readonly blocks: number = 252;
    public readonly colorValueMin: number;
    public readonly colorValueMax: number;
    public movingDistances: Array<any> = [21, 42, 84, 168];
    public blockSize: number = 42;

    public constructor(combination: number) {
        color.filterCssColorSpec();
        this.combination = combination % ZebraFeatures.combinations;

        let colors = Object.entries(color.uniqueColorSpec);
        this.colorHueBase = combination % colors.length;
        this.colorName = colors[this.colorHueBase][0];
        this.color = colors[this.colorHueBase][1] as ColorSpec;
        this.colorHue = this.color.hsv[0];
        this.colorSaturation = this.color.hsv[1];
        this.colorValueMin = 0.05;
        this.colorValueMax = this.color.hsv[2];
    }

    public getFxhashFeatures(): FxhashFeatures {
        return {
            color: this.getColorName(),
        };
    }

    public getFeatureName(): string {
        return [this.getColorName(), this.combination, window.fxhash]
            .join('-')
            .replace(/\s+/g, '');
    }

    public getColor(): number {
        return this.color.hsv[0];
    }

    public getColorName(): string {
        return this.colorName;
    }
}

export class Zebra {
    public features!: ZebraFeatures;

    public width: number = 0;
    public height: number = 0;
    public baseHeightWidth: number = (640 + 480) / 2;
    public pixelRatio: number = 2;
    public fps: number = 30;

    public canvas: HTMLCanvasElement;
    public context: CanvasRenderingContext2D;

    public movingBlocks: ZebraMovingBlocks;
    public movingFlow: ZebraMovingFlow;

    public combination: number;

    public inPreviewPhase!: boolean;
    public previewPhaseEndsAfter!: number;

    public constructor(
        canvas: HTMLCanvasElement,
        width: number,
        height: number,
        combination: number
    ) {
        this.canvas = canvas;
        this.context = canvas.getContext('2d') as CanvasRenderingContext2D;
        this.combination = combination;

        this.movingBlocks = new ZebraMovingBlocks(this);
        this.movingFlow = new ZebraMovingFlow(this);

        this.updateSize(width, height);
        this.setSmoothing(false);
    }

    private initState() {
        randInit(window.fxhash);
        this.features = new ZebraFeatures(this.combination);
        this.inPreviewPhase = true;
        this.previewPhaseEndsAfter = this.features.maxMovingBlocks * 7;
        this.movingBlocks.init();
        this.movingFlow.init();
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
        this.context.scale(this.pixelRatio, this.pixelRatio);
        this.width = (width / this.pixelRatio) << 0;
        this.height = (height / this.pixelRatio) << 0;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.canvas.dispatchEvent(new Event('zebra.updateSize'));
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
        this.context.fillStyle = color.hsvCss(
            this.features.colorHue,
            this.features.colorSaturation,
            this.features.colorValueMin
        );
        this.context.fillRect(0, 0, this.width, this.height);
    }

    public tick() {
        this.movingFlow.tick();

        if (!this.movingBlocks.tick()) {
            return;
        }

        if (
            this.inPreviewPhase &&
            this.movingBlocks.total > this.previewPhaseEndsAfter
        ) {
            this.inPreviewPhase = false;
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

        previewCanvas.height = this.height * this.pixelRatio;
        previewCanvas.width = this.width * this.pixelRatio;

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

export class ZebraMovingFlow {
    public directionOptions: Array<Array<'left' | 'up' | 'down' | 'right'>> = [
        // ['up'],
        ['right', 'up'],
        // ['right'],
        ['right', 'down'],
        // ['down'],
        ['left', 'down'],
        // ['left'],
        ['left', 'up'],
    ];
    public direction: Array<'left' | 'up' | 'down' | 'right'> = [];
    public position: number = 0;
    public clockwise: boolean = true;
    public waitBlocks: number = 0;
    public changeInBlocks: number = 0;
    private zebra: Zebra;

    public constructor(zebra: Zebra) {
        this.zebra = zebra;
        this.init();
    }

    public init() {
        this.direction = ['left', 'up', 'right', 'down'];
        this.position = randInt(this.directionOptions.length);
        this.clockwise = true;
        this.changeInBlocks = 144;
        this.waitBlocks = 144;
    }

    public tick() {
        if (this.zebra.movingBlocks.total >= this.changeInBlocks) {
            if (randInt(7) === 0) {
                this.clockwise = randBoolean();
            }

            this.position = this.clockwise
                ? this.position + 1
                : this.position - 1;

            if (this.position >= this.directionOptions.length) {
                this.position -= this.directionOptions.length;
            } else if (this.position < 0) {
                this.position += this.directionOptions.length;
            }

            if (randInt(7) === 0) {
                this.direction = ['left', 'up', 'right', 'down'];
            } else {
                this.direction = this.directionOptions[this.position];
            }

            this.waitBlocks = randOptions([144, 233, 377]);
            this.changeInBlocks =
                this.zebra.movingBlocks.total + this.waitBlocks;
        }
    }
}

export class ZebraMovingBlocks {
    public totalFrames: number = 0;
    private currentFrames: number = 0;
    private inFrames: number = 0;
    private blocks: Array<ZebraMovingBlock> = [];
    private butterflyBlocks: Array<ZebraMovingBlock> = [];
    public count: number = 0;
    public butterflyCount: number = 0;
    public total: number = 0;
    private zebra: Zebra;

    public constructor(zebra: Zebra) {
        this.zebra = zebra;
        this.init();
    }

    public wait(frames: number) {
        this.currentFrames = 0;
        this.inFrames = frames << 0;
    }

    public frames(): number {
        return this.inFrames - this.currentFrames;
    }

    public tick(): boolean {
        this.totalFrames++;
        this.currentFrames++;

        this.butterflyBlocks = this.butterflyBlocks.filter((block) =>
            block.tick()
        );
        this.butterflyCount = this.butterflyBlocks.length;

        this.blocks = this.blocks.filter((block) => block.tick());
        this.count = this.blocks.length;

        if (this.count >= this.zebra.features.maxMovingBlocks) {
            return false;
        }

        if (this.currentFrames < this.inFrames) {
            return false;
        }

        this.add();

        return true;
    }

    private add(): void {
        this.blocks.push(new ZebraMovingBlock(this.zebra));
        this.count = this.blocks.length;
        this.total++;
    }

    public addButterfly(x: number | null = null, y: number | null = null) {
        x = x || Math.random() * this.zebra.width * this.zebra.pixelRatio;
        y = y || Math.random() * this.zebra.height * this.zebra.pixelRatio;
        let w: number =
            (this.zebra.features.blockSize / this.zebra.features.blocks) *
            this.zebra.width;
        let h: number =
            (this.zebra.features.blockSize / this.zebra.features.blocks) *
            this.zebra.height;
        let area = {
            x: (x / this.zebra.pixelRatio - w / 2) << 0,
            y: (y / this.zebra.pixelRatio - h / 2) << 0,
            w: w << 0,
            h: h << 0,
        };
        let move: string =
            this.zebra.movingFlow.direction[
                (Math.random() * this.zebra.movingFlow.direction.length) << 0
            ];
        let movingDistance: number = ((w + h) / 2) << 0;
        this.butterflyBlocks.push(
            new ZebraMovingBlock(this.zebra, area, move, movingDistance)
        );
        this.butterflyCount = this.butterflyBlocks.length;
        this.total++;
    }

    public init(): void {
        this.blocks = [];
        this.count = 0;
        this.butterflyBlocks = [];
        this.butterflyCount = 0;
        this.total = 0;
        this.wait(0);
    }
}

export class ZebraMovingBlock {
    public readonly area: Area;
    public readonly dir: number;
    public readonly isDirX: boolean;
    public readonly vMin: number;
    public readonly vMax: number;

    private movingDistance: number = 0;
    private color: string | CanvasGradient | CanvasPattern;

    public constructor(
        public readonly zebra: Zebra,
        area: Area | null = null,
        move: string | null = null,
        movingDistance: number | null = null
    ) {
        this.color = randOptions(Object.keys(color.uniqueColorSpec));
        let h: number;
        let w: number;

        if (area === null) {
            h = zebra.features.blockSize;
            w = zebra.features.blockSize;
            let x: number = randInt(zebra.features.blocks + h / 2) - h;
            let y: number = randInt(zebra.features.blocks + w / 2) - w;

            area = {
                x: x,
                y: y,
                w: w,
                h: h,
            };

            area.x = (area.x * zebra.width) / zebra.features.blocks;
            area.y = (area.y * zebra.height) / zebra.features.blocks;
            area.w = (area.w * zebra.width) / zebra.features.blocks;
            area.h = (area.h * zebra.height) / zebra.features.blocks;
        }

        area.x = area.x << 0;
        area.y = area.y << 0;
        area.w = area.w << 0;
        area.h = area.h << 0;

        this.area = area;

        if (move === null) {
            move = randOptions(zebra.movingFlow.direction);
        }
        switch (move) {
            case 'up':
                this.isDirX = false;
                this.dir = -1;
                break;
            case 'down':
                this.isDirX = false;
                this.dir = 1;
                break;
            case 'left':
                this.isDirX = true;
                this.dir = -1;
                break;
            default:
            case 'right':
                this.isDirX = true;
                this.dir = 1;
                break;
        }

        if (movingDistance === null) {
            let blocks: number = randOptions(
                this.zebra.features.movingDistances
            );

            if (this.isDirX) {
                movingDistance =
                    (blocks * this.zebra.width) / this.zebra.features.blocks;
            } else {
                movingDistance =
                    (blocks * this.zebra.height) / this.zebra.features.blocks;
            }
        }
        this.movingDistance = movingDistance << 0;

        this.vMin = 255 * this.zebra.features.colorValueMin;
        this.vMax = 255 * this.zebra.features.colorValueMax;
    }

    public tick(): boolean {
        if (this.movingDistance === 0) {
            return false;
        }

        let sx: number;
        let sy: number;
        let sw: number = this.area.w;
        let sh: number = this.area.h;
        let tx: number;
        let ty: number;

        if (this.isDirX) {
            let maxWidth = this.zebra.width - (this.dir > 0 ? this.dir : 0);
            sx = this.area.x + this.movingDistance;
            sy = this.area.y;

            if (sx < 0) {
                sx = 0;
            }

            if (sx > maxWidth) {
                return false;
            }

            if (sx + sw > maxWidth) {
                sw = maxWidth - sx;
            }

            tx = sx + this.dir;
            ty = sy;
        } else {
            let maxHeight = this.zebra.height - (this.dir > 0 ? this.dir : 0);
            sx = this.area.x;
            sy = this.area.y + this.movingDistance;

            if (sy < 0) {
                sy = 0;
            }

            if (sy > maxHeight) {
                return false;
            }

            if (sy + sh > maxHeight) {
                sh = maxHeight - sy;
            }

            tx = sx;
            ty = sy + this.dir;
        }

        if (sw <= 0 || sh <= 0) {
            return false;
        }

        this.move(sx, sy, sw, sh, tx, ty);
        this.movingDistance -= this.dir;
        return true;
    }

    private move(
        sx: number,
        sy: number,
        sw: number,
        sh: number,
        tx: number,
        ty: number
    ) {
        this.zebra.context.putImageData(
            this.shiftColor(this.zebra.context.getImageData(sx, sy, sw, sh)),
            tx,
            ty
        );
        return;

        // debug
        this.zebra.context.fillStyle = this.color;
        this.zebra.context.fillRect(tx, ty, sw, sh);
    }

    private shiftColor(data: ImageData) {
        let l: number = data.data.length;

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
                this.zebra.features.colorSaturation,
                this.zebra.features.colorHue
            );

            data.data[i] = r;
            data.data[i + 1] = g;
            data.data[i + 2] = b;
        }
        return data;
    }
}
