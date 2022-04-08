// todo: simplify color handling
// todo: handle min/max block size
// todo: cleanup debug stuff
// todo: add keycode event to download image snapshot
// todo: tests?
// todo: generate 200 variations with screenshots to see how different they will look like
// todo: register fxhash & twitter & setup some website...
// todo: nice header

import { Pasture } from './pasture';
import '@fontsource/vt323/latin.css';

let search = new URLSearchParams(window.location.search);
let fxrand: string = search.get('fxrand') || '';
let fxrandSteps: string = search.get('fxrandSteps') || '100';
if (fxrand !== '') {
    window.fxrand = () => {
        let r = parseInt(fxrand) / parseInt(fxrandSteps);
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
console.log(window.fxhash); // the 64 chars hex number fed to your algorithm
console.log(window.fxrand());

window.pasture = new Pasture();
