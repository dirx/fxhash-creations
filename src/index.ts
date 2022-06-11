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
    combination = (Features.combinations * window.fxrand()) << 0;
}

console.log('Moving Blocks');
console.log('Monochromatic Edition');
console.log(
    'Real-time deterministic animation based on vanilla js & canvas 2d rendering context, variable size, 2022'
);
console.log("Be inspired. If you need help please press 'h'.");
console.log('Dirk Adler, https://twitter.com/d_rx');
console.log(`FXHASH: ${window.fxhash}`);

window.container = new Container(combination);

console.log(
    `combination: ${window.container.piece.combination} / ${Features.combinations}`
);
Object.entries(window.container.piece.features.getFxhashFeatures()).forEach(
    (entry) => console.log(`${entry[0]}: ${entry[1]}`)
);
