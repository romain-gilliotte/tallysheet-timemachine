
export type Rect = {
    pageNo: number|null,
    x: number,
    y: number,
    w: number,
    h: number
};

export type DisagregationMetadata = { id: string, elements: string[] };

export type QuestionMetadata = {
    id: string,
    disagregations: DisagregationMetadata[],
    boundaries: Rect
};

export type PaperMetadata = {
    questions: QuestionMetadata[];
    orientation: Orientation
}

export type Orientation = 'portrait' | 'landscape';

export type Language = 'fr' | 'es' | 'en';
