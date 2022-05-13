import { Pasture } from './pasture';
import '@fontsource/vt323/latin.css';
import { fakeFxhash } from './rand';
import { ZebraFeatures } from './zebra';

let search = new URLSearchParams(window.location.search);
let combinationParam: string = search.get('combination') || '';
let combination: number;
if (combinationParam !== '') {
    combination = parseInt(combinationParam);
    window.fxhash = fakeFxhash(combination / ZebraFeatures.combinations);
} else {
    // todo why round and not floor?
    combination = (ZebraFeatures.combinations * window.fxrand()) << 0;
}

console.log('Zebra');
console.log(
    'Real-time deterministic animation based on vanilla js & 2d rendering context, variable size, 2022'
);
console.log("Be inspired. If you need help please press 'h'.");
console.log('Dirk Adler, https://twitter.com/d_rx');
console.log(`FXHASH: ${window.fxhash}`);

window.pasture = new Pasture(combination);

console.log(`Combination: ${window.pasture.zebra.features.combination}`);
console.log(`Range: ${window.$fxhashFeatures['range']}`);
console.log(`Range Size: ${window.$fxhashFeatures['range size']}`);
console.log(`Darkness: ${window.$fxhashFeatures['darkness']}`);
