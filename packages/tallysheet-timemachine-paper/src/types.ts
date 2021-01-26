import { FormMetadata } from 'tallysheet-timemachine';

export type Rect = {
    pageNo: number | null;
    x: number;
    y: number;
    w: number;
    h: number;
};

export type PaperMetadata = FormMetadata & {
    orientation: Orientation;
    boundaries: Rect[];
};

export type Orientation = 'portrait' | 'landscape';

export type Language = 'fr' | 'es' | 'en';
