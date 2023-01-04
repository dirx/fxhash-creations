import { seedFromHash } from '@thi.ng/random-fxhash';
import { XorShift128, XorWow, Xoshiro128 } from '@thi.ng/random';

export const RND: Xoshiro128 | XorShift128 | XorWow = new Xoshiro128();

export const randInit = (seed: string): void => {
    RND.seed(seedFromHash(seed));
};

export const randSkip = (max: number = 1) => {
    max = Math.floor(Math.random() * max) + 1;
    for (let i = 0; i <= max; i++) {
        rand();
    }
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

export const randShuffle = (list: Array<any>): Array<any> => {
    let c = list.length;

    while (c > 0) {
        let i = randInt(c);
        c--;
        let temp = list[c];
        list[c] = list[i];
        list[i] = temp;
    }

    return list;
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
        c.split('').join('') +
        '1'
    );
};

export const seed128 = (phrase: string): number[] => {
    let m = phrase.match(
        new RegExp('.{1,' + Math.ceil(phrase.length / 4) + '}', 'g')
    );
    if (!m) {
        throw Error('failed to split phrase');
    }
    return m.map((c) =>
        c
            .split('')
            .map((c) => c.charCodeAt(0))
            .reduce((pv, cv) => pv * cv)
    );
};
