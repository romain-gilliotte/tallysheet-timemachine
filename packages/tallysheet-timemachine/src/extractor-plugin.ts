import Form from "./form";
import FormData from "./form-data";

export type FormLoaderFn = (id: string) => Promise<Form>;
export type FormAntecedant = { buffer: Buffer, mimeType?: string, filename?: string};

export default interface ExtractorPlugin {
    
    /**
     * List of mimeTypes supported by this plugin
     */
    mimeTypes: string[];

    /**
     * 
     * 
     * @param formLoader 
     * @param buffer 
     * @param mimeType 
     */
    process(formLoader: FormLoaderFn, buffer: Buffer, mimeType?: string, filename?: string): AsyncGenerator<FormAntecedant | FormData>;
}
