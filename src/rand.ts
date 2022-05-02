import Prando from 'prando';

export type Point = {
    x: number;
    y: number;
};

export type Area = {
    x: number;
    y: number;
    w: number;
    h: number;
};

let rng: Prando;

export const randInit = (seed: string): void => {
    rng = new Prando(seed);
};

export const rand = (): number => {
    let r: number = rng === undefined ? window.fxrand() : rng.next();
    // console.log(r);
    return r;
};

export const randBoolean = (): boolean => {
    return randInt(2) == 0;
};
export const randInt = (max: number): number => {
    return (rand() * max) << 0;
};

export const randOptions = (list: Array<any>): any => {
    return list[randInt(list.length)];
};

export const randPoint = (maxX: number, maxY: number): Point => {
    return {
        x: randInt(maxX),
        y: randInt(maxY),
    };
};
