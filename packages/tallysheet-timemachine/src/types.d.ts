import Form from "./form";

export type Site = { id: string; name: string; };
export type Question = { id: string, name: string, distribution: number, partitions: Partition[] };
export type Partition = { id: string, name: string, elements: PartitionElement[] };
export type PartitionElement = { id: string; name: string; };
export type Orientation = 'portrait' | 'landscape';
export type Language = 'fr' | 'es' | 'en';
export type FormLoaderFn = (id: string) => Promise<Form>;
