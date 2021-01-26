import { Question, QuestionMetadata } from '.';
import { CellValue, File, FormMetadata } from './types';

export default abstract class FormData {
    readonly file: File;
    readonly metadata: FormMetadata;

    constructor(file: File, metadata: FormMetadata) {
        this.file = file;
        this.metadata = metadata;
    }

    async getData(): Promise<CellValue[][]> {
        
    }

    async getQuestionData(questionId: string): Promise<CellValue[]> {
        const question = this.metadata.questions.find(q => q.id == questionId);
        return this._getQuestionDataRec(question!, []);
    }

    private async _getQuestionDataRec(
        question: QuestionMetadata,
        elementIds: string[]
    ): Promise<CellValue[]> {
        if (question.disagregations.length === elementIds.length) {
            return [await this.getCellData(question.id, elementIds)];
        }

        const disagregation = question.disagregations[elementIds.length];
        const data = await Promise.all(
            disagregation.elements.map(id =>
                this._getQuestionDataRec(question, [...elementIds, id])
            )
        );

        return data.reduce<CellValue[]>((m, e) => [...m, ...e], []);
    }

    abstract getCellData(questionId: string, disagregationIds: string[]): Promise<CellValue>;
}
