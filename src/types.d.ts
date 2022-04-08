import { ZebraFeatures } from './zebra';
import { Pasture } from './pasture';

declare global {
    interface Window {
        s: number;
        refSize: number;
        $fxhashFeatures: ZebraFeatures;
        drawingContext: any;
        fxpreview: Function;
        fxhash: string;
        fxrand: Function;
        isFxpreview: boolean;
        pasture: Pasture;
    }
}
