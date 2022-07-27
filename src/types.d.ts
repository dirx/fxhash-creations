import { FxhashFeatures } from './piece';
import { Container } from './container';

declare global {
    interface Window {
        s: number;
        refSize: number;
        $fxhashFeatures: FxhashFeatures;
        drawingContext: any;
        fxpreview: Function;
        fxhash: string;
        fxrand: Function;
        isFxpreview: boolean;
        container: Container;
    }
}
