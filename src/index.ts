/**
 * Zebra
 * Real-time animation based on vanilla js & 2d rendering context, variable size, 2022
 * © 2022 Dirk Adler, https://twitter.com/d_rx
 */

// todo: register fxhash & twitter & setup some website...

import { Pasture } from './pasture';
import '@fontsource/vt323/latin.css';

let search = new URLSearchParams(window.location.search);
let fxrand: string = search.get('fxrand') || '';
let fxrandOff: string = search.get('fxrandOff') || '';
let fxrandSteps: string = search.get('fxrandSteps') || '150';
if (fxrand !== '' && fxrandOff === '') {
    window.fxrand = () => {
        let r = parseInt(fxrand) / (parseInt(fxrandSteps) - 1);
        console.log('fxrand', r, fxrand, fxrandSteps);
        return r;
    };
}

console.log('Zebra');
console.log(
    'Real-time animation based on vanilla js & 2d rendering context, variable size, 2022'
);
console.log('Dirk Adler, https://twitter.com/d_rx');
console.log(`FXHASH: ${window.fxhash}`); // the 64 chars hex number fed to your algorithm

window.pasture = new Pasture();

console.log(`Color Range: ${window.$fxhashFeatures['Color Range']}`);
console.log(`Color Range Size: ${window.$fxhashFeatures['Color Range Size']}`);
console.log(`Grayish: ${window.$fxhashFeatures.Grayish}`);
