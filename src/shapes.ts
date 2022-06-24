export class Rect {
    public readonly type: string = 'rect';
    public readonly x: number;
    public readonly y: number;
    public readonly w: number;
    public readonly h: number;
    public readonly centerX: number;
    public readonly centerY: number;

    public constructor(x: number, y: number, w: number, h: number) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;

        this.centerX = x + this.w / 2;
        this.centerY = y + this.h / 2;
    }
}

export class Quad extends Rect {
    public readonly type: string = 'quad';

    public constructor(x: number, y: number, wh: number) {
        super(x, y, wh, wh);
    }
}

export class Circle {
    public readonly type: string = 'circle';
    public readonly x: number;
    public readonly y: number;
    public readonly r: number;
    public readonly centerX: number;
    public readonly centerY: number;

    public constructor(x: number, y: number, r: number) {
        this.x = x;
        this.y = y;
        this.r = r;
        this.centerX = x;
        this.centerY = y;
    }
}
