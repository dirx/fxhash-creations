import {
    Area,
    Point,
    randInt,
    randOptions,
    randPoint,
    randBoolean,
    randInit,
} from './rand';
import { createLoop, Loop } from './frame';
import { color } from './color';

export type ZebraFeatures = {
    range: string;
    'range size': string;
    speed: string;
    darkness: string;
};

export class ZebraState {
    public combinations: number = 1;
    public combination: number = 1;
    public readonly colorHue: number;
    public readonly colorHueMinMaxBase: number;
    public readonly colorHueMin: number;
    public readonly colorHueMax: number;
    public readonly colorSaturationMin: number;
    public readonly colorSaturationMax: number;
    public readonly colorHueSpeedBase: number;
    public readonly colorHueSpeed: number;
    public readonly isGray: boolean;
    public readonly isGold: boolean;
    public readonly isRainbow: boolean;
    public maxMovingBlocks: number = 7;
    public readonly allColors: Array<number> = [
        10, 20, 40, 50, 60, 80, 130, 160, 200, 220, 250, 265, 285, 320, 350,
    ];
    public readonly colors: Array<number> = [];
    public readonly colorHueBase: number;
    public readonly isGrayBase: number;
    public readonly blocks: number = 233;
    public readonly blockSizes: Array<number> = [
        1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144,
    ];
    public readonly blockSizeMax: number;
    public readonly blockSizeMin: number;
    public readonly blockSizeBigMin: number;
    public readonly colorValueMin: number;
    public readonly colorValueMax: number;
    public fps: number = 30;
    public pixelRatio: number = 2;

    public constructor() {
        this.isGrayBase = randInt((this.combinations *= 2)) % 2;
        this.isGray = this.isGrayBase === 0;

        this.colorHueBase =
            randInt((this.combinations *= this.allColors.length)) %
            this.allColors.length;

        this.colorHue = this.allColors[this.colorHueBase];

        this.colorHueMinMaxBase = randInt((this.combinations *= 5)) % 5;

        let hueMin = this.colorHueBase - this.colorHueMinMaxBase - 1;
        hueMin = hueMin < 0 ? this.allColors.length + hueMin : hueMin;
        this.colorHueMin = this.allColors[hueMin];

        let hueMax = this.colorHueBase + this.colorHueMinMaxBase + 1;
        hueMax =
            hueMax >= this.allColors.length
                ? hueMax - this.allColors.length
                : hueMax;
        this.colorHueMax = this.allColors[hueMax];

        hueMin = this.colorHueBase - this.colorHueMinMaxBase - 1;
        hueMax = this.colorHueBase + this.colorHueMinMaxBase + 1;
        for (let i = hueMin; i <= hueMax; i++) {
            let p = i;
            p = p < 0 ? this.allColors.length + p : p;
            p = p >= this.allColors.length ? p - this.allColors.length : p;
            this.colors.push(this.allColors[p]);
        }

        this.colorHueSpeedBase = randInt((this.combinations *= 2)) % 2;
        this.colorHueSpeed = (this.colorHueSpeedBase + 1) * 0.5;

        this.isGold =
            !this.isGray &&
            this.colorHueBase === 3 &&
            this.colorHueMinMaxBase === 0;

        this.isRainbow =
            !this.isGray &&
            this.colorHueBase === 7 &&
            this.colorHueMinMaxBase === 4;

        this.colorSaturationMin = this.isGray && !this.isGold ? 0.4 : 0.8;
        this.colorSaturationMax = this.isGray && !this.isGold ? 0.6 : 0.9;

        this.colorSaturationMin =
            this.isGray && this.colorHueMinMaxBase === 0
                ? 0.6
                : this.colorSaturationMin;
        this.colorSaturationMax =
            this.isGray && this.colorHueMinMaxBase === 0
                ? 0.7
                : this.colorSaturationMax;

        this.colorValueMin = this.isGray && !this.isGold ? 0.3 : 1;
        this.colorValueMax = this.isGray && !this.isGold ? 0.8 : 1;

        this.colorValueMin =
            this.isGray && this.colorHueMinMaxBase === 0
                ? 0.1
                : this.colorValueMin;
        this.colorValueMax =
            this.isGray && this.colorHueMinMaxBase === 0
                ? 0.5
                : this.colorValueMax;

        if (this.isGold) {
            this.colorSaturationMin = 0.9;
            this.colorSaturationMax = 1;
            this.colorValueMin = 1;
            this.maxMovingBlocks = 5;
        }

        if (this.isRainbow) {
            this.colorHue = 180;
            this.colorHueMin = 0;
            this.colorHueMax = 360;
            this.colors = Array.from(Array(36).keys()).map((i) => i * 10);
            this.colorHueMinMaxBase += 1;
        }

        this.blockSizeMin = this.blockSizes[0];
        this.blockSizeBigMin =
            this.blockSizes[(this.blockSizes.length * 0.666) << 0];
        this.blockSizeMax = this.blockSizes[this.blockSizes.length - 1];

        this.combination =
            (this.isGrayBase * this.combinations) / 2 +
            (this.colorHueBase * this.combinations) /
                2 /
                this.allColors.length +
            (this.colorHueMinMaxBase * this.combinations) /
                2 /
                this.allColors.length /
                5 +
            (this.colorHueSpeedBase * this.combinations) /
                2 /
                this.allColors.length /
                5 /
                2;
    }

    public getFeatures(): ZebraFeatures {
        return {
            range: this.getColorRange(),
            'range size': this.getColorRangeSize(),
            speed: this.getColorHueSpeed(),
            darkness: this.getDarkness(),
        };
    }

    public getDarkness(): string {
        if (this.isGray) {
            return this.colorHueMinMaxBase === 0 ? 'high' : 'low';
        }

        return 'none';
    }

    public getFeatureName(): string {
        return [
            this.getColorRange(),
            this.getColorRangeSize(),
            this.getColorHueSpeed(),
            this.getDarkness(),
            this.combination,
            window.fxhash,
        ]
            .join('-')
            .replace(/\s+/g, '');
    }

    public getColorRange(): string {
        if (this.isGold) {
            return 'golden';
        }
        if (this.isRainbow) {
            return 'rainbow';
        }
        return `${this.getColorName(this.colorHueMin)} - ${this.getColorName(
            this.colorHueMax
        )}`;
    }

    public getColorRangeSize(): string {
        return ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'][
            this.colorHueMinMaxBase
        ];
    }

    public getColorHueSpeed(): string {
        return this.colorHueSpeedBase === 0 ? 'slow' : 'fast';
    }

    public getColor(): string {
        return this.getColorName(this.colorHue);
    }

    public getColorName(hue: number): string {
        switch (true) {
            case hue < 10:
                return 'red';
            case hue < 20:
                return 'red-orange';
            case hue < 40:
                return 'orange';
            case hue < 50:
                return 'orange-yellow';
            case hue < 60:
                return 'yellow';
            case hue < 80:
                return 'yellow-green';
            case hue < 130:
                return 'green';
            case hue < 160:
                return 'green-cyan';
            case hue < 200:
                return 'cyan';
            case hue < 220:
                return 'cyan-blue';
            case hue < 250:
                return 'blue';
            case hue < 265:
                return 'blue-purple';
            case hue < 285:
                return 'purple';
            case hue < 320:
                return 'pink';
            case hue < 350:
                return 'pink-red';
            default:
            case hue <= 360:
                return 'red';
        }
    }
}

export class AddingMovingBlock {
    public ts!: number;
    public in!: number;

    public constructor() {
        this.setIn(0);
    }

    public setIn(value: number) {
        this.ts = Date.now();
        this.in = value;
    }

    public ms(currentFps: number): number {
        return this.nextMs(currentFps) - Date.now();
    }

    public nextMs(currentFps: number): number {
        return this.ts + this.in / currentFps;
    }

    public next(currentFps: number): boolean {
        return Date.now() < this.nextMs(currentFps);
    }
}

export class Zebra {
    public state!: ZebraState;

    public width: number = 0;
    public height: number = 0;

    public canvas: HTMLCanvasElement;
    public context: CanvasRenderingContext2D;

    public addingMovingBlockIn!: AddingMovingBlock;
    public movingBlocks: number = 0;
    public movingBlocksTotal: number = 0;
    public move: Array<'left' | 'up' | 'down' | 'right'> = [
        'left',
        'up',
        'right',
        'down',
    ];

    public isBig!: boolean;

    public vDir: number = 0;
    public sDir: number = 0;

    public hGlitch: number = 0;

    public inPreviewPhase!: boolean;
    public previewPhaseEndsAfter!: number;

    public fxhash: string;

    public constructor(
        canvas: HTMLCanvasElement,
        width: number,
        height: number,
        fxhash: string
    ) {
        this.canvas = canvas;
        this.context = canvas.getContext('2d') as CanvasRenderingContext2D;
        this.fxhash = fxhash;

        this.updateSize(width, height);
        this.setSmoothing(false);
    }

    private initState() {
        randInit(this.fxhash);
        this.state = new ZebraState();
    }

    private init() {
        this.addingMovingBlockIn = new AddingMovingBlock();
        this.movingBlocksTotal = 0;
        this.inPreviewPhase = true;
        this.previewPhaseEndsAfter = this.state.maxMovingBlocks * 3;

        this.isBig = true;
        this.sDir = 0;
        this.vDir = this.state.isGray ? 1 : 0;
    }

    public updateSize(
        width: number,
        height: number,
        pixelRatio: number | null = null
    ) {
        this.initState();
        if (pixelRatio === null) {
            this.state.pixelRatio = Math.ceil((width + height) / 2 / 640);
        } else {
            this.state.pixelRatio = pixelRatio;
        }
        this.context.scale(this.state.pixelRatio, this.state.pixelRatio);
        this.width = (width / this.state.pixelRatio) << 0;
        this.height = (height / this.state.pixelRatio) << 0;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.canvas.dispatchEvent(new Event('zebra.updateSize'));
        this.init();
        this.initImage();
    }

    public increaseFps() {
        this.state.fps++;
        this.canvas.dispatchEvent(new Event('zebra.updateFps'));
    }

    public decreaseFps() {
        if (this.state.fps > 1) {
            this.state.fps--;
            this.canvas.dispatchEvent(new Event('zebra.updateFps'));
        }
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
            this.state.colorHue,
            this.state.colorSaturationMin,
            this.state.colorValueMin
        );
        this.context.fillRect(0, 0, this.width, this.height);

        new ZebraMovingBlock(
            this,
            {
                x: 0,
                y: 0,
                w: this.width,
                h: this.height,
            },
            'up',
            this.height / 10
        );
    }

    public tick() {
        this.hGlitch =
            !this.state.isGold && !this.state.isRainbow
                ? (this.state.colorHueMinMaxBase + 1) *
                  5 *
                  (Math.sin(this.movingBlocksTotal * 0.05) * 0.5 + 0.5)
                : 0;

        if (this.movingBlocks >= this.state.maxMovingBlocks) {
            return;
        }

        if (this.addingMovingBlockIn.next(this.state.fps)) {
            return;
        }

        new ZebraMovingBlock(this);
        this.movingBlocksTotal++;

        if (
            this.inPreviewPhase &&
            this.movingBlocksTotal > this.previewPhaseEndsAfter
        ) {
            this.inPreviewPhase = false;
        }

        if (this.movingBlocks === this.state.maxMovingBlocks) {
            this.move = randOptions([
                ['left', 'up'],
                ['left', 'down'],
                ['right', 'up'],
                ['right', 'down'],
            ]);
            this.isBig =
                this.movingBlocksTotal <= this.state.maxMovingBlocks ||
                randInt(3) === 0;

            if (!this.isBig) {
                this.sDir = randOptions([
                    -1 / 255,
                    -1 / 255,
                    0,
                    0,
                    0,
                    1 / 255,
                    1 / 255,
                ]);
                this.vDir = this.state.isGray ? 1 : 0;
            } else {
                this.sDir = randOptions([-1 / 255, 0, 0]);
            }

            this.addingMovingBlockIn.setIn(
                randInt(
                    this.state.maxMovingBlocks * 50 * (this.width + this.height)
                )
            );
        } else {
            this.addingMovingBlockIn.setIn(
                (this.width + this.height) * this.state.maxMovingBlocks
            );
        }
    }

    public printImage(name: string) {
        let resizedCanvas = document.createElement('canvas');
        let resizedContext = resizedCanvas.getContext('2d');
        if (resizedContext === null) {
            return;
        }

        resizedCanvas.height = this.height * this.state.pixelRatio;
        resizedCanvas.width = this.width * this.state.pixelRatio;

        resizedContext.imageSmoothingEnabled =
            this.context.imageSmoothingEnabled;
        resizedContext?.drawImage(
            this.canvas,
            0,
            0,
            resizedCanvas.width,
            resizedCanvas.height
        );

        let link = document.createElement('a');
        link.download = name + '.png';
        link.href = resizedCanvas.toDataURL();
        link.click();
    }
}

export class ZebraMovingBlock {
    public readonly area: Area;
    public readonly isBig: boolean;
    public readonly dir!: number;
    public readonly isDirX!: boolean;
    public readonly hDir: number;
    public readonly hMin: number;
    public readonly hMax: number;
    public readonly vDir: boolean;
    public readonly vMin: number;
    public readonly vMax: number;
    public readonly sMin: number;
    public readonly sDir: boolean;

    private loop: Loop | null = null;
    private movingDistance: number = 0;

    private updateSizeHandler: EventListenerOrEventListenerObject;
    private updateFpsHandler: EventListenerOrEventListenerObject;

    public constructor(
        public readonly zebra: Zebra,
        area: Area | null = null,
        move: string | null = null,
        movingDistance: number | null = null
    ) {
        this.isBig = zebra.isBig;
        let wh: number;

        if (area === null) {
            if (this.isBig) {
                wh = randOptions(
                    zebra.state.blockSizes.slice(
                        (zebra.state.blockSizes.length * -0.3) << 0
                    )
                );
            } else {
                wh = randOptions(
                    zebra.state.blockSizes.slice(
                        0,
                        (zebra.state.blockSizes.length * 0.8) << 0
                    )
                );
            }

            let xy: Point = randPoint(
                zebra.state.blocks + 1 - wh,
                zebra.state.blocks + 1 - wh
            );

            area = {
                x: xy.x,
                y: xy.y,
                w: wh,
                h: wh,
            };

            // force use of corners
            if (area.x <= zebra.state.blocks * 0.2) {
                area.x = 0;
            }

            if (area.y <= zebra.state.blocks * 0.2) {
                area.y = 0;
            }

            if (area.x + area.w >= zebra.state.blocks * 0.8) {
                area.w = zebra.state.blocks - area.x;
            }

            if (area.y + area.h >= zebra.state.blocks * 0.8) {
                area.h = zebra.state.blocks - area.y;
            }

            area.x = (area.x * zebra.width) / zebra.state.blocks;
            area.y = (area.y * zebra.height) / zebra.state.blocks;
            area.w = ((area.w + 1) * zebra.width) / zebra.state.blocks;
            area.h = ((area.h + 1) * zebra.height) / zebra.state.blocks;
        }

        area.x = area.x << 0;
        area.y = area.y << 0;
        area.w = area.w << 0;
        area.h = area.h << 0;

        this.area = area;

        if (move === null) {
            move = randOptions(zebra.move);
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
            case 'right':
                this.isDirX = true;
                this.dir = 1;
                break;
        }

        let blocks: number;
        if (this.isBig) {
            blocks =
                randInt(
                    zebra.state.blockSizeMax - zebra.state.blockSizeBigMin
                ) + zebra.state.blockSizeBigMin;
        } else {
            blocks =
                randInt(zebra.state.blockSizeMax - zebra.state.blockSizeMin) +
                zebra.state.blockSizeMin;
        }

        if (movingDistance === null) {
            if (this.isDirX) {
                movingDistance =
                    (blocks * this.zebra.width) / this.zebra.state.blocks;
            } else {
                movingDistance =
                    (blocks * this.zebra.height) / this.zebra.state.blocks;
            }
        }
        this.movingDistance = movingDistance << 0;

        let big =
            area.w > this.zebra.width / 2 || area.h > this.zebra.height / 2;

        this.hDir = zebra.state.colorHueSpeed;
        this.vDir = zebra.state.isGray;
        this.sDir = big ? false : randBoolean();

        this.vMin = 255 * this.zebra.state.colorValueMin;
        this.vMax = 255 * this.zebra.state.colorValueMax;

        this.sMin = this.zebra.state.colorSaturationMin;

        this.hMin = this.zebra.state.colorHueMin;
        this.hMax = this.zebra.state.colorHueMax;

        this.updateSizeHandler = () => {
            this.onUpdateSize();
        };
        this.zebra.canvas.addEventListener(
            'zebra.updateSize',
            this.updateSizeHandler
        );
        this.updateFpsHandler = () => {
            this.onUpdateFps;
        };
        this.zebra.canvas.addEventListener('zebra.updateFps', this.onUpdateFps);
        this.start();
    }

    private onUpdateSize() {
        this.loop?.stop();
    }

    private onUpdateFps() {
        this.loop?.runWith(this.zebra.state.fps);
    }

    private start() {
        this.zebra.movingBlocks++;

        this.movingDistance = this.movingDistance * this.dir;
        this.loop = createLoop(
            (currentFps: number, targetFps: number, intervalId: number) =>
                this.onLoop(currentFps, targetFps, intervalId),
            () => this.onLoopStop()
        );
        this.loop.runWith(this.zebra.state.fps);
    }

    private onLoop(
        _currentFps: number,
        _targetFps: number,
        _intervalId: number
    ) {
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
                sw += 0;
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
                sh += 0;
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

    private onLoopStop() {
        this.zebra.canvas.removeEventListener(
            'zebra.updateSize',
            this.updateSizeHandler
        );
        this.zebra.canvas.removeEventListener(
            'zebra.updateFps',
            this.updateFpsHandler
        );
        this.zebra.movingBlocks--;
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
    }

    private shiftColor(data: ImageData) {
        let l: number = data.data.length;

        let hMin = this.hMin - this.zebra.hGlitch;
        hMin = hMin < 0 ? hMin + 360 : hMin;
        let hMax = this.hMax + this.zebra.hGlitch;
        hMax = hMax > 360 ? hMax - 360 : hMax;

        for (let i: number = 0; i < l; i += 4) {
            let r = data.data[i];
            let g = data.data[i + 1];
            let b = data.data[i + 2];

            [r, g, b] = color.rotate(
                r,
                g,
                b,
                this.hDir,
                hMin,
                hMax,
                this.zebra.vDir,
                this.vMin,
                this.vMax,
                this.zebra.state.isGray,
                this.sDir ? this.zebra.sDir : 0,
                this.sMin,
                this.zebra.state.colorSaturationMax,
                false,
                this.zebra.state.isGray ? null : this.zebra.state.colorHue,
                this.zebra.state.colorHueMinMaxBase * 5 + 10
            );

            data.data[i] = r;
            data.data[i + 1] = g;
            data.data[i + 2] = b;
        }
        return data;
    }
}
