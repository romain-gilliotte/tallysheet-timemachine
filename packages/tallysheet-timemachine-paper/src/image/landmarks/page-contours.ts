const cv = require('opencv4nodejs');

/**
 * Use Edge detection to find something white-ish, square-ish and using at least 30% of the pixels.
 *
 * This allows finding a form in a contrasted background with reasonable accuracy when we can't find
 * the aruco markers (or miss some of them).
 *
 * @see https://bretahajek.com/2017/01/scanning-documents-photos-opencv/
 * @see https://stackoverflow.com/questions/43009923/how-to-complete-close-a-contour-in-python-opencv
 * @see https://stackoverflow.com/questions/8667818/opencv-c-obj-c-detecting-a-sheet-of-paper-square-detection

 * @param {cv.Mat} image
 * @returns {cv.Contour}
 */
async function getPageContour(image) {
    const minArea = 0.3 * image.sizes[0] * image.sizes[1];
    let bestArea = minArea;
    let bestContour = null;

    // Try detection on each color channel + the luminence one.
    const channels = [...(await image.splitAsync()), await image.cvtColorAsync(cv.COLOR_BGR2GRAY)];
    for (let sensibility = 1; sensibility < 3; ++sensibility) {
        for (let channel of channels) {
            const edges = await getEdges(channel, sensibility);
            const contours = await edges.findContoursAsync(cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);

            for (let contour of contours) {
                // FIXME assuming size is around the standard one we've be using... (1600*1200)
                // => we should express this as a % of (w + h) in case we change our minds
                // => Note to self: DO NOT express this as a percentage of contour perimeter.
                const approx = contour.approxPolyDPContour(30, true);

                if (approx.numPoints == 4 && approx.isConvex && bestArea < approx.area) {
                    bestContour = approx;
                    bestArea = approx.area;
                }
            }
        }
    }

    return bestContour;
}

/**
 *
 * @param {cv.Mat} image
 * @param {number} sensibility
 */
async function getEdges(image, sensibility = 1) {
    image = await image.normalizeAsync(0, 255, cv.NORM_MINMAX);
    // image = await image.bilateralFilterAsync(9, 75, 75); // noise removal
    // image = await image.adaptiveThresholdAsync(255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 115, -10);
    image = await image.medianBlurAsync(9);
    image = await image.cannyAsync(5 / sensibility, 30 / sensibility, 3);
    image = await image.dilateAsync(new cv.Mat(), new cv.Point2(-1, -1), 1);

    return image;
}

module.exports = { getEdges, getPageContour };
