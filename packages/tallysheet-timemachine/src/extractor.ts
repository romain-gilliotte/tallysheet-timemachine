import FileType from 'file-type';
import ExtractorPlugin from './extractor-plugin';
import FormData from './form-data';
import { MetadataLoaderFn } from './types';

export default class FormDataExtractor {
    protected metadataLoader: MetadataLoaderFn;
    protected plugins: ExtractorPlugin[];

    constructor(plugins: ExtractorPlugin[], metadataLoader: MetadataLoaderFn) {
        this.plugins = plugins;
        this.metadataLoader = metadataLoader;
    }

    async *process(buffer: Buffer, mimeType?: string, filename?: string): AsyncGenerator<FormData> {
        const detectedMimeType = await this.guessMimetype(buffer, mimeType, filename);
        
        const plugin = this.plugins.find(p => p.mimeTypes.includes(detectedMimeType));
        if (plugin) {
            const results = plugin.process(this.metadataLoader, buffer, detectedMimeType, filename);

            for await (let result of results) {
                if (result instanceof FormData)
                    yield result;
                else
                    yield* this.process(result.buffer, result.mimeType, result.filename);
            }
        }
        else {
            console.log(`Skipping ${filename}: no handler registered for mimeType ${detectedMimeType}`);
        }
    }

    private async guessMimetype(buffer: Buffer, mimeType?: string, filename?: string): Promise<string> {
        if (mimeType)
            return mimeType;

        let type = await FileType.fromBuffer(buffer);
        if (type) {
            return type.mime;
        }
        
        if (filename) {
            if (filename.endsWith('.pdf')) 
                return 'application/pdf';
            if (filename.endsWith('.png')) 
                return 'image/png';
            if (filename.endsWith('.jpg')) 
                return 'image/jpeg';
            if (filename.endsWith('.tiff')) 
                return 'image/tiff';
            if (filename.endsWith('.zip')) 
                return 'application/zip';
            if (filename.endsWith('.xlsx'))
                return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        }
        
        throw new Error('Could not guess MimeType of buffer.');    
    }
}
