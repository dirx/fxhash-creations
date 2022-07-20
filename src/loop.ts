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
        const requestId = requestAnimationFrame(intervalFunc);
        const currentDelta: number = timestamp - lastTimestamp;
        const newFps: number = 1000 / currentDelta;
        currentFps = (currentFps + newFps) / 2;

        if (currentDelta >= targetDelta) {
            lastTimestamp = timestamp;

            if (func(currentFps << 0, targetFps, timestamp) === false) {
                stopFunc();
                cancelAnimationFrame(requestId);
                return;
            }
        }
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
                lastTimestamp = 0;
                intervalFunc(window.performance.now());
            }
        },
        stop: () => stopFunc(),
        currentFps: () => currentFps,
    };
};
