const { AR } = require('js-aruco');
const cv = require('opencv4nodejs');
const { slideOnImage } = require('./_helper');

/**
 *
 * @param {cv.Mat} image
 * @returns {Promise<Record<string, cv.Point2>>}
 */
async function findArucoMarkers(image) {
    const detector = new AR.Detector();
    const points = {};

    // Search in the image.
    await slideOnImage(image, async (region, rect) => {
        const gray = await region.cvtColorAsync(cv.COLOR_BGR2GRAY);
        const [threshold, adaptative] = await Promise.all([
            gray.thresholdAsync(0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU),
            gray.adaptiveThresholdAsync(
                255,
                cv.ADAPTIVE_THRESH_GAUSSIAN_C,
                cv.THRESH_BINARY,
                21,
                0
            ),
        ]);

        const attempts = await Promise.all([
            region.cvtColorAsync(cv.COLOR_BGR2RGBA),
            threshold.cvtColorAsync(cv.COLOR_GRAY2RGBA),
            adaptative.cvtColorAsync(cv.COLOR_GRAY2RGBA),
        ]);

        for (let attempt of attempts) {
            const detected = detector.detect({
                data: await attempt.getDataAsync(),
                width: rect.width,
                height: rect.height,
            });

            for (let marker of detected) {
                const corners = marker.corners;

                ['tl', 'tr', 'br', 'bl'].forEach((corner, index) => {
                    points[`aruco-${marker.id}-${corner}`] = new cv.Point2(
                        corners[index].x + rect.x,
                        corners[index].y + rect.y
                    );
                });
            }

            if (Object.keys(points).length >= 12) {
                break;
            }
        }

        // Stop when we have found all markers.
        return Object.keys(points).length >= 12;
    });

    return points;
}

module.exports = { findArucoMarkers };
