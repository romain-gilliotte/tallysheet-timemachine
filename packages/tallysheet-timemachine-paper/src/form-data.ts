import { CellValue, FormData } from "tallysheet-timemachine";
import cv from 'opencv4nodejs';

export default class PaperFormData extends FormData {
    metadata: PaperMetadata;
    image: cv.Mat;

    constructor(metadata: PaperMetadata, image: cv.Mat) {
        super();

        this.metadata = metadata;
        this.image = image;
    }

    async getImage(): Promise<Buffer> {
        return this.encode(this.image);
    }

    async getQuestionImage(questionId: string): Promise<Buffer> {
        const question = this.metadata.questions.find(q => q.id == questionId);

        if (question) {
            const bounds = question.boundaries;
            const region = this.image.getRegion(new cv.Rect(bounds.x, bounds.y, bounds.w, bounds.h));

            return this.encode(region);
        }
        else
            throw new Error('Unknown question');
    }

    async getCellImage(questionId: string, disagregationIds: string[]): Promise<Buffer> {
        throw new Error('Not implemented.');
    }

    async getCellData(variableId: string, disagregationIds: string[]): Promise<CellValue> {
        return {value: NaN, confidence: 0};
    }


    private encode(image: cv.Mat): Promise<Buffer> {
        return cv.imencodeAsync('.jpg', image, [cv.IMWRITE_JPEG_QUALITY, 60]);
    }

            // // Compute regions from template
        // const regions = {};
        // for (let r in template.boundaries) {
        //     const { x, y, w, h, pageNo: boundaryPageNo } = template.boundaries[r];
        //     if (r === 'corner' || r === 'qr' || r.startsWith('aruco')) continue;
        //     if (Number.isFinite(boundaryPageNo) && pageNo !== boundaryPageNo) continue;
    
        //     regions[r] = { x: x * width, y: y * height, w: w * width, h: h * height };
        // }

    
}