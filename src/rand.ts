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

export const fakeFxhash = (
    firstFxrand: number,
    randomize: boolean = true
): string => {
    const alphabet =
        '123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
    const b58enc = (n: number) => {
        let hash = '';
        let i = 0;
        do {
            hash += alphabet[n % 58];
            n = (n / 58) | 0;
            i++;
        } while (i < 12);
        return hash;
    };
    let a = b58enc(Math.ceil(firstFxrand * 4294967296));
    let c = b58enc(((randomize ? Math.random() : 0) * 4294967296) >>> 0);

    return (
        'oo' +
        a.split('').reverse().join('') +
        Array(12).fill('1').join('') +
        c.split('').reverse().join('') +
        Array(13).fill('1').join('')
    );
};
