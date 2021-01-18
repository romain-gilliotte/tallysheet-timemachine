
export type Site = { id: string; name: string; };
export type Question = { id: string, name: string, distribution: number, disagregations: Disagregation[] };
export type Disagregation = { id: string, name: string, elements: DisagregationElement[] };
export type DisagregationElement = { id: string; name: string; };
export type Orientation = 'portrait' | 'landscape';
export type Language = 'fr' | 'es' | 'en';

export interface JsonMap { [member: string]: string | number | boolean | null | JsonArray | JsonMap };
export interface JsonArray extends Array<string | number | boolean | null | JsonArray | JsonMap> {}
export type Json = JsonMap | JsonArray | string | number | boolean | null;

export type MetadataLoaderFn = (id: string) => Promise<Json>;
