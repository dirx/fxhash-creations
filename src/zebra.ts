import { Area, randInt, randOptions, randInit, randBoolean } from './rand';
import { color, ColorSpec } from './color';

export type FxhashFeatures = {
    color: string;
    stepSize: number;
    gridSize: number;
};

export class ZebraFeatures {
    public static combinations: number =
        Object.keys(color.palettes['unique-css']).length * 4 * 5;
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

    public constructor(combination: number) {
        this.combination = combination % ZebraFeatures.combinations;

        this.stepSizeBase = combination % 4;
        this.stepSize = [1, 2, 3, 5][this.stepSizeBase];
        combination = (combination / 4) << 0;

        this.blockBase = combination % 5;
        let blocks = this.blockConfig.slice(this.blockBase, this.blockBase + 4);
        this.maxMovingBlocks = blocks[0];
        this.movingDistances = blocks;
        this.gridSize = blocks[3];
        this.waitBlocks =
            this.blockConfig[this.blockBase + this.stepSizeBase + 2];
        this.blockSize = 42;
        combination = (combination / 5) << 0;

        let colors = Object.values(color.palettes['unique-css']);
        this.colorHueBase = combination % colors.length;
        this.colorName = colors[this.colorHueBase].name;
        this.color = colors[this.colorHueBase];
        this.colorHue = this.color.hsv[0];
        this.colorSaturation = this.color.hsv[1];
        this.colorValueMin = 0.05;
        this.colorValueMax = this.color.hsv[2];
        combination = (combination / colors.length) << 0;
    }

    public getFxhashFeatures(): FxhashFeatures {
        return {
            color: this.getColorName(),
            stepSize: this.stepSize,
            gridSize: this.gridSize,
        };
    }

    public getFeatureName(): string {
        return [
            this.getColorName(),
            this.gridSize,
            this.stepSize,
            this.combination,
            window.fxhash,
        ]
            .join('-')
            .replace(/\s+/g, '');
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
    public fps: number = 60;

    public canvas: HTMLCanvasElement;
    public context: CanvasRenderingContext2D;

    public movingBlocks!: ZebraMovingBlocks;
    public movingFlow!: ZebraMovingFlow;

    public combination: number;

    public inPreviewPhase: boolean = true;
    public previewPhaseEndsAfter: number = 1764;

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
    }

    private initState() {
        randInit(window.fxhash);
        this.features = new ZebraFeatures(this.combination);
        this.inPreviewPhase = true;

        this.movingBlocks = new ZebraMovingBlocks(this);
        this.movingBlocks.init();

        this.movingFlow = new ZebraMovingFlow(this);
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
            this.movingBlocks.totalFrames > this.previewPhaseEndsAfter
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

export class ZebraMovingFlow {
    public directionOptions: Array<Array<'left' | 'up' | 'down' | 'right'>> = [
        ['right', 'up'],
        ['right', 'down'],
        ['left', 'down'],
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
        this.changeInBlocks = this.zebra.features.movingDistances[1];
        this.waitBlocks = this.zebra.features.movingDistances[1];
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

            this.waitBlocks = this.zebra.features.waitBlocks;
            this.changeInBlocks =
                this.zebra.movingBlocks.total + this.waitBlocks;
        }
    }
}

export class ZebraMovingBlocks {
    public totalFrames: number = 0;
    private blocks: Array<ZebraMovingBlock> = [];
    public count: number = 0;
    public total: number = 0;
    private zebra: Zebra;

    public constructor(zebra: Zebra) {
        this.zebra = zebra;
        this.init();
    }

    public tick(): boolean {
        this.totalFrames++;

        this.blocks = this.blocks.filter((block) => block.tick());
        this.count = this.blocks.length;

        if (this.count >= this.zebra.features.maxMovingBlocks) {
            return false;
        }

        do {
            this.add();
        } while (this.count < this.zebra.features.maxMovingBlocks);

        return true;
    }

    private add(): void {
        this.blocks.push(new ZebraMovingBlock(this.zebra));
        this.count = this.blocks.length;
        this.total++;
    }

    public init(): void {
        this.blocks = [];
        this.count = 0;
        this.total = 0;
    }
}

export class ZebraMovingBlock {
    public readonly area: Area;
    public readonly dir: number;
    public readonly isDirX: boolean;
    public readonly vMin: number;
    public readonly vMax: number;

    private movingDistance: number = 0;
    private color: ColorSpec;

    public constructor(
        public readonly zebra: Zebra,
        area: Area | null = null,
        move: string | null = null,
        movingDistance: number | null = null
    ) {
        this.color = randOptions(Object.values(color.palettes['unique-css']));
        let h: number;
        let w: number;

        if (area === null) {
            h = zebra.features.blockSize;
            w = zebra.features.blockSize;
            let x: number = randInt(zebra.features.gridSize + h / 2) - h;
            let y: number = randInt(zebra.features.gridSize + w / 2) - w;

            area = {
                x: x,
                y: y,
                w: w,
                h: h,
            };

            area.x = (area.x * zebra.width) / zebra.features.gridSize;
            area.y = (area.y * zebra.height) / zebra.features.gridSize;
            area.w = (area.w * zebra.width) / zebra.features.gridSize;
            area.h = (area.h * zebra.height) / zebra.features.gridSize;
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
                this.dir = -this.zebra.features.stepSize;
                break;
            case 'down':
                this.isDirX = false;
                this.dir = this.zebra.features.stepSize;
                break;
            case 'left':
                this.isDirX = true;
                this.dir = -this.zebra.features.stepSize;
                break;
            default:
            case 'right':
                this.isDirX = true;
                this.dir = this.zebra.features.stepSize;
                break;
        }

        if (movingDistance === null) {
            let blocks: number = randOptions(
                this.zebra.features.movingDistances
            );

            if (this.isDirX) {
                movingDistance =
                    (blocks * this.zebra.width) / this.zebra.features.gridSize;
            } else {
                movingDistance =
                    (blocks * this.zebra.height) / this.zebra.features.gridSize;
            }
        }
        this.movingDistance = movingDistance << 0;

        this.vMin = 255 * this.zebra.features.colorValueMin;
        this.vMax = 255 * this.zebra.features.colorValueMax;
    }

    public tick(): boolean {
        if (this.movingDistance <= 0) {
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
        this.zebra.context.fillStyle = `rgba(${this.color.rgb[0]},${this.color.rgb[1]},${this.color.rgb[2]},1)`;
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
