import { Pasture } from './pasture';
import '@fontsource/vt323/latin.css';

let search = new URLSearchParams(window.location.search);
let fxrand: string = search.get('fxrand') || '';
let fxrandOff: string = search.get('fxrandOff') || '';
let fxrandSteps: string = search.get('fxrandSteps') || '300';
if (fxrand !== '' && fxrandOff === '') {
    window.fxhash = `${parseInt(fxrand) / (parseInt(fxrandSteps) - 1)}`;
}

console.log('Zebra');
console.log(
    'Real-time deterministic animation based on vanilla js & 2d rendering context, variable size, 2022'
);
console.log("Be inspired. If you need help please press 'h'.");
console.log('Dirk Adler, https://twitter.com/d_rx');
console.log(`FXHASH: ${window.fxhash}`); // the 64 chars hex number fed to your algorithm

window.pasture = new Pasture();

console.log(`Color Range: ${window.$fxhashFeatures['Color Range']}`);
console.log(`Color Range Size: ${window.$fxhashFeatures['Color Range Size']}`);
console.log(`Color Hue Speed: ${window.$fxhashFeatures['Color Hue Speed']}`);
console.log(`Grayish: ${window.$fxhashFeatures.Grayish}`);
