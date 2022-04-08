import {
    Area,
    Point,
    randInt,
    randElement,
    randPoint,
    randBoolean,
    rand,
} from './rand';
import { createLoop, Loop } from './frame';
import { color } from './color';

export type ZebraFeatures = {
    Colors: string;
    'Color Range Size': string;
    Saturation: string;
    Grayish: string;
};

export class ZebraConfig {
    public combinationsTotal: number = 1;
    public combination: number = 1;
    public readonly colorHue: number;
    public readonly colorHueMinMaxBase: number;
    public readonly colorHueMin: number;
    public readonly colorHueMax: number;
    public readonly colorSaturationMin: number;
    public readonly colorSaturationMax: number;
    public readonly isGray: boolean;
    public readonly isGold: boolean;
    public readonly isRainbow: boolean;
    public readonly blocks: number;
    public maxMovingParts: number = 7;
    public readonly allColors: Array<number> = [
        10, 20, 40, 50, 60, 80, 130, 160, 200, 220, 250, 265, 285, 320, 350,
    ];
    public readonly colors: Array<number> = [];
    public readonly colorHueBase: number;
    public readonly colorSaturationBase: number;
    public readonly isGrayBase: number;
    public readonly blocksBase: number;
    public readonly blockSizes: Array<number>;
    public readonly blockSizeMax: number;
    public readonly blockSizeMin: number;
    public readonly blockSizeBigMin: number;
    public readonly colorValueMinBase: number;
    public readonly colorValueMin: number;
    public readonly colorValueMax: number;
    public fps: number = 25;
    public pixelRatio: number = 2;
    public padding: number = 0;

    public constructor() {
        this.isGrayBase = randInt((this.combinationsTotal *= 2), true) % 2;
        this.isGray = this.isGrayBase === 0;

        // this.isGray = true; // test gold
        // this.isGray = false; // test rainbow

        this.colorHueBase =
            randInt((this.combinationsTotal *= this.allColors.length), true) %
            this.allColors.length;

        // this.colorHueBase = 3; // test gold
        // this.colorHueBase = 7; // test rainbow

        this.colorHue = this.allColors[this.colorHueBase];

        this.colorHueMinMaxBase =
            randInt((this.combinationsTotal *= 6), true) % 6;

        // this.colorHueMinMaxBase = 0; // test gold
        // this.colorHueMinMaxBase = 5; // test rainbow

        let hueMin = this.colorHueBase - this.colorHueMinMaxBase - 1;
        hueMin = hueMin < 0 ? this.allColors.length + hueMin : hueMin;
        this.colorHueMin = this.allColors[hueMin];

        let hueMax = this.colorHueBase + this.colorHueMinMaxBase + 1;
        hueMax =
            hueMax >= this.allColors.length
                ? hueMax - this.allColors.length
                : hueMax;
        this.colorHueMax = this.allColors[hueMax];

        // set colors
        hueMin = this.colorHueBase - this.colorHueMinMaxBase - 1;
        hueMax = this.colorHueBase + this.colorHueMinMaxBase + 1;
        for (let i = hueMin; i <= hueMax; i++) {
            let p = i;
            p = p < 0 ? this.allColors.length + p : p;
            p = p >= this.allColors.length ? p - this.allColors.length : p;
            this.colors.push(this.allColors[p]);
        }
        console.log(this.allColors);
        console.log(this.colors);

        this.isGold =
            this.isGray &&
            this.colorHueBase === 3 &&
            this.colorHueMinMaxBase === 0;

        this.isRainbow =
            !this.isGray &&
            this.colorHueBase === 7 &&
            this.colorHueMinMaxBase === 5;

        this.colorSaturationBase =
            randInt((this.combinationsTotal *= 2), true) % 2;

        console.log(
            rand(true) * this.combinationsTotal,
            this.colorSaturationBase,
            this.combinationsTotal
        );

        this.colorSaturationMin =
            this.isGray && !this.isGold
                ? (this.colorSaturationBase * 20 + 10) / 100
                : (this.colorSaturationBase * 50 + 30) / 100;
        this.colorSaturationMax =
            this.isGray && !this.isGold
                ? (this.colorSaturationBase * 30 + 20) / 100
                : (this.colorSaturationBase * 50 + 40) / 100;

        this.colorValueMinBase = 0;
        this.colorValueMin = this.isGray && !this.isGold ? 0.3 : 0.6;
        this.colorValueMax = this.isGray && !this.isGold ? 0.8 : 0.9;

        if (this.isGold) {
            this.colorSaturationMax += 0.1;
            this.colorValueMin += 0.1;
            this.maxMovingParts = 5;
        }

        if (this.isRainbow) {
            this.colorHue = 180;
            this.colorHueMin = 0;
            this.colorHueMax = 360;
            this.colors = Array.from(Array(36).keys()).map((i) => i * 10);
            this.colorHueMinMaxBase += 1;
        }

        console.log('colorSaturationMin', this.colorSaturationMin);
        console.log('colorSaturationMax', this.colorSaturationMax);
        console.log('colorValueMin', this.colorValueMin);
        console.log('colorValueMax', this.colorValueMax);

        // this.blocksBase = randInt((this.combinationsTotal *= 2), true) % 2;
        this.blocksBase = 1;
        this.blocks = [8, /*55,*/ 377][this.blocksBase];
        // this.blocks = 3 ** (this.blocksBase + 2);
        // this.blockSizeMax = (this.blocks - 1) << 0;
        // this.blockSizeMin = (this.blocks / 3) << 0;
        this.blockSizes = [
            [1, 2, 3, 5],
            // [1, 2, 5, 13, 34, 55],
            // [1, 2, 3, 5, 8, 13, 21, 34],
            // [1, 2, 5, 13, 34, 89, 233],
            [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233],
            // [1, 2, 3],
            // [5, 8, 13, 21],
            // [21, 34, 55, 89, 144],
        ][this.blocksBase];

        this.blockSizeMin = this.blockSizes[0];
        this.blockSizeBigMin =
            this.blockSizes[(this.blockSizes.length * 0.666) << 0];
        this.blockSizeMax = this.blockSizes[this.blockSizes.length - 1];

        console.log(
            'combination',
            this.isGrayBase + 1,
            this.colorHueBase + 1,
            this.colorHueMinMaxBase + 1,
            this.colorSaturationBase + 1
        );

        this.combination =
            (this.isGrayBase * this.combinationsTotal) / 2 +
            (this.colorHueBase * this.combinationsTotal) /
                2 /
                this.allColors.length +
            (this.colorHueMinMaxBase * this.combinationsTotal) /
                2 /
                this.allColors.length /
                6 +
            (this.colorSaturationBase * this.combinationsTotal) /
                2 /
                this.allColors.length /
                6 /
                2;
    }

    public getFeatures(): ZebraFeatures {
        return {
            Colors: this.getColorRange(),
            'Color Range Size': this.getColorRangeSize(),
            Saturation: this.getColorSaturation(),
            Grayish: this.isGray ? 'oh yes' : 'nope',
        };
    }

    public getFeatureName(): string {
        return [
            this.getColorRange(),
            this.getColorSaturation(),
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
        return ['xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl'][
            this.colorHueMinMaxBase
        ];
    }

    public getColorSaturation(): string {
        return ['low', 'high'][this.colorSaturationBase];
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

export class Zebra {
    public readonly config: ZebraConfig;

    public width: number = 0;
    public height: number = 0;

    public canvas: HTMLCanvasElement;
    public context: CanvasRenderingContext2D;

    public movingParts: number = 0;
    public movingPartsTotal: number = 0;
    public addingMovingPartsInMs!: number;
    public move: Array<'left' | 'up' | 'down' | 'right'> = [
        'left',
        'up',
        'right',
        'down',
    ];

    public mouseDown: boolean = false;
    public mouseX: number = 0;
    public mouseY: number = 0;

    public dir!: number;
    public isDirX!: boolean;
    public isBig!: boolean;

    public vDir: number = 0;
    public sDir: number = 0;

    public inPreviewPhase!: boolean;
    public previewPhaseEndsAfter!: number;

    public constructor(
        canvas: HTMLCanvasElement,
        width: number,
        height: number
    ) {
        this.config = new ZebraConfig();
        this.canvas = canvas;
        this.context = canvas.getContext('2d') as CanvasRenderingContext2D;

        this.updateSize(width, height);
        this.setSmoothing(false);

        this.initMouseHandler();
    }

    private init() {
        this.addingMovingPartsInMs = Date.now();
        this.movingPartsTotal = 0;
        this.inPreviewPhase = true;
        this.previewPhaseEndsAfter = this.config.maxMovingParts * 4;

        this.dir = randInt(2) === 0 ? 1 : -1;
        this.isDirX = randInt(2) === 0;
        this.isBig = true;
        this.sDir = 0;
        this.vDir = this.config.isGray ? 1 : 0;
    }

    private initMouseHandler() {
        let mouseMoveHandler = (ev: MouseEvent) => {
            this.mouseX = ev.x;
            this.mouseY = ev.y;
        };
        this.mouseDown = false;
        this.canvas.addEventListener('mousedown', (_ev: MouseEvent) => {
            this.mouseDown = true;
            this.canvas.addEventListener('mousemove', mouseMoveHandler);
        });
        this.canvas.addEventListener('mouseup', (_ev: MouseEvent) => {
            this.mouseDown = false;
            this.canvas.removeEventListener('mousemove', mouseMoveHandler);
        });
    }

    public updateSize(
        width: number,
        height: number,
        pixelRatio: number | null = null
    ) {
        if (pixelRatio === null) {
            this.config.pixelRatio =
                2 + (((Math.max(width, height) + 800) / 1600) << 0);
        } else {
            this.config.pixelRatio = pixelRatio;
        }
        this.context.scale(this.config.pixelRatio, this.config.pixelRatio);
        this.width = (width / this.config.pixelRatio) << 0;
        this.height = (height / this.config.pixelRatio) << 0;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.config.padding = 0;
        this.canvas.dispatchEvent(new Event('zebra.updateSize'));
        this.init();
        this.initImage();
    }

    public increaseFps() {
        this.config.fps++;
        this.canvas.dispatchEvent(new Event('zebra.updateFps'));
    }

    public decreaseFps() {
        if (this.config.fps > 1) {
            this.config.fps--;
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
        let times = 4;
        let vRange = this.config.isRainbow
            ? 0
            : this.config.colorValueMax - this.config.colorValueMin;

        let colorStops = [];
        let oTotal = times * this.config.colors.length;
        for (let o = 0; o <= oTotal; o++) {
            let c = o % this.config.colors.length;
            let v = ((o + times * 1.5) % (times * 2)) / (times * 2);
            let s = o / times / this.config.colors.length;
            // let s = (((this.width * o) / oTotal) << 0) / this.width;
            if (c === 0 || v === 0) {
                colorStops.push({
                    width: ((this.width * o) / oTotal) << 0,
                    color: color.hsvCss(
                        this.config.colors[
                            c === 0 ? this.config.colors.length - 1 : c
                        ],
                        this.config.colorSaturationMin,
                        this.config.colorValueMin + vRange * (v === 0 ? 1 : v)
                    ),
                });
                gradient.addColorStop(
                    s,
                    color.hsvCss(
                        this.config.colors[
                            c === 0 ? this.config.colors.length - 1 : c
                        ],
                        this.config.colorSaturationMin,
                        this.config.colorValueMin + vRange * (v === 0 ? 1 : v)
                    )
                );
            }
            colorStops.push({
                width: ((this.width * o) / oTotal) << 0,
                color: color.hsvCss(
                    this.config.colors[c],
                    this.config.colorSaturationMin,
                    this.config.colorValueMin + v * vRange
                ),
            });
            gradient.addColorStop(
                s,
                color.hsvCss(
                    this.config.colors[c],
                    this.config.colorSaturationMin,
                    this.config.colorValueMin + v * vRange
                )
            );
        }

        console.log(this.width, colorStops);

        this.context.fillStyle = gradient;
        this.context.fillRect(0, 0, this.width, this.height);
    }

    public loop() {
        // return;
        if (this.movingParts >= this.config.maxMovingParts) {
            return;
        }
        if (this.addingMovingPartsInMs > Date.now()) {
            return;
        }

        new ZebraMovingBlock(this);
        this.movingPartsTotal++;

        if (
            this.inPreviewPhase &&
            this.movingPartsTotal > this.previewPhaseEndsAfter
        ) {
            console.log('init done');
            this.inPreviewPhase = false;
        }

        if (this.movingParts === this.config.maxMovingParts) {
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

            if (
                /*this.movingParts < this.config.maxMovingParts / 3 &&*/ !this
                    .isBig
            ) {
                this.sDir = this.config.isGray
                    ? randElement([
                          -1 / 255,
                          -1 / 255,
                          0,
                          0,
                          0,
                          1 / 255,
                          1 / 255,
                      ])
                    : randElement([-1 / 255, -1 / 255, 0, 0, 0, 1 / 255]);
                this.vDir = this.config.isGray
                    ? 1
                    : randElement([-1, -1, 0, 0, 0, 1, 1]);

                if (!this.config.isGray) {
                    if (this.vDir === -1) {
                        console.warn('v down');
                    } else if (this.vDir === 1) {
                        console.warn('v up');
                    } else {
                        console.log('v none');
                    }
                }

                // if (this.config.isGray) {
                if (this.sDir < 0) {
                    console.warn('s down');
                } else if (this.sDir > 0) {
                    console.warn('s up');
                } else {
                    console.log('s none');
                }
                // }
            }

            this.addingMovingPartsInMs =
                Date.now() +
                (this.inPreviewPhase
                    ? 0
                    : randInt(
                          (this.config.maxMovingParts *
                              (this.width + this.height) *
                              50) /
                              this.config.fps
                      ));
        } else {
            this.addingMovingPartsInMs =
                Date.now() + (this.width + this.height) / 2 / this.config.fps;
        }
    }

    public printImage(name: string) {
        let resizedCanvas = document.createElement('canvas');
        let resizedContext = resizedCanvas.getContext('2d');
        if (resizedContext === null) {
            return;
        }

        resizedCanvas.height = this.height * this.config.pixelRatio;
        resizedCanvas.width = this.width * this.config.pixelRatio;

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
                zebra.config.blockSizes.slice(
                    (zebra.config.blockSizes.length * -0.333) << 0
                )
            );
        } else {
            wh = randElement(zebra.config.blockSizes);
        }

        let xy: Point = randPoint(
            zebra.config.blocks + 1 - wh,
            zebra.config.blocks + 1 - wh
        );

        s = {
            x: xy.x,
            y: xy.y,
            w: wh,
            h: wh,
        };

        // force use of corners: todo - still not 100% sure if this works
        if (s.x <= zebra.config.blocks * 0.2) {
            s.x = 0;
            // s.y = 0;
        }

        if (s.y <= zebra.config.blocks * 0.2) {
            // s.x = 0;
            s.y = 0;
        }

        if (s.x + s.w >= zebra.config.blocks * 0.8) {
            s.w = zebra.config.blocks - s.x;
            // s.h = zebra.config.blocks - s.y;
        }

        if (s.y + s.h >= zebra.config.blocks * 0.8) {
            // s.w = zebra.config.blocks - s.x;
            s.h = zebra.config.blocks - s.y;
        }

        s.x =
            (s.x * (zebra.width - zebra.config.padding * 2)) /
                zebra.config.blocks +
            zebra.config.padding;
        s.y =
            (s.y * (zebra.height - zebra.config.padding * 2)) /
                zebra.config.blocks +
            zebra.config.padding;
        s.w =
            ((s.w + 1) * (zebra.width - zebra.config.padding * 2)) /
            zebra.config.blocks;
        s.h =
            ((s.h + 1) * (zebra.height - zebra.config.padding * 2)) /
            zebra.config.blocks;

        s.x = s.x << 0;
        s.y = s.y << 0;
        s.w = s.w << 0;
        s.h = s.h << 0;

        // console.log(zebra.mouseDown, zebra.mouseX, zebra.mouseY);
        if (zebra.mouseDown) {
            let dx = s.x - zebra.mouseX;
            let dy = s.y - zebra.mouseY;
            this.isDirX = dx > dy;
            if (this.isDirX) {
                this.dir = zebra.mouseX > s.x ? 1 : -1;
            } else {
                this.dir = zebra.mouseY > s.y ? 1 : -1;
            }
        } else {
            this.dir = this.zebra.dir;
            this.isDirX = this.zebra.isDirX;
        }

        this.s = s;

        let m: number;

        if (this.isBig) {
            m =
                randInt(
                    zebra.config.blockSizeMax - zebra.config.blockSizeBigMin
                ) + zebra.config.blockSizeBigMin;
        } else {
            m =
                randInt(zebra.config.blockSizeMax - zebra.config.blockSizeMin) +
                zebra.config.blockSizeMin;
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
                ((m * (this.zebra.width - this.zebra.config.padding * 2)) /
                    this.zebra.config.blocks) <<
                0;
        } else {
            this.movingDistance =
                ((m * (this.zebra.height - this.zebra.config.padding * 2)) /
                    this.zebra.config.blocks) <<
                0;
        }

        let big = s.w > this.zebra.width / 2 || s.h > this.zebra.height / 2;

        this.hDir = zebra.config.isGray && !zebra.config.isGold ? 2 : 1;
        this.vDir = zebra.config.isGray ? true : big ? false : randBoolean();
        this.sDir = big ? false : randBoolean();

        this.vMin = 255 * this.zebra.config.colorValueMin;
        this.vMax = 255 * this.zebra.config.colorValueMax;

        this.sMin = this.zebra.config.colorSaturationMin;

        let colorGlitch =
            this.sDir && !big && !this.zebra.config.isGold
                ? (this.zebra.config.colorHueMinMaxBase + 2) * 5
                : 0;
        this.hMin = this.zebra.config.colorHueMin - colorGlitch;
        if (this.hMin < 0) this.hMin += 360;
        this.hMax = this.zebra.config.colorHueMax + colorGlitch;
        if (this.hMax > 360) this.hMax -= 360;
        if (
            this.hMin <= this.hMax &&
            this.zebra.config.colorHueMin > this.zebra.config.colorHueMax
        ) {
            this.hMin =
                (this.zebra.config.colorHueMax +
                    this.zebra.config.colorHueMin) /
                2;
            this.hMax = this.hMin - 1;
        }

        console.log(
            'glitch',
            this.hMin,
            this.hMax,
            this.zebra.config.colorHueMin,
            this.zebra.config.colorHueMax
        );

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
        console.log('onUpdateSize block');
        this.loop?.stop();
    }

    private onUpdateFps() {
        console.log('onUpdateFps');
        this.loop?.runWith(this.zebra.config.fps);
    }

    private start() {
        this.zebra.movingParts++;

        this.movingDistance = this.movingDistance * this.dir;
        this.loop = createLoop(
            (currentFps: number, targetFps: number, intervalId: number) =>
                this.onLoop(currentFps, targetFps, intervalId),
            () => this.onLoopStop()
        );
        this.loop.runWith(this.zebra.config.fps);
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
        let padding: number = this.zebra.config.padding;

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

            // if (tx < padding) {
            //     sw -= this.dir;
            //     tx = padding;
            // }
            //
            // if (tx + sw > maxWidth) {
            //     sw = maxWidth - tx;
            // }
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

            // if (ty < padding) {
            //     sh -= this.dir;
            //     ty = padding;
            // }
            //
            // if (ty + sh > maxHeight) {
            //     sh = maxHeight - ty;
            // }
        }

        // sx = sx << 0;
        // sy = sy << 0;
        // sw = sw << 0;
        // sh = sh << 0;
        // tx = tx << 0;
        // ty = ty << 0;

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

        for (let i: number = 0; i < l; i += 4) {
            let r = data.data[i];
            let g = data.data[i + 1];
            let b = data.data[i + 2];

            [r, g, b] = color.rotate(
                r,
                g,
                b,
                this.hDir,
                this.hMin,
                this.hMax,
                this.vDir ? this.zebra.vDir : 0,
                this.vMin,
                this.vMax,
                this.zebra.config.isGray, //|| this.zebra.vDir < 0,
                this.sDir ? this.zebra.sDir : 0,
                this.sMin,
                this.zebra.config.colorSaturationMax,
                false,
                this.zebra.config.isGray ? null : this.zebra.config.colorHue,
                this.zebra.config.colorHueMinMaxBase * 5 + 10
            );

            data.data[i] = r;
            data.data[i + 1] = g;
            data.data[i + 2] = b;
        }
        return data;
    }
}
