export type Loop = {
    runWith: (fps: number) => void;
    stop: () => void;
    currentFps: () => number;
};

export const createLoop = (
    func: Function,
    onStop: Function | null = null
): Loop => {
    let thisLoop: Date;
    let targetFps: number;
    let currentFps: number;
    let newFps: number;
    let lastLoop: Date = new Date();
    let intervalId: number;

    let stopFunc = () => {
        if (onStop !== null) {
            onStop();
        }
        clearInterval(intervalId);
    };

    let intervalFunc: Function = () => {
        thisLoop = new Date();
        newFps = 1000 / (thisLoop.getTime() - lastLoop.getTime());
        currentFps = (currentFps + newFps) / 2;
        lastLoop = thisLoop;

        if (func(currentFps << 0, targetFps, intervalId) === false) {
            stopFunc();
        }
    };

    return {
        runWith: (fps: number) => {
            currentFps = fps;
            targetFps = fps;
            if (intervalId) {
                clearInterval(intervalId);
            }
            intervalId = setInterval(intervalFunc, 1000 / fps);
        },
        stop: () => stopFunc(),
        currentFps: () => currentFps,
    };
};
