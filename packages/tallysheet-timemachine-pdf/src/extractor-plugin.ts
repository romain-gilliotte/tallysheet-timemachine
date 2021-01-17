import gm from 'gm';
import { ExtractorPlugin, FormAntecedant, FormLoaderFn } from 'tallysheet-timemachine';
import { promisify } from 'util';

/**
 * Screenshot every page with ~200dpi and queue for image processing.
 * 
 * @see https://stackoverflow.com/questions/6605006/convert-pdf-to-image-with-high-resolution
 */
export default class PdfExtractorPlugin implements ExtractorPlugin {

    mimeTypes: string[] = ['application/pdf'];

    async* process(formLoader: FormLoaderFn, buffer: Buffer, mimeType?: string, filename?: string): AsyncGenerator<FormAntecedant> {
        const pdf = gm(buffer, 'file.pdf');

        const identify = promisify<gm.ImageInfo>(pdf.identify.bind(pdf));
        const toBuffer = promisify<string, Buffer>(pdf.toBuffer.bind(pdf));
    
        const information = await identify();
    
        // No more than 25 pages per PDF.
        const numPages = Math.min(
            25,
            Array.isArray(information.Format) ? information.Format.length : 1
        );
    
        for (let i = numPages - 1; i >= 0; --i) {
            pdf.selectFrame(i).in('-density', '140');
    
            yield {
                buffer: await toBuffer('JPG'),
                mimeType: 'image/jpeg',
                filename: `${filename?.slice(0, -4)} - page ${i + 1}.jpg`
            };
        }
    }
}
