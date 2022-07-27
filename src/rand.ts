import { seedFromHash } from '@thi.ng/random-fxhash';
import { XorShift128, XorWow, Xoshiro128 } from '@thi.ng/random';

export type Area = {
    x: number;
    y: number;
    w: number;
    h: number;
};

export const RND: Xoshiro128 | XorShift128 | XorWow = new Xoshiro128();

export const randInit = (seed: string): void => {
    RND.seed(seedFromHash(seed));
};

export const rand = (): number => {
    return RND.float();
};

export const randBoolean = (): boolean => {
    return randInt(2) == 0;
};

export const randInt = (max: number): number => {
    return Math.floor(rand() * max);
};

export const randOptions = (
    list: Array<any>,
    weights: Array<number> | null = null
): any => {
    if (weights) {
        let i;
        for (i = 0; i < list.length; i++) {
            weights[i] = (weights[i] || 1) + (weights[i - 1] || 0);
        }
        let r = randInt(weights[weights.length - 1]);
        for (i = 0; i < weights.length; i++) {
            if (weights[i] > r) {
                break;
            }
        }

        return list[i];
    }

    return list[randInt(list.length)];
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
