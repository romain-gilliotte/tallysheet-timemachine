import { ExtractorPlugin, File, FormData, MetadataLoaderFn } from 'tallysheet-timemachine';
import xlsx from 'xlsx';
import ExcelFormData from './form-data';
import { ExcelMetadata } from './types';

export default class ExcelExtractorPlugin implements ExtractorPlugin {
    mimeTypes: string[] = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];

    async *process(metadataLoader: MetadataLoaderFn, file: File): AsyncGenerator<FormData> {
        const ws = xlsx.read(file.data);

        const formId = Buffer.from(ws.Sheets['Metadata']['J1'].v, 'base64').toString('hex');
        const metadata = (await metadataLoader(formId)) as ExcelMetadata; // Perform runtime validation?

        yield new ExcelFormData(file, metadata, ws);
    }
}
