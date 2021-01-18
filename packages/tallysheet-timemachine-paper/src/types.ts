declare module 'aruco-marker';
declare module 'js-aruco';
declare module 'pdfmake/src/layoutBuilder';

type Rect = {
    pageNo: number|null,
    x: number,
    y: number,
    w: number,
    h: number
};

type DisagregationMetadata = { id: string, elements: string[] };

type QuestionMetadata = {
    id: string,
    disagregations: DisagregationMetadata[],
    boundaries: Rect
};

type PaperMetadata = {
    questions: QuestionMetadata[];
    orientation: Orientation
}

type Orientation = 'portrait' | 'landscape';
