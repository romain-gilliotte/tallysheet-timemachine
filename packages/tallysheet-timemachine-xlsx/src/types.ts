export type CellAddr = { sheet: string; cell: string; };

export type DisagregationMetadata = { id: string, elements: string[] };

export type QuestionMetadata = {
    id: string,
    disagregations: DisagregationMetadata[],
    boundaries: CellAddr[]
};

export type ExcelMetadata = QuestionMetadata[];
