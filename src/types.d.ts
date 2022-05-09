import { FxhashFeatures } from './zebra';
import { Pasture } from './pasture';

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
        pasture: Pasture;
        combination: number;
    }
}
