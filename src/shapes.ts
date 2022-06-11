export class Rect {
    public readonly type: string = 'rect';
    public x: number;
    public y: number;
    public w: number;
    public h: number;

    public constructor(x: number, y: number, w: number, h: number) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
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
    public x: number;
    public y: number;
    public r: number;

    public constructor(x: number, y: number, r: number) {
        this.x = x;
        this.y = y;
        this.r = r;
    }
}
