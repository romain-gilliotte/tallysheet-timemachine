import { Site, Question, Disagregation, DisagregationElement } from "./types";

export default class QuestionList {

    static fromObject(obj: any): QuestionList {
        const { title, name, start, end, sites, questions } = obj;
        return new QuestionList(title, name, start, end, sites, questions);
    }

    title: string;
    start: Date;
    end: Date;
    sites: Site[];
    questions: Question[];
    periodicity: string;
    
    constructor(title: string, start: Date, end: Date, periodicity: string, sites: Site[] = [], questions: Question[] = []) {
        this.title = title;
        this.periodicity = periodicity;
        this.start = start;
        this.end = end;
        this.sites = sites;
        this.questions = questions;
    }

    addSite(id: string, name: string): void {
        this.sites.push({id, name});
    }

    addQuestion(id: string, name: string, distribution: number, disagregations: Disagregation[] = []): void {
        this.questions.push({id, name, distribution, disagregations});
    }

    addDisagregation(questionId: string, id: string, name: string, elements: DisagregationElement[] = []): void {
        const question = this.questions.find(v => v.id == questionId);

        if (question)
            question.disagregations.push({id, name, elements});
        else
            throw new Error("Unknown question");
    }

    addDisagregationElement(questionId: string, disagregationId: string, id: string, name: string): void {
        const disagregation = this.questions
            .find(v => v.id == questionId)
            ?.disagregations
            ?.find(p => p.id == disagregationId);

        if (disagregation)
           disagregation.elements.push({id, name});
        else
           throw new Error("Unknown disagregation");
    }

    getQuestion(questionId: string): Question {
        const question = this.questions.find(q => q.id == questionId);
        if (question)
            return question;
        else
            throw new Error('Question not found.');
    }

    toObject(): any {
        return Object.assign({}, this);
    }
}
