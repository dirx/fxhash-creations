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
        this.updateSize();
    }

    private initPiece(combination: number) {
        let canvas = document.createElement('canvas');
        canvas.id = 'main-canvas';
        document.body.prepend(canvas);
        this.piece = new Piece(
            canvas,
            window.innerWidth,
            window.innerHeight,
            null,
            combination,
            this.getAutopauseParam()
        );

        window.$fxhashFeatures = this.piece.features.getFxhashFeatures();
    }

    private getAutopauseParam(): boolean {
        let search = new URLSearchParams(window.location.search);
        return !search.has('autopause') || search.get('autopause') == 'on';
    }

    private initResizeHandler() {
        let piece: Piece = this.piece;
        window.addEventListener(
            'resize',
            () => {
                piece.updateSize(
                    window.innerWidth << 0,
                    window.innerHeight << 0
                );
                this.updateSize();
            },
            false
        );
    }

    private updateSize() {
        this.container.style.width = `${
            (Math.min(window.innerWidth, window.innerHeight) /
                window.innerWidth) *
            100
        }%`;
        this.container.style.height = `${
            (Math.min(window.innerWidth, window.innerHeight) /
                window.innerHeight) *
            100
        }%`;
    }

    private initInfo() {
        this.info = new Info(this.container);
        this.initInfoUpdate();
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
                color: `${piece.features.getColorName()} (${
                    piece.features.color.rgb
                }) [${Features.colors.length}]`,
                shapes: `${
                    piece.features.shapes.length
                } (${piece.features.getShapes()}) [${
                    Features.shapesOptions.length
                }]`,
                clusters: `${piece.features.clusters} [${Features.clusterOption}]`,
                rotation: `${piece.features.rotation}°  [${Features.rotationOptions.length}]`,
                gridSize: `${piece.features.gridSize} [${Features.blockOption}]`,
                movingBlocks: `${piece.movingBlocks.count} / ${piece.features.maxMovingBlocks} / ${piece.movingBlocks.total}`,
                movingDirection: `${piece.features.getMovingDirection()} [${
                    Features.getMovingDirectionOptions().length
                }]`,
                movingDistanceBehavior: `${piece.features.getMovingBehavior()}  [${
                    Features.movingBehaviorOptions.length
                }]`,
                movingSpeed: `${piece.features.movingSpeed}  [${Features.movingSpeedOptions.length}]`,
                size: `${piece.canvas.width} / ${piece.canvas.height}`,
                pixelRatio: `${piece.pixelRatio}`,
                previewPhase: piece.inPreviewPhase,
                previewPhaseEndsAfter: piece.previewPhaseEndsAfter,
                currentFps: `${this.loop.currentFps() << 0}`,
                totalFrames: `${piece.movingBlocks.totalFrames}`,
                paused: `${piece.paused}`,
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
            switch (ev.key) {
                case '0':
                case '1':
                case '2':
                case '3':
                case '4':
                case '5':
                case '6':
                case '7':
                case '8':
                case '9':
                    this.piece.outputBuffer =
                        this.piece.outputBuffer === null ||
                        parseInt(ev.key) !== this.piece.outputBuffer
                            ? parseInt(ev.key)
                            : null;
                    this.showDisplay(
                        'show buffer ' +
                            (this.piece.outputBuffer === null
                                ? 'main'
                                : this.piece.outputBuffer)
                    );
                    break;

                case 'd':
                    this.piece.debug.toggle();
                    this.showDisplay(
                        'debug ' + (this.piece.debug.isActive() ? 'on' : 'off')
                    );
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
          <p><em>0 - 9</em> show buffer</p>
          <p><em>p</em> toggle pausing</p>
          <p><em>f</em> toggle fullscreen</p>
          <p><em>c</em> capture image</p>
          <p><em>d</em> debug view</p>
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
