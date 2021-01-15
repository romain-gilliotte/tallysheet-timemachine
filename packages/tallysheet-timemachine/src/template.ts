import { Site, Variable, Partition, PartitionElement } from "./types";

export default class Template {

    static fromObject(obj: any): Template {
        const { id, name, start, end, sites, variables } = obj;
        return new Template(id, name, start, end, sites, variables);
    }

    id: string;
    name: string;
    start: Date;
    end: Date;
    sites: Site[];
    variables: Variable[];

    constructor(id: string, name: string, start: Date, end: Date, sites: Site[] = [], variables: Variable[] = []) {
        this.id = id;
        this.name = name;
        this.start = start;
        this.end = end;
        this.sites = sites;
        this.variables = variables;
    }

    addSite(id: string, name: string): void {
        this.sites.push({id, name});
    }

    addVariable(id: string, name: string, partitions: Partition[] = []): void {
        this.variables.push({id, name, partitions});
    }

    addPartition(variableId: string, id: string, name: string, elements: PartitionElement[] = []): void {
        const variable = this.variables.find(v => v.id == variableId);

        if (variable)
            variable.partitions.push({id, name, elements});
        else
            throw new Error("Unknown variable");
    }

    addPartitionElement(variableId: string, partitionId: string, id: string, name: string): void {
        const variable = this.variables.find(v => v.id == variableId);
        const partition = variable?.partitions.find(p => p.id == partitionId)

        if (partition)
           partition.elements.push({id, name});
        else
           throw new Error("Unknown partition");
    }

    toObject(): any {
        return Object.assign({}, this);
    }
}
