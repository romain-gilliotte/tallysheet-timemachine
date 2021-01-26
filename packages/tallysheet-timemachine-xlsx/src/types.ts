import { FormMetadata } from 'tallysheet-timemachine';

export type CellAddr = { sheet: string; cell: string };

export type ExcelMetadata = FormMetadata & {
    boundaries: CellAddr[][];
};
