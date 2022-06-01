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
    combination = (ZebraFeatures.combinations * window.fxrand()) << 0;
}

console.log('Zebra');
console.log('Monochromatic Edition');
console.log(
    'Real-time deterministic animation based on vanilla js & canvas 2d rendering context, variable size, 2022'
);
console.log("Be inspired. If you need help please press 'h'.");
console.log('Dirk Adler, https://twitter.com/d_rx');
console.log(`FXHASH: ${window.fxhash}`);

window.pasture = new Pasture(combination);

console.log(`Combination: ${window.pasture.zebra.features.combination}`);
console.log(`Color: ${window.$fxhashFeatures['color']}`);
console.log(`Step size: ${window.$fxhashFeatures['stepSize']}`);
console.log(`Grid Size: ${window.$fxhashFeatures['gridSize']}`);
