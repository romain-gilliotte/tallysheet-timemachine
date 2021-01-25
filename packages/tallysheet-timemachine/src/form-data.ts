import { CellValue, File } from './types';

export default abstract class FormData {
    readonly file: File;

    constructor(file: File) {
        this.file = file;
    }

    abstract getCellData(questionId: string, disagregationIds: string[]): Promise<CellValue>;
}
