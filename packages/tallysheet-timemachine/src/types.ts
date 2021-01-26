// Question List
export type Site = { id: string; name: string };
export type Question = {
    id: string;
    name: string;
    distribution: number;
    disagregations: Disagregation[];
};
export type Disagregation = { id: string; name: string; elements: DisagregationElement[] };
export type DisagregationElement = { id: string; name: string };

// Metadata
export interface JsonMap {
    [member: string]: string | number | boolean | null | JsonArray | JsonMap;
}
export interface JsonArray extends Array<string | number | boolean | null | JsonArray | JsonMap> {}
export type Json = JsonMap | JsonArray | string | number | boolean | null;

export type DisagregationMetadata = { id: string; elements: string[] };

export type QuestionMetadata = {
    id: string;
    disagregations: DisagregationMetadata[];
};

export type FormMetadata = {
    questions: QuestionMetadata[];
};

// Others
export type MetadataLoaderFn = (id: string) => Promise<Json>;
export type CellValue = { value: number; confidence: number };

export type File = { data: Buffer; mimeType: string; filename: string };
