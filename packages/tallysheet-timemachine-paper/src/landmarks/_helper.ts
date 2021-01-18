import cv from 'opencv4nodejs';

type ImgHandlerFn = (region: cv.Mat, rect: cv.Rect) => Promise<boolean>

export async function slideOnImage(image: cv.Mat, handler: ImgHandlerFn): Promise<void> {

    for (let scale = 1; scale < 6; ++scale) {
        const slWinSizeW = Math.floor(image.sizes[1] / scale);
        const slWinSizeH = Math.floor(image.sizes[0] / scale);
        const slWinStepW = Math.floor(0.25 * slWinSizeW);
        const slWinStepH = Math.floor(0.25 * slWinSizeH);
        for (let y = 0; y <= image.sizes[0] - slWinSizeH; y += slWinStepH) {
            for (let x = 0; x <= image.sizes[1] - slWinSizeW; x += slWinStepW) {
                const rectangle = new cv.Rect(x, y, slWinSizeW, slWinSizeH);
                const region = image.getRegion(rectangle);

                if (await handler(region, rectangle)) {
                    return;
                }
            }
        }
    }
}
