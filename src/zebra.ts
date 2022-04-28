import {
    Area,
    Point,
    randInt,
    randElement,
    randPoint,
    randBoolean,
} from './rand';
import { createLoop, Loop } from './frame';
import { color } from './color';

export type ZebraFeatures = {
    'Color Range': string;
    'Color Range Size': string;
    'Color Hue Speed': string;
    Grayish: string;
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
    public maxMovingParts: number = 7;
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
    public padding: number = 0;

    public constructor() {
        // special combinations: gold 180&181/ 300, rainbow 228&229 / 300
        this.isGrayBase = randInt((this.combinations *= 2), true) % 2;
        this.isGray = this.isGrayBase === 0;

        this.colorHueBase =
            randInt((this.combinations *= this.allColors.length), true) %
            this.allColors.length;

        this.colorHue = this.allColors[this.colorHueBase];

        this.colorHueMinMaxBase = randInt((this.combinations *= 5), true) % 5;

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

        this.colorHueSpeedBase = randInt((this.combinations *= 2), true) % 2;
        this.colorHueSpeed =
            (this.isGray ? 1 : 0.5) *
            (this.colorHueSpeedBase === 0 ? 1 : this.colorHueMinMaxBase + 2);

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

        this.colorValueMin = this.isGray && !this.isGold ? 0.3 : 1;
        this.colorValueMax = this.isGray && !this.isGold ? 0.8 : 1;

        if (this.isGold) {
            this.colorSaturationMin = 0.9;
            this.colorSaturationMax = 1;
            this.colorValueMin = 1;
            this.maxMovingParts = 5;
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
            'Color Range': this.getColorRange(),
            'Color Range Size': this.getColorRangeSize(),
            'Color Hue Speed': this.getColorHueSpeed(),
            Grayish: this.isGray ? 'yes' : 'no',
        };
    }

    public getFeatureName(): string {
        return [
            this.getColorRange(),
            this.isGray ? 'gray' : 'normal',
            this.combination,
            window.fxrand(),
        ].join('-');
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

export class AddingMovingPart {
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
    public readonly state: ZebraState;

    public width: number = 0;
    public height: number = 0;

    public canvas: HTMLCanvasElement;
    public context: CanvasRenderingContext2D;

    public movingParts: number = 0;
    public movingPartsTotal: number = 0;
    public addingMovingPartsIn!: AddingMovingPart;
    public move: Array<'left' | 'up' | 'down' | 'right'> = [
        'left',
        'up',
        'right',
        'down',
    ];

    public dir!: number;
    public isDirX!: boolean;
    public isBig!: boolean;

    public vDir: number = 0;
    public sDir: number = 0;

    public hGlitch: number = 0;

    public inPreviewPhase!: boolean;
    public previewPhaseEndsAfter!: number;

    public constructor(
        canvas: HTMLCanvasElement,
        width: number,
        height: number
    ) {
        this.state = new ZebraState();
        this.canvas = canvas;
        this.context = canvas.getContext('2d') as CanvasRenderingContext2D;

        this.updateSize(width, height);
        this.setSmoothing(false);
    }

    private init() {
        this.addingMovingPartsIn = new AddingMovingPart();
        this.movingPartsTotal = 0;
        this.inPreviewPhase = true;
        this.previewPhaseEndsAfter = this.state.maxMovingParts * 4;

        this.dir = randInt(2) === 0 ? 1 : -1;
        this.isDirX = randInt(2) === 0;
        this.isBig = true;
        this.sDir = 0;
        this.vDir = this.state.isGray ? 1 : 0;
    }

    public updateSize(
        width: number,
        height: number,
        pixelRatio: number | null = null
    ) {
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
        this.state.padding = 0;
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
        let gradient = this.context.createLinearGradient(0, 0, this.width, 0);
        let times = 1;
        let vRange = this.state.isRainbow
            ? 0
            : this.state.colorValueMax - this.state.colorValueMin;
        let oTotal = times * this.state.colors.length;

        for (let o = 0; o <= oTotal; o++) {
            let c = o % this.state.colors.length;
            let v = ((o + times * 1.5) % (times * 2)) / (times * 2);
            let s = o / times / this.state.colors.length;
            if (c === 0 || v === 0) {
                gradient.addColorStop(
                    s,
                    color.hsvCss(
                        this.state.colors[
                            c === 0 ? this.state.colors.length - 1 : c
                        ],
                        this.state.colorSaturationMin,
                        this.state.colorValueMin + vRange * (v === 0 ? 1 : v)
                    )
                );
            }
            gradient.addColorStop(
                s,
                color.hsvCss(
                    this.state.colors[c],
                    this.state.colorSaturationMin,
                    this.state.colorValueMin + v * vRange
                )
            );
        }

        this.context.fillStyle = gradient;
        this.context.fillRect(0, 0, this.width, this.height);
    }

    public tick() {
        this.hGlitch =
            !this.state.isGold && !this.state.isRainbow
                ? (this.state.colorHueMinMaxBase + 1) *
                  5 *
                  (Math.sin(Date.now() * 0.0005) * 0.5 + 0.5)
                : 0;

        if (this.movingParts >= this.state.maxMovingParts) {
            return;
        }

        if (this.addingMovingPartsIn.next(this.state.fps)) {
            return;
        }

        new ZebraMovingBlock(this);
        this.movingPartsTotal++;

        if (
            this.inPreviewPhase &&
            this.movingPartsTotal > this.previewPhaseEndsAfter
        ) {
            this.inPreviewPhase = false;
        }

        if (this.movingParts === this.state.maxMovingParts) {
            this.move = randElement([
                ['left', 'up'],
                ['left', 'down'],
                ['right', 'up'],
                ['right', 'down'],
            ]);
            this.dir = randInt(2) === 0 ? 1 : -1;
            this.isDirX = randInt(2) === 0;
            this.isBig =
                this.movingPartsTotal <= this.previewPhaseEndsAfter / 2 ||
                randInt(3) === 0;

            if (!this.isBig) {
                this.sDir = randElement([-1 / 255, -1 / 255, 0, 0, 0, 1 / 255]);
                this.vDir = this.state.isGray ? 1 : 0;
            } else {
                this.sDir = randElement([-1 / 255, 0, 0]);
            }

            this.addingMovingPartsIn.setIn(
                this.inPreviewPhase
                    ? 0
                    : randInt(
                          this.state.maxMovingParts *
                              25 *
                              (this.width + this.height)
                      )
            );
        } else {
            this.addingMovingPartsIn.setIn((this.width + this.height) / 2);
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
    public readonly s: Area;
    public readonly isBig: boolean;
    public readonly dir: number;
    public readonly isDirX: boolean;
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

    public constructor(public readonly zebra: Zebra) {
        this.isBig = zebra.isBig;
        let s: Area;
        let wh: number;

        if (this.isBig) {
            wh = randElement(
                zebra.state.blockSizes.slice(
                    (zebra.state.blockSizes.length * -0.333) << 0
                )
            );
        } else {
            wh = randElement(zebra.state.blockSizes);
        }

        let xy: Point = randPoint(
            zebra.state.blocks + 1 - wh,
            zebra.state.blocks + 1 - wh
        );

        s = {
            x: xy.x,
            y: xy.y,
            w: wh,
            h: wh,
        };

        // force use of corners
        if (s.x <= zebra.state.blocks * 0.2) {
            s.x = 0;
        }

        if (s.y <= zebra.state.blocks * 0.2) {
            s.y = 0;
        }

        if (s.x + s.w >= zebra.state.blocks * 0.8) {
            s.w = zebra.state.blocks - s.x;
        }

        if (s.y + s.h >= zebra.state.blocks * 0.8) {
            s.h = zebra.state.blocks - s.y;
        }

        s.x =
            (s.x * (zebra.width - zebra.state.padding * 2)) /
                zebra.state.blocks +
            zebra.state.padding;
        s.y =
            (s.y * (zebra.height - zebra.state.padding * 2)) /
                zebra.state.blocks +
            zebra.state.padding;
        s.w =
            ((s.w + 1) * (zebra.width - zebra.state.padding * 2)) /
            zebra.state.blocks;
        s.h =
            ((s.h + 1) * (zebra.height - zebra.state.padding * 2)) /
            zebra.state.blocks;

        s.x = s.x << 0;
        s.y = s.y << 0;
        s.w = s.w << 0;
        s.h = s.h << 0;

        this.dir = this.zebra.dir;
        this.isDirX = this.zebra.isDirX;

        this.s = s;

        let m: number;

        if (this.isBig) {
            m =
                randInt(
                    zebra.state.blockSizeMax - zebra.state.blockSizeBigMin
                ) + zebra.state.blockSizeBigMin;
        } else {
            m =
                randInt(zebra.state.blockSizeMax - zebra.state.blockSizeMin) +
                zebra.state.blockSizeMin;
        }

        let move: string = randElement(zebra.move);

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
        if (this.isDirX) {
            this.movingDistance =
                ((m * (this.zebra.width - this.zebra.state.padding * 2)) /
                    this.zebra.state.blocks) <<
                0;
        } else {
            this.movingDistance =
                ((m * (this.zebra.height - this.zebra.state.padding * 2)) /
                    this.zebra.state.blocks) <<
                0;
        }

        let big = s.w > this.zebra.width / 2 || s.h > this.zebra.height / 2;

        this.hDir = zebra.state.colorHueSpeed;
        // zebra.state.isGray && !zebra.state.isGold
        //     ? this.zebra.state.colorHueSpeedBase + 1
        //     : this.zebra.state.colorHueSpeedBase *
        //           this.zebra.state.colorHueMinMaxBase +
        //       1;
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
        this.zebra.movingParts++;

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
        let sw: number = this.s.w;
        let sh: number = this.s.h;
        let tx: number;
        let ty: number;
        let padding: number = this.zebra.state.padding;

        if (this.isDirX) {
            let maxWidth =
                this.zebra.width - padding - (this.dir > 0 ? this.dir : 0);
            sx = this.s.x + this.movingDistance;
            sy = this.s.y;

            if (sx < padding) {
                sx = padding;
                sw += padding;
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
            let maxHeight =
                this.zebra.height - padding - (this.dir > 0 ? this.dir : 0);
            sx = this.s.x;
            sy = this.s.y + this.movingDistance;

            if (sy < padding) {
                sy = padding;
                sh += padding;
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

        this.movePart(sx, sy, sw, sh, tx, ty);
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
        this.zebra.movingParts--;
    }

    private movePart(
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
