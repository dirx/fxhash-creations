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

console.info('Moving Blocks');
console.info('Monochromatic Edition');
console.info('Real-time deterministic webgl2 animation, fixed size, 2022');
console.info("Be inspired. If you need help please press 'h'.");
console.info('Dirk Adler, https://twitter.com/d_rx');
console.info(`FXHASH: ${window.fxhash}`);

window.container = new Container(combination);

console.info(
    `combination: ${window.container.piece.combination} / ${Features.combinations}`
);
Object.entries(window.container.piece.features.getFxhashFeatures()).forEach(
    (entry) => console.info(`${entry[0]}: ${entry[1]}`)
);
