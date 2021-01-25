import FormData from './form-data';
import { File, MetadataLoaderFn } from './types';

export default interface ExtractorPlugin {
    /**
     * List of mimeTypes supported by this plugin
     */
    mimeTypes: string[];

    process(metadataLoader: MetadataLoaderFn, file: File): AsyncGenerator<File | FormData>;
}
