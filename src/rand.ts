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

let prng: Prando;

export const randInit = (seed: string): void => {
    prng = new Prando(seed);
};

export const rand = (): number => {
    return prng === undefined ? window.fxrand() : prng.next();
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
