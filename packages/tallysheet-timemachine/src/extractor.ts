import FileType from 'file-type';
import ExtractorPlugin from './extractor-plugin';
import Form from "./form";
import FormData from './form-data';

type FormLoaderFn = (id: string) => Promise<Form>;

export default class FormExtractor {
    protected formLoader: FormLoaderFn;
    protected plugins: ExtractorPlugin[];

    constructor(plugins: ExtractorPlugin[], formLoader: FormLoaderFn) {
        this.plugins = plugins;
        this.formLoader = formLoader;
    }

    async *process(buffer: Buffer, userMimeType?: string, filename?: string): AsyncGenerator<FormData> {
        const mimeType = await this.guessMimetype(buffer, userMimeType, filename);
        
        const plugin = this.plugins.find(p => p.mimeTypes.includes(mimeType));
        if (plugin) {
            const results = plugin.process(this.formLoader, buffer, mimeType, filename);

            for await (let result of results) {
                if (result instanceof FormData)
                    yield result;
                else
                    yield* this.process(result.buffer, result.mimeType, result.filename);
            }
        }
        else {
            console.log(`Skipping ${filename}: no handler registered for mimeType ${mimeType}`);
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
