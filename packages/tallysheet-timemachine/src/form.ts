import QuestionList from "./question-list";

export default abstract class Form {
    protected _questionList: QuestionList;

    get questionList(): QuestionList {
        return this._questionList;
    }
    
    constructor(questionList: QuestionList) {
        this._questionList = questionList;
    }

    abstract export(): Promise<Buffer>;
    abstract toObject(): Object;

    protected generateRandomId(length: number): Buffer {
        const bytes = Buffer.alloc(length);

        for (let i = 0; i < length; ++i) {
            bytes[i] = 256 * Math.random();
        }

        return bytes;
    }

    protected cartesian<T>(arr: T[][]) {
        return arr.reduce(
            function (a, b) {
                return a
                    .map(function (x) {
                        return b.map(function (y) {
                            return x.concat([y]);
                        });
                    })
                    .reduce(function (a, b) {
                        return a.concat(b);
                    }, []);
            },
            [[]] as T[][]
        );
    }
}
