import '@fontsource/vt323/latin.css';
import { fakeFxhash } from './rand';
import { Features } from './piece';
import { Container } from './container';

let search = new URLSearchParams(window.location.search);
let combinationParam: string = search.get('combination') || '';
let combination: number;
if (combinationParam !== '') {
    combination = parseInt(combinationParam);
    window.fxhash = fakeFxhash(combination / Features.combinations);
} else {
    combination = Math.floor(Features.combinations * window.fxrand());
}

console.info('Driften');
console.info('Real-time deterministic webgl2 animation, variable size, 2022');
console.info("Be inspired. If you need help please press 'h'.");
console.info('Dirk Adler, https://dirx.dev');
console.info(`FXHASH: ${window.fxhash}`);

window.container = new Container(combination);
