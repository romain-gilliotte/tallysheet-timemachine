import { Site, Question, Partition, PartitionElement } from "./types";

export default class QuestionList {

    static fromObject(obj: any): QuestionList {
        const { id, name, start, end, sites, variables } = obj;
        return new QuestionList(id, name, start, end, sites, variables);
    }

    id: string;
    name: string;
    start: Date;
    end: Date;
    sites: Site[];
    questions: Question[];
    periodicity: string;
    
    constructor(id: string, name: string, start: Date, end: Date, periodicity: string, sites: Site[] = [], variables: Question[] = []) {
        this.id = id;
        this.name = name;
        this.periodicity = periodicity;
        this.start = start;
        this.end = end;
        this.sites = sites;
        this.questions = variables;
    }

    addSite(id: string, name: string): void {
        this.sites.push({id, name});
    }

    addQuestion(id: string, name: string, distribution: number, partitions: Partition[] = []): void {
        this.questions.push({id, name, distribution, partitions});
    }

    addDisagregation(questionId: string, id: string, name: string, elements: PartitionElement[] = []): void {
        const variable = this.questions.find(v => v.id == questionId);

        if (variable)
            variable.partitions.push({id, name, elements});
        else
            throw new Error("Unknown variable");
    }

    addDisagregationElement(questionId: string, disagregationId: string, id: string, name: string): void {
        const variable = this.questions.find(v => v.id == questionId);
        const partition = variable?.partitions.find(p => p.id == disagregationId)

        if (partition)
           partition.elements.push({id, name});
        else
           throw new Error("Unknown partition");
    }

    toObject(): any {
        return Object.assign({}, this);
    }
}
