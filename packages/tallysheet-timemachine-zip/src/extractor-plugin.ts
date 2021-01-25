import AdmZip from 'adm-zip';
import { ExtractorPlugin, File, MetadataLoaderFn } from 'tallysheet-timemachine';

export default class ZipExtractorPlugin implements ExtractorPlugin {
    mimeTypes: string[] = ['application/zip'];

    async *process(metadataLoader: MetadataLoaderFn, file: File): AsyncGenerator<File> {
        const zip = new AdmZip(file.data);
        for (let entry of zip.getEntries()) {
            // FIXME: guard against zip bombs!

            yield { data: entry.getData(), filename: entry.name } as File;
        }
    }
}
