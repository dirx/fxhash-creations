import { Zebra } from './zebra';
import { createLoop, Loop } from './frame';
import { rng } from './rand';

export class Pasture {
    public zebra!: Zebra;
    public loop!: Loop;
    public info!: Info;
    public help!: Help;
    public intercom!: Intercom;

    public constructor() {
        this.initZebra();
        this.initResizeHandler();
        this.initInfo();
        this.initHelp();
        this.initLoop();
        this.initIntercom();
    }

    private initZebra() {
        let canvas = document.createElement('canvas');
        canvas.id = 'main-canvas';
        document.body.prepend(canvas);
        this.zebra = new Zebra(canvas, window.innerWidth, window.innerHeight);

        window.$fxhashFeatures = this.zebra.state.getFeatures();
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
            this.loop,
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
                    window.fxpreview();
                    fxpreviewCalled = true;

                    // collect screenshots
                    let search = new URLSearchParams(window.location.search);
                    let fxrand = search.get('fxrand') || '';
                    let fxrandSteps = search.get('fxrandSteps') || '150';
                    if (fxrand != '') {
                        this.zebra.printImage(zebra.state.getFeatureName());
                        let nextFxrand = parseInt(fxrand) + 1;
                        search.set('fxrand', `${nextFxrand}`);
                        if (fxrand != fxrandSteps) {
                            window.location.search = search.toString();
                        }
                    }
                }
            }
        });

        this.loop.runWith(this.zebra.state.fps);
    }

    private initInfoUpdate() {
        let zebra = this.zebra;
        let info = this.info;

        setInterval(() => {
            let addingMovingPartsInMs =
                zebra.addingMovingPartsIn.ms(zebra.state.fps) << 0;
            info.update({
                combination: `${zebra.state.combination} / ${zebra.state.combinations}`,
                color: zebra.state.getColor(),
                colorRange: zebra.state.getColorRange(),
                colorRangeSize: zebra.state.getColorRangeSize(),
                colorHueSpeed: zebra.state.colorHueSpeed,
                isGray: zebra.state.isGray,
                isGold: zebra.state.isGold,
                isRainbow: zebra.state.isRainbow,
                size: `${zebra.canvas.width} / ${zebra.canvas.height}`,
                pixelRatio: `${zebra.state.pixelRatio}`,
                movingParts: `${zebra.movingParts} / ${zebra.state.maxMovingParts} / ${zebra.movingPartsTotal}`,
                addingMovingPartsIn: `${
                    addingMovingPartsInMs <= 0 ? '-' : addingMovingPartsInMs
                } ms`,
                moveDirection: zebra.move.join(', '),
                moveBig: zebra.isBig,
                previewPhase: zebra.inPreviewPhase,
                saturationDirection:
                    zebra.sDir > 0 ? 'up' : zebra.sDir < 0 ? 'down' : '-',
                saturationMin: zebra.state.colorSaturationMin,
                saturationMax: zebra.state.colorSaturationMax,
                valueDirection:
                    zebra.vDir > 0 ? 'up' : zebra.vDir < 0 ? 'down' : '-',
                valueMin: zebra.state.colorValueMin,
                valueMax: zebra.state.colorValueMax,
                hueGlitch: zebra.hGlitch,
                currentFps: `${this.loop.currentFps() << 0} / ${
                    zebra.state.fps
                }`,
            });
        }, 250);
    }
}

export class Intercom {
    private loop: Loop;
    private zebra: Zebra;
    private info: Info;
    private help: Help;
    private display: Display;

    public constructor(
        loop: Loop,
        zebra: Zebra,
        info: Info,
        help: Help,
        document: Document
    ) {
        this.loop = loop;
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

                case '+':
                    this.zebra.increaseFps();
                    this.loop.runWith(this.zebra.state.fps);
                    this.display.show('fps ' + this.zebra.state.fps);
                    break;

                case '-':
                    this.zebra.decreaseFps();
                    this.loop.runWith(this.zebra.state.fps);
                    this.display.show('fps ' + this.zebra.state.fps);
                    break;

                case 'f':
                    Intercom.toggleFullscreen();
                    this.display.show('toggle fullscreen');
                    break;

                case 'c':
                    this.zebra.printImage(window.fxhash);
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

                case 'b':
                    this.display.show('butterfly wing');
                    rng.skip();
                    break;

                case 'v':
                    this.zebra.vDir += 1;
                    if (this.zebra.vDir > 1) this.zebra.vDir = -1;
                    this.display.show('v dir ' + this.zebra.vDir);
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
        document.body.prepend(this.element);
    }

    public toggleShow(): boolean {
        if (this.element.classList.contains('hover')) {
            this.element.classList.remove('hover');
        } else {
            this.element.classList.add('hover');
        }
        return this.element.classList.contains('hover');
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
        this.element.innerHTML = `
          <p><em>+</em> increase fps</p>
          <p><em>-</em> decrease fps</p>
          <p><em>0 - 9</em> change pixel ratio</p>
          <p><em>b</em> butterfly wing</p>
          <p><em>i</em> info</p>
          <p><em>f</em> toggle fullscreen</p>
          <p><em>s</em> toggle smoothness</p>
          <p><em>c</em> capture image</p>
          <p><em>h</em> show help</p>
        `;
        document.body.prepend(this.element);
    }

    public toggleShow(): boolean {
        if (this.element.classList.contains('hover')) {
            this.element.classList.remove('hover');
        } else {
            this.element.classList.add('hover');
        }
        return this.element.classList.contains('hover');
    }
}
