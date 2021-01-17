import xlsx from 'xlsx';
import { ExtractorPlugin, Form, FormData } from '../../tallysheet-timemachine/src';
import ExcelForm from './form';
import ExcelFormData from './form-data';

type FormLoaderFn = (id: string) => Promise<Form>;

export default class ExcelExtractorPlugin implements ExtractorPlugin {

    mimeTypes: string[] = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];

    async* process(formLoader: FormLoaderFn, buffer: Buffer, mimeType?: string): AsyncGenerator<FormData> {
        const ws = xlsx.read(buffer);

        const formId = Buffer.from(ws.Sheets['Metadata']['J1'].v, 'base64').toString('hex');
        const form = await formLoader(formId) as ExcelForm;
    
        yield new ExcelFormData(form, ws);
    }

}
