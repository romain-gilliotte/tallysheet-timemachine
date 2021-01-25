import FileType, { mimeTypes } from 'file-type';
import ExtractorPlugin from './extractor-plugin';
import FormData from './form-data';
import { File, MetadataLoaderFn } from './types';

const mimeExtensions: Record<string, string> = {
    'application/pdf': 'pdf',
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/tiff': 'tiff',
    'application/zip': 'zip',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
};

export default class FormDataExtractor {
    protected metadataLoader: MetadataLoaderFn;
    protected plugins: ExtractorPlugin[];

    constructor(plugins: ExtractorPlugin[], metadataLoader: MetadataLoaderFn) {
        this.plugins = plugins;
        this.metadataLoader = metadataLoader;
    }

    async *process(
        data: Buffer,
        mimeType?: string,
        filename?: string
    ): AsyncGenerator<FormData, void, void> {
        const file = await this.getFile(data, mimeType, filename);

        const plugin = this.plugins.find(p => p.mimeTypes.includes(file.mimeType));
        if (plugin) {
            const results = plugin.process(this.metadataLoader, file);

            for await (let result of results) {
                if (result instanceof FormData) yield result;
                else yield* this.process(file.data, file.mimeType, file.filename);
            }
        } else {
            console.log(
                `Skipping ${filename}: no handler registered for mimeType ${file.mimeType}`
            );
        }
    }

    private async getFile(data: Buffer, mimeType?: string, filename?: string): Promise<File> {
        if (!mimeType) {
            let type = await FileType.fromBuffer(data);

            if (type) {
                mimeType = type.mime;
                filename = filename || `file.${type.ext}`;
            } else if (filename?.endsWith('.pdf')) {
                mimeType = 'application/pdf';
            } else if (filename?.endsWith('.png')) {
                mimeType = 'image/png';
            } else if (filename?.endsWith('.jpg')) {
                mimeType = 'image/jpeg';
            } else if (filename?.endsWith('.tiff')) {
                mimeType = 'image/tiff';
            } else if (filename?.endsWith('.zip')) {
                mimeType = 'application/zip';
            } else if (filename?.endsWith('.xlsx')) {
                mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            } else {
                throw new Error('Could not guess MimeType of buffer.');
            }
        }

        if (!filename) {
            const ext = mimeExtensions[mimeType];
            filename = `file.${ext}`;
        }

        return { data, mimeType, filename };
    }
}
