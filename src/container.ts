import { Features, Piece } from './piece';
import { createLoop, Loop } from './loop';

export class Container {
    public piece!: Piece;
    public loop!: Loop;
    public info!: Info;
    public help!: Help;
    public intercom!: Intercom;

    public constructor(combination: number) {
        this.initPiece(combination);
        this.initResizeHandler();
        this.initInfo();
        this.initHelp();
        this.initLoop();
        this.initIntercom();
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
            combination
        );

        window.$fxhashFeatures = this.piece.features.getFxhashFeatures();
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
            },
            false
        );
    }

    private initInfo() {
        this.info = new Info(document);
        this.initInfoUpdate();
    }

    private initHelp() {
        this.help = new Help(document);
    }

    private initIntercom() {
        this.intercom = new Intercom(
            this.piece,
            this.info,
            this.help,
            document
        );
    }

    private initLoop() {
        let fxpreviewCalled: boolean = false;
        let piece = this.piece;
        this.loop = createLoop(() => {
            piece.tick();

            if (window.isFxpreview) {
                if (!fxpreviewCalled && !piece.inPreviewPhase) {
                    let previewCanvas = piece.preparePreviewCanvas();
                    document.body.prepend(previewCanvas);
                    window.fxpreview();
                    fxpreviewCalled = true;
                    // setTimeout(() => previewCanvas.remove(), 1000);

                    // debug: combination screenshots
                    let search = new URLSearchParams(window.location.search);
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
        });

        this.loop.runWith(piece.fps);
    }

    private initInfoUpdate() {
        let piece = this.piece;
        let info = this.info;

        setInterval(() => {
            info.update({
                combination: `${piece.features.combination} / ${Features.combinations}`,
                color: `${piece.features.getColorName()} (${
                    piece.features.colorHue
                }, ${piece.features.color.rgb})`,
                gridSize: `${piece.features.gridSize}`,
                rotation: `${piece.features.rotation}°`,
                shapes: `${
                    piece.features.shapes.length
                } (${piece.features.getShapes()}`,
                direction: `${piece.features.direction.join(' ')}`,
                diagonal: `${piece.features.diagonal}`,
                movingDistanceBehavior: `${piece.features.getMovingDistanceDirectionName()}`,
                stepSize: `${piece.features.stepSize}`,
                size: `${piece.canvas.width} / ${piece.canvas.height}`,
                pixelRatio: `${piece.pixelRatio}`,
                previewPhase: piece.inPreviewPhase,
                previewPhaseEndsAfter: piece.previewPhaseEndsAfter,
                movingBlocks: `${piece.movingBlocks.count} / ${piece.features.maxMovingBlocks} / ${piece.movingBlocks.total}`,
                saturation: piece.features.colorSaturation,
                valueMin: piece.features.colorValueMin,
                valueMax: piece.features.colorValueMax,
                currentFps: `${this.loop.currentFps() << 0}`,
                totalFrames: `${piece.movingBlocks.totalFrames}`,
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
        document: Document
    ) {
        this.piece = piece;
        this.info = info;
        this.help = help;
        this.display = new Display(document);
        this.initKeyUpHandler();
    }

    private initKeyUpHandler() {
        window.addEventListener('keyup', (ev: KeyboardEvent) => {
            switch (ev.key) {
                case '0':
                    this.piece.updateSize(
                        window.innerWidth << 0,
                        window.innerHeight << 0,
                        null
                    );
                    this.display.show('pixel ratio: auto');
                    break;
                case '1':
                case '2':
                case '3':
                case '4':
                case '5':
                case '6':
                case '7':
                case '8':
                case '9':
                    this.piece.updateSize(
                        window.innerWidth << 0,
                        window.innerHeight << 0,
                        parseInt(ev.key)
                    );
                    this.display.show('pixel ratio ' + ev.key);
                    break;

                case 'd':
                    this.piece.debug.toggle();
                    this.display.show(
                        'debug ' + (this.piece.debug.isEnabled() ? 'on' : 'off')
                    );
                    break;

                case 'f':
                    Intercom.toggleFullscreen();
                    this.display.show('toggle fullscreen');
                    break;

                case 'c':
                    this.piece.captureImage(
                        this.piece.features.getFeatureName()
                    );
                    this.display.show('capture image');
                    break;

                case 'b':
                    this.captureBigImage(
                        this.piece.features.getFeatureName(),
                        window.innerWidth << 0,
                        window.innerHeight << 0,
                        0.5
                    );
                    this.display.show('capture big image');
                    break;

                case 's':
                    let smoothing = this.piece.toggleSmoothing();
                    this.display.show(
                        'smoothing ' + (smoothing ? 'on' : 'off')
                    );
                    break;

                case 'h':
                    let help = this.help.toggleShow();
                    this.display.show('help ' + (help ? 'on' : 'off'));
                    break;

                case 'i':
                    let info = this.info.toggleShow();
                    this.display.show('info ' + (info ? 'on' : 'off'));
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

    private captureBigImage(
        name: string,
        width: number,
        height: number,
        pixelRatio: number
    ) {
        this.piece.updateSize(width, height, pixelRatio);
        let listener = () => {
            this.piece.canvas.removeEventListener(
                'piece.previewPhaseEnded',
                listener
            );
            this.piece.captureImage(name);
        };
        this.piece.canvas.addEventListener('piece.previewPhaseEnded', listener);
    }
}

export class Display {
    private readonly display: HTMLDivElement;

    public constructor(document: Document) {
        this.display = document.createElement('div');
        this.display.id = 'display';
        document.body.prepend(this.display);
    }

    public show(msg: string) {
        let text = document.createElement('div');
        text.innerText = msg;
        text.classList.add('showit');
        this.display.prepend(text);
        setTimeout(() => {
            text.remove();
        }, 1000);
    }
}

export class Info {
    private readonly element: HTMLParagraphElement;

    public constructor(document: Document) {
        this.element = document.createElement('div');
        this.element.id = 'info';
        this.element.classList.add('hide');
        document.body.prepend(this.element);
    }

    public toggleShow(): boolean {
        if (this.element.classList.contains('hide')) {
            this.element.classList.remove('hide');
            this.element.classList.add('show');
        } else {
            this.element.classList.remove('show');
            this.element.classList.add('hide');
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

    public constructor(document: Document) {
        this.element = document.createElement('div');
        this.element.id = 'help';
        this.element.classList.add('hide');
        this.element.innerHTML = `
          <p><em>0 - 9</em> change pixel ratio</p>
          <p><em>i</em> info</p>
          <p><em>f</em> toggle fullscreen</p>
          <p><em>s</em> toggle smoothness</p>
          <p><em>c</em> capture image</p>
          <p><em>b</em> capture big image (takes time)</p>
          <p><em>d</em> debug view</p>
          <p><em>h</em> show help</p>
        `;
        document.body.prepend(this.element);
    }

    public toggleShow(): boolean {
        if (this.element.classList.contains('hide')) {
            this.element.classList.remove('hide');
            this.element.classList.add('show');
        } else {
            this.element.classList.remove('show');
            this.element.classList.add('hide');
        }
        return this.element.classList.contains('show');
    }
}
