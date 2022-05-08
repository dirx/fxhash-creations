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

export const randSkip = (times: number = 1): void => {
    if (rng !== undefined) {
        rng.skip(times);
    } else {
        Array(times).forEach(() => rand());
    }
};

export const rand = (): number => {
    return rng === undefined ? window.fxrand() : rng.next();
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

export const fakeFxhash = (firstFxrand: number): string => {
    let a = (firstFxrand * 4294967296) >>> 0;
    const alphabet =
        '123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
    let hash = '';
    let i = 0;
    do {
        a = (a / 58) | 0;
        hash += alphabet[a % 58];
        i++;
    } while (i <= 12);

    return (
        'oo' + hash.split('').reverse().join('') + Array(37).fill('1').join('')
    );
};
