import FormData from "./form-data";
import { FormDataAntecedant, MetadataLoaderFn } from "./types";

export default interface ExtractorPlugin {
    
    /**
     * List of mimeTypes supported by this plugin
     */
    mimeTypes: string[];

    process(metadataLoader: MetadataLoaderFn, buffer: Buffer, mimeType?: string, filename?: string): AsyncGenerator<FormDataAntecedant | FormData>;
}
