import { Features, KioskMode, Piece } from './piece';
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
            this.getPixelRatio(),
            this.getShowAnnouncement(),
            this.getKioskSpeed(),
            this.getKioskMode(),
            this.getSize()
        );

        window.$fxhashFeatures = this.piece.features.getFxhashFeatures();
    }

    private getPixelRatio(): number {
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

    private getKioskSpeed(): number | null {
        let search = new URLSearchParams(window.location.search);
        let value: string | null = search.get('kioskspeed');
        return value === null ? null : Math.abs(parseFloat(value));
    }

    private getKioskMode(): KioskMode | null {
        let search = new URLSearchParams(window.location.search);
        let value: string | null = search.get('kioskmode');
        switch (value) {
            case 'a':
            case 'animate':
                return KioskMode.ANIMATE;
            case 'o':
            case 'objects':
                return KioskMode.OBJECTS;
            case 'f':
            case 'features':
                return KioskMode.FEATURES;
            default:
                return null;
        }
    }

    private getShowInfo(): boolean {
        let search = new URLSearchParams(window.location.search);
        let value: string | null = search.get('showinfo');
        return value !== null;
    }

    private getSize(): number {
        let search = new URLSearchParams(window.location.search);
        let value: string | null = search.get('size');
        return value === null
            ? Piece.defaultSize
            : Math.abs(Math.max(1, parseFloat(value)));
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
                                    1000 * 3
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
                palette: `${piece.features.variation.value.palette.value.map(
                    (v: string) =>
                        '<span style="color:' + v + '">' + v + '</span>'
                )} (${piece.features.variation.value.palette.label}) [${
                    piece.features.variation.value.palette.numberOfVariations
                }]`,
                colorSortDirection: `${piece.features.variation.value.colorSortDirection.value} (${piece.features.variation.value.colorSortDirection.label}) [${piece.features.variation.value.colorSortDirection.numberOfVariations}]`,
                colorSortReference: `${piece.features.variation.value.colorSortReference.value} [${piece.features.variation.value.colorSortReference.numberOfVariations}]`,
                shapes: `${piece.features.variation.value.shapes.value} (${piece.features.variation.value.shapes.label}) [${piece.features.variation.value.shapes.numberOfVariations}]`,
                size: `${piece.canvas.width} / ${piece.canvas.height}`,
                pixelRatio: `${piece.pixelRatio}`,
                pauseAfter: piece.pauseAfter,
                currentFps: `${Math.floor(this.loop.currentFps())}`,
                totalFrames: `${piece.frames.total}`,
                inPreviewPhase: `${piece.inPreviewPhase}`,
                announcement: `${piece.announcement?.active ? 'on' : 'off'}`,
                debug: `${piece.debugLevel ? piece.debugLevel : 'off'}`,
                kioskspeed: `${
                    piece.kiosk.active ? `${piece.kiosk.speedSec}s` : 'off'
                }`,
                kioskmode: `${
                    piece.kiosk.active ? `${piece.kiosk.mode}` : 'off'
                }`,
                pausing: `${piece.paused ? 'on' : 'off'}`,
            });
        }, 250);
    }
}

export class Intercom {
    public clickTimoutMs = 200;
    public touchTimoutMs = 300;
    private display: Display;

    public constructor(
        private piece: Piece,
        private info: Info,
        private help: Help,
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
        let timeout: NodeJS.Timeout;
        let clicks: number = 0;
        window.addEventListener('click', (_ev: MouseEvent) => {
            clearTimeout(timeout);
            clicks++;
            if (clicks === 1) {
                timeout = setTimeout(() => {
                    clicks = 0;
                    this.piece.kiosk.change(KioskMode.ANIMATE);
                    this.showDisplay('touched');
                }, this.clickTimoutMs);
            } else if (clicks === 2) {
                timeout = setTimeout(() => {
                    clicks = 0;
                    this.piece.kiosk.change(KioskMode.OBJECTS);
                    this.showDisplay('randomize objects');
                }, this.clickTimoutMs);
            } else if (clicks === 3) {
                clicks = 0;
                this.piece.kiosk.change(KioskMode.FEATURES);
                this.showDisplay('randomize features');
            }
        });
    }

    private initTouchHandler() {
        let lastIdentifier: null | number = null;
        let lastPageX: number = 0;
        let lastPageY: number = 0;
        let touchTimeout: NodeJS.Timeout;
        let touches: number = 0;
        let endListener = (ev: TouchEvent) => {
            let pageX = ev.changedTouches.item(0)?.pageX || 0;
            let pageY = ev.changedTouches.item(0)?.pageY || 0;

            // ignore scroll
            if (
                Math.abs(pageX - lastPageX) < 20 &&
                Math.abs(pageY - lastPageY) < 20
            ) {
                clearTimeout(touchTimeout);
                touches++;
                if (touches === 1) {
                    touchTimeout = setTimeout(() => {
                        touches = 0;
                        this.piece.kiosk.change(KioskMode.ANIMATE);
                        this.showDisplay('touched');
                    }, this.touchTimoutMs);
                } else if (touches === 2) {
                    touchTimeout = setTimeout(() => {
                        touches = 0;
                        this.piece.kiosk.change(KioskMode.OBJECTS);
                        this.showDisplay('randomize objects');
                    }, this.touchTimoutMs);
                } else if (touches === 3) {
                    touches = 0;
                    this.piece.kiosk.change(KioskMode.FEATURES);
                    this.showDisplay('randomize feature');
                }
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
                    this.piece.debugLevel =
                        this.piece.debugLevel == 2
                            ? 0
                            : this.piece.debugLevel + 1;

                    this.showDisplay(
                        'debug ' +
                            (this.piece.debugLevel
                                ? this.piece.debugLevel
                                : 'off')
                    );
                    break;

                case 'r':
                    this.piece.kiosk.change(KioskMode.FEATURES);
                    this.showDisplay('randomize features');
                    break;

                case 'o':
                    this.piece.kiosk.change(KioskMode.OBJECTS);
                    this.showDisplay('randomize objects');
                    break;

                case 'k':
                    let speedSecs = [null, 3, 5, 10];
                    let next = speedSecs.indexOf(this.piece.kiosk.speedSec);
                    next =
                        next < 0 || next + 1 >= speedSecs.length ? 0 : next + 1;
                    this.piece.kiosk.setSpeedAndMode(
                        speedSecs[next],
                        this.piece.kiosk.mode
                    );
                    this.showDisplay(
                        'kiosk ' +
                            (this.piece.kiosk.speedSec
                                ? `${this.piece.kiosk.speedSec}s`
                                : 'off')
                    );
                    break;

                case 'm':
                    let modes = [
                        KioskMode.ANIMATE,
                        KioskMode.OBJECTS,
                        KioskMode.FEATURES,
                    ];
                    let nextMode = modes.indexOf(this.piece.kiosk.mode);
                    nextMode =
                        nextMode < 0 || nextMode + 1 >= modes.length
                            ? 0
                            : nextMode + 1;
                    this.piece.kiosk.setSpeedAndMode(
                        this.piece.kiosk.speedSec,
                        modes[nextMode]
                    );
                    this.showDisplay(
                        'kiosk ' +
                            (this.piece.kiosk.speedSec
                                ? `${this.piece.kiosk.mode}`
                                : 'off')
                    );
                    break;

                case ' ':
                    this.piece.kiosk.change(KioskMode.ANIMATE);
                    this.showDisplay('touched');
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
    public constructor(private container: HTMLDivElement) {}

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
          <p><em>space</em> touch</p>
          <p><em>f</em> toggle fullscreen</p>
          <p><em>c</em> capture image</p>
          <p><em>k</em> change kiosk mode</p>
          <p><em>a</em> toggle announce</p>
          <p><em>r</em> randomize features</p>
          <p><em>o</em> randomize objects</p>
          <p><em>0 - 2</em> debug buffer</p>
          <p><em>d</em> toggle debug level</p>
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
