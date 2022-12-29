import * as dekapng from 'dekapng';

// todo: pretty unstable > same limits on chrome - might depend on url creation from blob > probably requires zlib streaming to work in dekapng to limit overall size
export type Chunk = {
    width: number;
    height: number;
    data: Uint8Array;
};
const readData = (
    context: WebGL2RenderingContext,
    chunkX: number,
    chunkY: number,
    chunkWidth: number,
    chunkHeight: number
): Chunk => {
    let data = new Uint8Array(chunkWidth * chunkHeight * 4);
    context.readPixels(
        chunkX,
        chunkY,
        chunkWidth,
        chunkHeight,
        WebGL2RenderingContext.RGBA,
        WebGL2RenderingContext.UNSIGNED_BYTE,
        data
    );

    // swap lines (should probably just fix code in makeBigPng to read backward
    const lineSize = chunkWidth * 4;
    const line = new Uint8Array(lineSize);
    const numLines = (chunkHeight / 2) | 0;
    for (let i = 0; i < numLines; ++i) {
        const topOffset = lineSize * i;
        const bottomOffset = lineSize * (chunkHeight - i - 1);
        line.set(data.slice(topOffset, topOffset + lineSize), 0);
        data.set(data.slice(bottomOffset, bottomOffset + lineSize), topOffset);
        data.set(line, bottomOffset);
    }
    return {
        width: chunkWidth,
        height: chunkHeight,
        data: data,
    };
};

function wait() {
    return new Promise((resolve) => {
        setTimeout(resolve);
    });
}

export async function capture(
    context: WebGL2RenderingContext,
    width: number,
    height: number
): Promise<Blob> {
    const pngRGBAWriter = new dekapng.PNGRGBAWriter(width, height);

    const chunkWidth = 1000;
    const chunkHeight = 100;

    for (
        let chunkY = height - chunkHeight;
        chunkY >= 0;
        chunkY -= chunkHeight
    ) {
        const rowChunks = [];
        const localHeight = Math.min(chunkHeight, height - chunkY);

        for (let chunkX = 0; chunkX < width; chunkX += chunkWidth) {
            const localWidth = Math.min(chunkWidth, width - chunkX);

            const data = readData(
                context,
                chunkX,
                chunkY,
                localWidth,
                localHeight
            );
            rowChunks.push(data);
        }

        for (let row = 0; row < localHeight; ++row) {
            rowChunks.forEach((chunk: Chunk) => {
                const rowSize = chunk.width * 4;
                const chunkOffset = rowSize * row;
                pngRGBAWriter.addPixels(chunk.data, chunkOffset, chunk.width);
            });
        }

        await wait();
    }

    return pngRGBAWriter.finishAndGetBlob();
}
