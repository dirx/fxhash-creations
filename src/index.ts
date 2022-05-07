import { Pasture } from './pasture';
import '@fontsource/vt323/latin.css';
import { fakeFxhash } from './rand';

let search = new URLSearchParams(window.location.search);
let variation: string = search.get('variation') || '';
let variations: string = search.get('variations') || '300';
if (variation !== '') {
    window.fxhash = fakeFxhash(
        parseInt(variation) / (parseInt(variations) - 1)
    );
}

console.log('Zebra');
console.log(
    'Real-time deterministic animation based on vanilla js & 2d rendering context, variable size, 2022'
);
console.log("Be inspired. If you need help please press 'h'.");
console.log('Dirk Adler, https://twitter.com/d_rx');
console.log(`FXHASH: ${window.fxhash}`);

window.pasture = new Pasture();

console.log(`Range: ${window.$fxhashFeatures['range']}`);
console.log(`Range Size: ${window.$fxhashFeatures['range size']}`);
console.log(`Speed: ${window.$fxhashFeatures['speed']}`);
console.log(`Darkness: ${window.$fxhashFeatures['darkness']}`);
