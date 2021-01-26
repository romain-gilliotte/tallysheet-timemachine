import { CellValue, File, FormData } from 'tallysheet-timemachine';
import xlsx from 'xlsx';
import { ExcelMetadata } from './types';

export default class ExcelFormData extends FormData {
    metadata: ExcelMetadata;
    ws: xlsx.WorkBook;

    constructor(file: File, metadata: ExcelMetadata, ws: xlsx.WorkBook) {
        super(file, metadata);

        this.metadata = metadata;
        this.ws = ws;
    }

    async getCellData(questionId: string, disagregationIds: string[]): Promise<CellValue> {
        
        const questionMetadata = this.metadata.questions.find(q => q.id == questionId);
        if (!questionMetadata) throw new Error('Invalid questionId');

        const index = disagregationIds.reduce((m: number, id: string, index: number) => {
            const elements = questionMetadata.disagregations[index].elements;
            const elementIndex = elements.indexOf(id);
            return m * elements.length + elementIndex;
        }, 0);

        const cellAddress = this.metadata.boundaries[questionMetadata.id];

        return {
            value: this.ws.Sheets[cellAddress.sheet][cellAddress.cell].v,
            confidence: 1,
        };
    }
}
