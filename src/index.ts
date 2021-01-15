
type Site = { id: string; name: string; };
type Variable = { id: string, name: string, partitions: Partition[] };
type Partition = { id: string, name: string, elements: PartitionElement[] };
type PartitionElement = { id: string; name: string; };
type Orientation = 'portrait' | 'landscape';
type Language = 'fr' | 'es' | 'en';

class DataSource {
   
    id: string;
    name: string;
    start: Date;
    end: Date;
    sites: Site[];
    variables: Variable[];

    static fromObject(obj: any): DataSource {
        const { id, name, start, end, sites, variables } = obj;
        return new DataSource(id, name, start, end, sites, variables);
    }

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
        this.variables[variableId].push({id, name, elements});
    }

    addPartitionElement(variableId: string, partitionId: string, id: string, name: string): void {
        this.variables[variableId].partitions[partitionId].push({id, name});
    }

    toPaperFormTemplate(orientation: Orientation = 'portrait', language: Language = 'fr'): PaperFormTemplate {

    }

    toObject(): any {
        return Object.assign({}, this);
    }
}

class PaperFormTemplate {

    id: string;
    
    static fromObject(obj): PaperFormTemplate {

    }

    /**
     * 
     * @param {DataSource} dataSource 
     */
    constructor(dataSource) {
        this.dataSource = dataSource;
        this.ready = false;
    }

    /**
     * 
     * @returns {stream.ReadableStream}
     */
    async generatePdf(): Uint8Array {

    }

    processEntries(buffer, mimeType = null) {

    }

    toObject() {

    }
}

class FormFinder {

}

class FilledForm {




}


import fs from 'fs';
