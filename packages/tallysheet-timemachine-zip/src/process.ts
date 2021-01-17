import AdmZip from 'adm-zip';
import { ExtractorPlugin, FormAntecedant, FormLoaderFn } from 'tallysheet-timemachine';

export default class ZipExtractorPlugin implements ExtractorPlugin {

    mimeTypes: string[] = ['application/zip'];

    async* process(formLoader: FormLoaderFn, buffer: Buffer, mimeType?: string, filename?: string): AsyncGenerator<FormAntecedant> {
        const zip = new AdmZip(buffer);
        for (let entry of zip.getEntries()) {
            const buffer = entry.getData();
    
            // FIXME: guard against zip bombs!

            yield { buffer: entry.getData(), filename: entry.name };
        }
    }
}
