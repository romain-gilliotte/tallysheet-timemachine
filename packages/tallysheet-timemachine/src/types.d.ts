
export type Site = { id: string; name: string; };
export type Variable = { id: string, name: string, partitions: Partition[] };
export type Partition = { id: string, name: string, elements: PartitionElement[] };
export type PartitionElement = { id: string; name: string; };
export type Orientation = 'portrait' | 'landscape';
export type Language = 'fr' | 'es' | 'en';

// export interface TallySheetRenderPlugin {
//     mimeTypes: string[];

//     render(options: Object): Promise<Uint8Array>;
// }

// export interface TallySheetImportPlugin {
//     mimeTypes: string[];

//     findTallySheets(buffer: Uint8Array, mimeType: string): AsyncIterator<ImportedTallySheet>;
// }
