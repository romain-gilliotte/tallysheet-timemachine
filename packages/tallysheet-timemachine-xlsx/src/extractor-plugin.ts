import { ExtractorPlugin, FormData, MetadataLoaderFn } from 'tallysheet-timemachine';
import xlsx from 'xlsx';
import ExcelFormData from './form-data';

export default class ExcelExtractorPlugin implements ExtractorPlugin {

    mimeTypes: string[] = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];

    async* process(metadataLoader: MetadataLoaderFn, buffer: Buffer, mimeType?: string): AsyncGenerator<FormData> {
        const ws = xlsx.read(buffer);

        const formId = Buffer.from(ws.Sheets['Metadata']['J1'].v, 'base64').toString('hex');
        const metadata = await metadataLoader(formId) as ExcelMetadata; // Perform runtime validation?

        yield new ExcelFormData(metadata, ws);
    }
}
