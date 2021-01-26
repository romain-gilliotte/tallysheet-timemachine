import QuestionList from './question-list';
import { FormMetadata } from './types';

export default abstract class Form {
    protected _questionList: QuestionList;

    id: Buffer;

    get questionList(): QuestionList {
        return this._questionList;
    }

    abstract get mimeType(): string;

    constructor(questionList: QuestionList) {
        this._questionList = questionList;

        // Generate random ID
        this.id = Buffer.alloc(6);
        for (let i = 0; i < 6; ++i) {
            this.id[i] = 256 * Math.random();
        }
    }

    abstract generateOutput(): Promise<Buffer>;

    async generateMetadata(): Promise<FormMetadata> {
        return {
            questions: this.questionList.questions.map(q => ({
                id: q.id,
                disagregations: q.disagregations.map(d => ({
                    id: d.id,
                    elements: d.elements.map(e => e.id),
                })),
            })),
        };
    }
}
