export type Loop = {
    runWith: (fps: number) => void;
    stop: () => void;
    currentFps: () => number;
};

export const createLoop = (
    func: Function,
    onStop: Function | null = null
): Loop => {
    let targetFps: number = 0;
    let currentFps: number = 0;
    let targetDelta: number = 0;
    let lastTimestamp: number = 0;
    let started: boolean = false;

    let stopFunc = () => {
        if (onStop !== null) {
            onStop();
        }
    };

    let intervalFunc: FrameRequestCallback = (timestamp) => {
        const currentDelta: number = timestamp - lastTimestamp;
        const newFps: number = 1000 / currentDelta;
        currentFps = (currentFps + newFps) / 2;

        if (currentDelta >= targetDelta) {
            lastTimestamp = timestamp;

            if (func(currentFps << 0, targetFps) === false) {
                stopFunc();
                return;
            }
        }

        requestAnimationFrame(intervalFunc);
    };

    return {
        runWith: (fps: number) => {
            if (fps <= 0) {
                throw new Error('fps must be > 0');
            }
            currentFps = fps;
            targetFps = fps;
            targetDelta = (1000 / fps) << 0;
            if (!started) {
                started = true;
                lastTimestamp = window.performance.now();
                requestAnimationFrame(intervalFunc);
            }
        },
        stop: () => stopFunc(),
        currentFps: () => currentFps,
    };
};
