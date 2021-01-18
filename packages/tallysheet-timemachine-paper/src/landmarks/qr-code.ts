import jsQR from 'jsqr';
import cv from 'opencv4nodejs';
import { slideOnImage } from './_helper';

/**
 * Find QR code in a Matrix, and return its data and corner positions.
 */
export async function findQrCode(image: cv.Mat): Promise<[Record<string, cv.Point2>, Buffer]> {
    let location: Record<string, cv.Point2> | null = null;
    let content: Buffer | null = null;

    image = await image.cvtColorAsync(cv.COLOR_BGR2GRAY);

    // Otsu threshold the image before giving to detector.
    // It seems to help with bad images.
    // image = region.threshold(0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);

    await slideOnImage(image, async (region, rect) => {
        region = await region.cvtColorAsync(cv.COLOR_GRAY2RGBA);

        const data = await region.getDataAsync() as unknown as Uint8ClampedArray;
        const code = jsQR(data, rect.width, rect.height);

        // reject empty codes, which this lib detects sometimes
        if (code && code.binaryData.length) {
            content = Buffer.from(code.binaryData);
            location = {
                'qr-tl': new cv.Point2(rect.x + code.location.topLeftCorner.x, rect.y + code.location.topLeftCorner.y),
                'qr-tr': new cv.Point2(rect.x + code.location.topRightCorner.x, rect.y + code.location.topRightCorner.y),
                'qr-bl': new cv.Point2(rect.x + code.location.bottomRightCorner.x, rect.y + code.location.bottomRightCorner.y),
                'qr-br': new cv.Point2(rect.x + code.location.bottomLeftCorner.x, rect.y + code.location.bottomLeftCorner.y),
            };

            return true;
        }

        return false;
    });

    if (location && content)
        return [location, content];
    else
        throw new Error('Could not find QR-Code in provided image');
}
