import { Features, Piece } from './piece';
import { createLoop, Loop } from './loop';

export class Container {
    public piece!: Piece;
    public loop!: Loop;
    public info!: Info;
    public help!: Help;
    public intercom!: Intercom;
    public container!: HTMLDivElement;

    public constructor(combination: number) {
        this.initContainer();
        this.initPiece(combination);
        this.initResizeHandler();
        this.initInfo();
        this.initHelp();
        this.initLoop();
        this.initIntercom();
    }

    private initContainer() {
        this.container = document.createElement('div');
        this.container.id = 'container';
        document.body.prepend(this.container);
    }

    private initPiece(combination: number) {
        let canvas = document.createElement('canvas');
        canvas.id = 'main-canvas';
        document.body.prepend(canvas);
        this.piece = new Piece(
            canvas,
            window.innerWidth,
            window.innerHeight,
            combination,
            this.getAutopauseParam(),
            this.getPixelRatioParam(),
            this.getShowAnnouncement(),
            this.getCycleGradientSpeed(),
            this.getSpeed(),
            this.getKioskSpeed()
        );

        window.$fxhashFeatures = this.piece.features.getFxhashFeatures();
    }

    private getAutopauseParam(): boolean {
        let search = new URLSearchParams(window.location.search);
        return !search.has('autopause') || search.get('autopause') == 'on';
    }

    private getPixelRatioParam(): number {
        let search = new URLSearchParams(window.location.search);
        let value: string | null = search.get('pixelratio');
        return value === null
            ? Piece.defaultPixelRatio
            : Math.abs(parseFloat(value));
    }

    private getShowAnnouncement(): boolean {
        let search = new URLSearchParams(window.location.search);
        let value: string | null = search.get('showannouncement');
        return value !== null;
    }

    private getCycleGradientSpeed(): number | null {
        let search = new URLSearchParams(window.location.search);
        let value: string | null = search.get('cyclegradientspeed');
        return value === null ? null : Math.abs(parseFloat(value));
    }

    private getSpeed(): number {
        let search = new URLSearchParams(window.location.search);
        let value: string | null = search.get('speed');
        return value === null
            ? Piece.defaultSpeed
            : Math.abs(parseFloat(value));
    }

    private getKioskSpeed(): number | null {
        let search = new URLSearchParams(window.location.search);
        let value: string | null = search.get('kioskspeed');
        return value === null ? null : Math.abs(parseFloat(value));
    }

    private getShowInfo(): boolean {
        let search = new URLSearchParams(window.location.search);
        let value: string | null = search.get('showinfo');
        return value !== null;
    }

    private initResizeHandler() {
        let piece: Piece = this.piece;
        window.addEventListener(
            'resize',
            () => {
                piece.updateSize(
                    Math.floor(window.innerWidth),
                    Math.floor(window.innerHeight)
                );
            },
            false
        );
    }

    private initInfo() {
        this.info = new Info(this.container);
        this.initInfoUpdate();
        if (this.getShowInfo()) {
            this.info.toggleShow();
        }
    }

    private initHelp() {
        this.help = new Help(this.container);
    }

    private initIntercom() {
        this.intercom = new Intercom(
            this.piece,
            this.info,
            this.help,
            this.container
        );
    }

    private initLoop() {
        let fxpreviewCalled: boolean = false;
        let piece = this.piece;
        this.loop = createLoop(
            (_currentFps: number, _targetFps: number, timeMs: number) => {
                piece.tick(timeMs);

                if (window.isFxpreview) {
                    if (!fxpreviewCalled && !piece.inPreviewPhase) {
                        let previewCanvas = piece.preparePreviewCanvas();
                        document.body.prepend(previewCanvas);
                        window.fxpreview();
                        fxpreviewCalled = true;
                        // setTimeout(() => previewCanvas.remove(), 1000);

                        // debug: combination screenshots
                        let search = new URLSearchParams(
                            window.location.search
                        );
                        let combination = search.get('combination') || '';
                        let capture = search.has('capture');
                        if (combination != '' || capture) {
                            this.piece.captureImage(
                                piece.features.getFeatureName()
                            );
                            let nextCombination = parseInt(combination) + 1;
                            if (combination != '') {
                                search.set('combination', `${nextCombination}`);
                            }
                            if (
                                nextCombination < Features.combinations ||
                                capture
                            ) {
                                setTimeout(
                                    () =>
                                        (window.location.search =
                                            search.toString()),
                                    1000
                                );
                            }
                        }
                    }
                }
            }
        );

        this.loop.runWith(piece.fps);
    }

    private initInfoUpdate() {
        let piece = this.piece;
        let info = this.info;

        setInterval(() => {
            if (!info.isActive()) {
                return;
            }
            info.update({
                combination: `${piece.features.combination} [${Features.combinations}]`,
                color: `<span style="color:${piece.features.colorCSS}">${piece.features.colorCSS}</span>`,
                colorShiftDirection: `${piece.features.colorShiftDirection} (${piece.features.variation.value.colorShiftDirection.label}) [${piece.features.variation.value.colorShiftDirection.variations}]`,
                colorShiftSpeed: `${piece.features.colorShiftSpeed} (${piece.features.variation.value.colorShiftSpeed.label}) [${piece.features.variation.value.colorShiftSpeed.variations}]`,
                gradientSteps: `${piece.features.gradientSteps} (${piece.features.variation.value.gradient.label}) [1,2,6]`,
                gradient: piece.features.gradientCSS.map(
                    (c) => `<span style="color:${c}">${c}</span>`
                ),
                gradientLightnessDiff: piece.features.gradientLightnessDiff,
                cycleGradientSpeed: `${
                    piece.cycleGradient.active
                        ? `${piece.cycleGradient.speed}`
                        : 'off'
                } / ${piece.cycleGradient.shiftStepNormalized}`,
                moireIntensity: `${piece.features.moireIntensity} (${piece.features.variation.value.moireIntensity.label}) [${piece.features.variation.value.moireIntensity.variations}]`,
                brushIntensity: `${piece.features.brushIntensity} (${piece.features.variation.value.brushIntensity.label}) [${piece.features.variation.value.brushIntensity.variations}]`,
                brushMovingBlockSize: `${piece.features.gridSize}/${
                    piece.features.gridSize / piece.features.blockSize
                }`,
                brushMovingBlocks: `${piece.movingBlocks.count} / ${piece.features.maxMovingBlocks} / ${piece.movingBlocks.total} (${piece.features.variation.value.brushMovingBlocks.label})`,
                brushMovingDirections: `${piece.features.variation.value.brushMovingDirections.index} (${piece.features.variation.value.brushMovingDirections.label}) [${piece.features.variation.value.brushMovingDirections.numberOfVariations}]`,
                movingSpeed: `${piece.features.movingSpeed} (${piece.features.variation.value.movingSpeed.label}) [${piece.features.variation.value.movingSpeed.variations}]`,
                size: `${piece.canvas.width} / ${piece.canvas.height}`,
                pixelRatio: `${piece.pixelRatio}`,
                previewPhase: piece.inPreviewPhase,
                previewPhaseEndsAfter: piece.previewPhaseEndsAfter,
                currentFps: `${Math.floor(this.loop.currentFps())}`,
                totalFrames: `${piece.movingBlocks.totalFrames}`,
                speed: `${piece.speed}`,
                announcement: `${piece.announcement?.active ? 'on' : 'off'}`,
                kioskspeed: `${
                    piece.kiosk.active ? `${piece.kiosk.speedSec}s` : 'off'
                }`,
                pausing: `${piece.paused ? 'on' : 'off'}`,
            });
        }, 250);
    }
}

export class Intercom {
    private piece: Piece;
    private info: Info;
    private help: Help;
    private display: Display;

    public constructor(
        piece: Piece,
        info: Info,
        help: Help,
        container: HTMLDivElement
    ) {
        this.piece = piece;
        this.info = info;
        this.help = help;
        this.display = new Display(container);
        this.initTouchHandler();
        this.initMouseHandler();
        this.initKeyHandler();
    }

    private initMouseHandler() {
        window.addEventListener('mouseup', (_ev: MouseEvent) => {
            this.piece.paused = !this.piece.paused;
            this.showDisplay('pausing ' + (this.piece.paused ? 'on' : 'off'));
        });
    }

    private initTouchHandler() {
        let lastIdentifier: null | number = null;
        let lastPageX: number = 0;
        let lastPageY: number = 0;
        let endListener = (ev: TouchEvent) => {
            let pageX = ev.changedTouches.item(0)?.pageX || 0;
            let pageY = ev.changedTouches.item(0)?.pageY || 0;

            // ignore scroll
            if (
                Math.abs(pageX - lastPageX) < 20 &&
                Math.abs(pageY - lastPageY) < 20
            ) {
                this.piece.paused = !this.piece.paused;
                this.showDisplay(
                    'pausing ' + (this.piece.paused ? 'on' : 'off')
                );
            }

            lastIdentifier = null;
            lastPageX = 0;
            lastPageY = 0;
            window.removeEventListener('touchend', endListener);
        };
        window.addEventListener('touchstart', (ev: TouchEvent) => {
            let identifier: null | number =
                ev.targetTouches.item(0)?.identifier || null;

            // ignore zoom
            if (ev.touches.length > 1) {
                window.removeEventListener('touchend', endListener);
                lastIdentifier = null;
                lastPageX = 0;
                lastPageY = 0;
            } else if (lastIdentifier == null) {
                lastIdentifier = identifier;
                lastPageX = ev.targetTouches.item(0)?.pageX || 0;
                lastPageY = ev.targetTouches.item(0)?.pageY || 0;
                window.addEventListener('touchend', endListener);
            }
        });
    }

    private showDisplay(msg: string) {
        if (this.info.isActive() || this.help.isActive()) {
            this.display.show(msg);
        }
    }

    private initKeyHandler() {
        window.addEventListener('keyup', (ev: KeyboardEvent) => {
            let f;
            switch (ev.key) {
                case '0':
                case '1':
                case '2':
                case '3':
                    if (!this.piece.outputs) {
                        return;
                    }
                    let index = parseInt(ev.key);
                    this.piece.outputIndex =
                        (this.piece.outputIndex === null ||
                            index !== this.piece.outputIndex) &&
                        index < this.piece.outputs.buffers.length
                            ? index
                            : null;

                    this.showDisplay(
                        'show buffer ' +
                            (this.piece.outputIndex === null
                                ? 'main'
                                : this.piece.outputIndex)
                    );
                    break;

                case '-':
                    f = this.piece.pixelRatio;
                    f =
                        Math.round(
                            (f > 1 ? f - 1 : f > 0.1 ? f - 0.1 : f) * 10
                        ) / 10;

                    this.piece.updateSize(
                        Math.floor(window.innerWidth),
                        Math.floor(window.innerHeight),
                        f
                    );
                    this.showDisplay(`pixel ratio ${this.piece.pixelRatio}`);
                    break;

                case '+':
                    f = this.piece.pixelRatio;
                    f =
                        Math.round(
                            (f >= 1 ? f + 1 : f >= 0.1 ? f + 0.1 : f) * 10
                        ) / 10;
                    this.piece.updateSize(
                        Math.floor(window.innerWidth),
                        Math.floor(window.innerHeight),
                        f
                    );
                    this.showDisplay(`pixel ratio ${this.piece.pixelRatio}`);
                    break;

                case 'o':
                    f = this.piece.speed;
                    f =
                        Math.round(
                            (f > 1 ? f - 1 : f > 0.5 ? f - 0.1 : f) * 10
                        ) / 10;

                    this.piece.speed = f;
                    this.showDisplay(`speed ${this.piece.speed}`);
                    break;

                case 'p':
                    f = this.piece.speed;
                    f =
                        Math.round(
                            (f >= 1 ? f + 1 : f >= 0.5 ? f + 0.1 : f) * 10
                        ) / 10;
                    this.piece.speed = f;
                    this.showDisplay(`speed ${this.piece.speed}`);
                    break;

                case 'f':
                    Intercom.toggleFullscreen();
                    this.showDisplay('toggle fullscreen');
                    break;

                case 'c':
                    this.piece.captureImage(
                        this.piece.features.getFeatureName()
                    );
                    this.showDisplay('capture image');
                    break;

                case 'h':
                    let help = this.help.toggleShow();
                    this.showDisplay('help ' + (help ? 'on' : 'off'));
                    break;

                case 'i':
                    let info = this.info.toggleShow();
                    this.showDisplay('info ' + (info ? 'on' : 'off'));
                    break;

                case 'g':
                    let cycleSpeed = [null, 1, 3, 10, 30];
                    let nextCycleSpeed = cycleSpeed.indexOf(
                        this.piece.cycleGradient.speed
                    );
                    nextCycleSpeed =
                        nextCycleSpeed < 0 ||
                        nextCycleSpeed + 1 >= cycleSpeed.length
                            ? 0
                            : nextCycleSpeed + 1;
                    this.piece.cycleGradient.setSpeed(
                        cycleSpeed[nextCycleSpeed]
                    );
                    this.showDisplay(
                        'cycle gradient ' +
                            (this.piece.cycleGradient.speed
                                ? `${this.piece.cycleGradient.speed}`
                                : 'off')
                    );
                    break;

                case 'a':
                    if (!this.piece.announcement) {
                        return;
                    }
                    this.piece.announcement.active =
                        !this.piece.announcement.active;
                    this.showDisplay(
                        'announce ' +
                            (this.piece.announcement?.active ? 'on' : 'off')
                    );
                    break;

                case 'd':
                    this.piece.debug = !this.piece.debug;
                    this.showDisplay(
                        'debug ' + this.piece.debug ? 'on' : 'off'
                    );
                    break;

                case 'r':
                    this.piece.kiosk.change();
                    this.showDisplay('randomize');
                    break;

                case 'k':
                    let speedSecs = [null, 1, 3, 10, 30, 100, 300];
                    let next = speedSecs.indexOf(this.piece.kiosk.speedSec);
                    next =
                        next < 0 || next + 1 >= speedSecs.length ? 0 : next + 1;
                    this.piece.kiosk.setSpeed(speedSecs[next]);
                    this.showDisplay(
                        'kiosk ' +
                            (this.piece.kiosk.speedSec
                                ? `${this.piece.kiosk.speedSec}s`
                                : 'off')
                    );
                    break;

                case ' ':
                    this.piece.paused = !this.piece.paused;
                    this.showDisplay(
                        'pausing ' + (this.piece.paused ? 'on' : 'off')
                    );
                    break;
            }
        });
    }

    private static toggleFullscreen(
        _event: MouseEvent | undefined = undefined
    ) {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            document.documentElement.requestFullscreen();
        }
    }
}

export class Display {
    private readonly container: HTMLDivElement;

    public constructor(container: HTMLDivElement) {
        this.container = container;
    }

    public show(msg: string) {
        let text = document.createElement('div');
        text.innerText = msg;
        text.classList.add('showit');
        this.container.prepend(text);
        setTimeout(() => {
            text.remove();
        }, 1000);
    }
}

export class Info {
    private readonly element: HTMLParagraphElement;

    public constructor(container: HTMLDivElement) {
        this.element = document.createElement('div');
        this.element.id = 'info';
        this.element.classList.add('loading');
        this.element.classList.add('hide');
        container.prepend(this.element);
    }

    public isActive(): boolean {
        return !this.element.classList.contains('hide');
    }

    public toggleShow(): boolean {
        this.element.classList.remove('loading');
        if (this.isActive()) {
            this.element.classList.remove('show');
            this.element.classList.add('hide');
        } else {
            this.element.classList.remove('hide');
            this.element.classList.add('show');
        }
        return this.element.classList.contains('show');
    }

    public update(properties: any) {
        let html: string = '';
        for (const [key, value] of Object.entries(properties)) {
            html += `<p><em>${key}</em> ${value}</p>`;
        }
        this.element.innerHTML = html;
    }
}

export class Help {
    private readonly element: HTMLParagraphElement;

    public constructor(container: HTMLDivElement) {
        this.element = document.createElement('div');
        this.element.id = 'help';
        this.element.classList.add('hide');
        this.element.classList.add('loading');
        this.element.innerHTML = `
          <p><em>i</em> info</p>
          <p><em>space</em> toggle pausing</p>
          <p><em>f</em> toggle fullscreen</p>
          <p><em>c</em> capture image</p>
          <p><em>g</em> toggle cycle gradient</p>
          <p><em>k</em> change kiosk mode</p>
          <p><em>a</em> toggle announce</p>
          <p><em>r</em> randomize</p>
          <p><em>- / +</em> change pixel ratio</p>
          <p><em>o / p</em> change speed</p>
          <p><em>0 - 3</em> debug buffer</p>
          <p><em>h</em> show help</p>
        `;
        container.prepend(this.element);
    }

    public isActive(): boolean {
        return !this.element.classList.contains('hide');
    }

    public toggleShow(): boolean {
        this.element.classList.remove('loading');
        if (this.isActive()) {
            this.element.classList.remove('show');
            this.element.classList.add('hide');
        } else {
            this.element.classList.remove('hide');
            this.element.classList.add('show');
        }
        return this.element.classList.contains('show');
    }
}
