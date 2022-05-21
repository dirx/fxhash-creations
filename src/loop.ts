export type Loop = {
    runWith: () => void;
    stop: () => void;
    currentFps: () => number;
};

export const createLoop = (
    func: Function,
    onStop: Function | null = null
): Loop => {
    let currentFps: number = 0;
    let newFps: number;
    let lastTimestamp: number = 0;
    let started: boolean = false;

    let stopFunc = () => {
        if (onStop !== null) {
            onStop();
        }
    };

    let intervalFunc: FrameRequestCallback = (_timestamp) => {
        let now = Date.now();
        let delta = now - lastTimestamp;
        newFps = 1000 / delta;
        currentFps = currentFps === 0 ? newFps : (currentFps + newFps) / 2;
        lastTimestamp = now;

        if (func(currentFps << 0) === false) {
            stopFunc();
            return;
        }

        requestAnimationFrame(intervalFunc);
    };

    return {
        runWith: () => {
            lastTimestamp = Date.now();
            if (!started) {
                started = true;
                requestAnimationFrame(intervalFunc);
            }
        },
        stop: () => stopFunc(),
        currentFps: () => currentFps,
    };
};
