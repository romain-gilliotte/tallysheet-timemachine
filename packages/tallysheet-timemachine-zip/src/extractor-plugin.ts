import AdmZip from 'adm-zip';
import { ExtractorPlugin, FormDataAntecedant, MetadataLoaderFn } from 'tallysheet-timemachine';

export default class ZipExtractorPlugin implements ExtractorPlugin {

    mimeTypes: string[] = ['application/zip'];

    async* process(metadataLoader: MetadataLoaderFn, buffer: Buffer, mimeType?: string, filename?: string): AsyncGenerator<FormDataAntecedant> {
        const zip = new AdmZip(buffer);
        for (let entry of zip.getEntries()) {
            const buffer = entry.getData();
    
            // FIXME: guard against zip bombs!

            yield { buffer: entry.getData(), filename: entry.name };
        }
    }
}
