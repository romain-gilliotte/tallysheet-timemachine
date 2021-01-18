import cv from 'opencv4nodejs';
import { ExtractorPlugin, FormData, MetadataLoaderFn } from 'tallysheet-timemachine';
import PaperFormData from './form-data';
import { findArucoMarkers } from './landmarks/aruco';
import { findQrCode } from './landmarks/qr-code';
import { getPageContour } from './landmarks/page-contours';

const MAX_SIZE = 2560;

export default class PaperExtractorPlugin implements ExtractorPlugin {

    mimeTypes: string[] = ['image/jpeg', 'image/png', 'image/tiff'];

    async* process(metadataLoader: MetadataLoaderFn, buffer: Buffer, mimeType?: string): AsyncGenerator<FormData> {
        let original = cv.imdecode(buffer, cv.IMREAD_COLOR);

        // Resize source image if too big. This hurts feature detection, but otherwise it takes ages.
        // FIXME I suspect opencv to ignore the "INTER_CUBIC" flag
        if (MAX_SIZE < original.sizes[0] || MAX_SIZE < original.sizes[1]) {
            const scale = Math.min(MAX_SIZE / original.sizes[0], MAX_SIZE / original.sizes[1]);
            const sizes = original.sizes.map(l => Math.floor(l * scale));
            original = await original.resizeAsync(sizes[0], sizes[1], 0, 0, cv.INTER_CUBIC);
        }

        // Load metadata from QR code & keep relevant page.
        const [qrLandmarks, qrData] = await findQrCode(original);
        const metadata = await metadataLoader(qrData.slice(0, 6).toString('hex')) as PaperMetadata
        metadata.questions = metadata.questions.filter(md => 
            [qrData[6], null].includes(md.boundaries.pageNo)
        );

        // Depending on file orientation, chose final size of our image (50px/cm is ~ 125dpi).
        let width, height;
        if (metadata.orientation === 'portrait') {
            [width, height] = [21.0 * 50, 29.7 * 50];
        } else {
            [width, height] = [29.7 * 50, 21.0 * 50];
        }
    
        // Find points in common, find homography, reproject.
        const landmarks = await this.findLandmarks(original, qrLandmarks);
        const targets = this.computeTargets(metadata, width, height);
        const homography = this.findHomography(landmarks, targets);
        const deskewed = await original.warpPerspectiveAsync(homography, new cv.Size(width, height));

        yield new PaperFormData(metadata, deskewed);
    }

    /**
     * Find relevant landmarks in a given picture (QR-code, aruco markers, page corners).
     * 
     * @param image Image to search
     * @param qrLandmarks QR-Code landmarks
     */
    private async findLandmarks(image: cv.Mat, qrLandmarks: Record<string, cv.Point2>): Promise<Record<string, cv.Point2>> {
        const aruco = await findArucoMarkers(image);
        const points = { ...aruco, ...qrLandmarks };

        if (Object.keys(points).length < 12) {
            let contour = await getPageContour(image);
            if (contour) {
                const corners = contour.getPoints();

                // We don't know if the contour is clockwise or counter clockwise.
                // => Sort the points in clockwise order.
                const centroid = corners.reduce(
                    (m, p) => new cv.Point2(m.x + p.x / 4, m.y + p.y / 4),
                    new cv.Point2(0, 0)
                );
                corners.sort((a, b) => {
                    const angleA = Math.atan2(a.y - centroid.y, a.x - centroid.x);
                    const angleB = Math.atan2(b.y - centroid.y, b.x - centroid.x);
                    return angleA - angleB;
                });

                // Find top-right corner (closest from the QR-code).
                const trIndex = corners.reduce((memo, p2, index, arr) => {
                    const qrtr = points['qr-tr'];
                    const p1 = arr[memo];
                    const d1 = (p1.x - qrtr.x) ** 2 + (p1.y - qrtr.y) ** 2;
                    const d2 = (p2.x - qrtr.x) ** 2 + (p2.y - qrtr.y) ** 2;
                    return d1 < d2 ? memo : index;
                }, 0);

                points['corner-tr'] = corners[trIndex];
                points['corner-br'] = corners[(trIndex + 1) % 4];
                points['corner-bl'] = corners[(trIndex + 2) % 4];
                points['corner-tl'] = corners[(trIndex + 3) % 4];
            }
        }

        return points;
    }

    private computeTargets(metadata: PaperMetadata, w: number, h: number): Record<string, cv.Point2> {
        const targets: Record<string, cv.Point2> = {};

        metadata
            .questions
            .forEach(md => {
                const rect = md.boundaries;

                targets[`${md.id}-tl`] = new cv.Point2(rect.x * w, rect.y * h);
                targets[`${md.id}-tr`] = new cv.Point2((rect.x + rect.w) * w, rect.y * h);
                targets[`${md.id}-bl`] = new cv.Point2(rect.x * w, (rect.y + rect.h) * h);
                targets[`${md.id}-br`] = new cv.Point2((rect.x + rect.w) * w, (rect.y + rect.h) * h);
            });

        return targets;
    }

    private findHomography(landmarksObj: Record<string, cv.Point2>, targetObj: Record<string, cv.Point2>): cv.Mat {
        const landmarks = [];
        const targets = [];
        for (let key in targetObj) {
            if (landmarksObj[key]) {
                landmarks.push(landmarksObj[key]);
                targets.push(targetObj[key]);
            }
        }

        return cv.findHomography(landmarks, targets).homography;
    }
}

