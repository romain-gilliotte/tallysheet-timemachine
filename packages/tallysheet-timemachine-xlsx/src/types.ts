declare module 'excel4node';
declare module 'olap-in-memory';

type CellAddr = { sheet: string; cell: string; };

type DisagregationMetadata = { id: string, elements: string[] };

type QuestionMetadata = {
    id: string,
    disagregations: DisagregationMetadata[],
    boundaries: CellAddr[]
};

type ExcelMetadata = QuestionMetadata[];
