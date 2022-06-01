import { Zebra, ZebraFeatures } from './zebra';
import { createLoop, Loop } from './loop';

export class Pasture {
    public zebra!: Zebra;
    public loop!: Loop;
    public info!: Info;
    public help!: Help;
    public intercom!: Intercom;

    public constructor(combination: number) {
        this.initZebra(combination);
        this.initResizeHandler();
        this.initInfo();
        this.initHelp();
        this.initLoop();
        this.initIntercom();
    }

    private initZebra(combination: number) {
        let canvas = document.createElement('canvas');
        canvas.id = 'main-canvas';
        document.body.prepend(canvas);
        this.zebra = new Zebra(
            canvas,
            window.innerWidth,
            window.innerHeight,
            combination
        );

        window.$fxhashFeatures = this.zebra.features.getFxhashFeatures();
    }

    private initResizeHandler() {
        let zebra: Zebra = this.zebra;
        window.addEventListener(
            'resize',
            () => {
                zebra.updateSize(
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
            this.zebra,
            this.info,
            this.help,
            document
        );
    }

    private initLoop() {
        let fxpreviewCalled: boolean = false;
        let zebra = this.zebra;
        this.loop = createLoop(() => {
            zebra.tick();

            if (window.isFxpreview) {
                if (!fxpreviewCalled && !zebra.inPreviewPhase) {
                    let previewCanvas = zebra.preparePreviewCanvas();
                    document.body.prepend(previewCanvas);
                    window.fxpreview();
                    fxpreviewCalled = true;
                    // setTimeout(() => previewCanvas.remove(), 1000);

                    // debug: combination screenshots
                    let search = new URLSearchParams(window.location.search);
                    let combination = search.get('combination') || '';
                    if (combination != '') {
                        this.zebra.captureImage(
                            zebra.features.getFeatureName()
                        );
                        let nextCombination = parseInt(combination) + 1;
                        search.set('combination', `${nextCombination}`);
                        if (nextCombination < ZebraFeatures.combinations) {
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

        this.loop.runWith(zebra.fps);
    }

    private initInfoUpdate() {
        let zebra = this.zebra;
        let info = this.info;

        setInterval(() => {
            info.update({
                combination: `${zebra.features.combination} / ${ZebraFeatures.combinations}`,
                color: `${zebra.features.getColorName()} (${
                    zebra.features.colorHue
                })`,
                stepSize: `${zebra.features.stepSize}`,
                blocks: `${zebra.features.gridSize}`,
                size: `${zebra.canvas.width} / ${zebra.canvas.height}`,
                pixelRatio: `${zebra.pixelRatio}`,
                previewPhase: zebra.inPreviewPhase,
                previewPhaseEndsAfter: zebra.previewPhaseEndsAfter,
                movingBlocks: `${zebra.movingBlocks.count} / ${zebra.features.maxMovingBlocks} / ${zebra.movingBlocks.total}`,
                moveDirection: `${zebra.movingFlow.direction.join(', ')} (${
                    zebra.movingFlow.position
                })`,
                changeMoveInBlocks: zebra.movingFlow.changeInBlocks,
                waitBlocks: zebra.movingFlow.waitBlocks,
                moveClockwise: zebra.movingFlow.clockwise,
                saturation: zebra.features.colorSaturation,
                valueMin: zebra.features.colorValueMin,
                valueMax: zebra.features.colorValueMax,
                currentFps: `${this.loop.currentFps() << 0}`,
                totalFrames: `${zebra.movingBlocks.totalFrames}`,
            });
        }, 250);
    }
}

export class Intercom {
    private zebra: Zebra;
    private info: Info;
    private help: Help;
    private display: Display;

    public constructor(
        zebra: Zebra,
        info: Info,
        help: Help,
        document: Document
    ) {
        this.zebra = zebra;
        this.info = info;
        this.help = help;
        this.display = new Display(document);
        this.initKeyUpHandler();
    }

    private initKeyUpHandler() {
        window.addEventListener('keyup', (ev: KeyboardEvent) => {
            switch (ev.key) {
                case '0':
                    this.zebra.updateSize(
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
                    this.zebra.updateSize(
                        window.innerWidth << 0,
                        window.innerHeight << 0,
                        parseInt(ev.key)
                    );
                    this.display.show('pixel ratio ' + ev.key);
                    break;

                case 'f':
                    Intercom.toggleFullscreen();
                    this.display.show('toggle fullscreen');
                    break;

                case 'c':
                    this.zebra.captureImage(
                        this.zebra.features.getFeatureName()
                    );
                    this.display.show('capture image');
                    break;

                case 's':
                    let smoothing = this.zebra.toggleSmoothing();
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
