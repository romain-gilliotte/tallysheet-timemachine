'use strict';

const assert = require('assert');
const { QuestionList, FormDataExtractor } = require('tallysheet-timemachine');
const { ExcelForm, ExcelExtractorPlugin } = require('../lib');

describe('tallysheet-timemachine-xlsx', () => {
    /** @type {ExcelForm} */
    const form;

    before(() => {
        const ql = new QuestionList("HMIS Extraction", '2010-01', '2012-02', 'month');
        ql.addQuestion('1', 'Number of medical consultations', 0);
        ql.addDisagregation('1', '1', 'Gender', [{ id: '1', name: 'Male'}, { id: '2', name: 'Female' }])
        
        form = new ExcelForm(ql);
    });

    it('needs tests', async () => {
        assert.deepStrictEqual(
            form.getCellBoundaries('1', ['1']),
            { sheet: 'Data Entry', cell: 'A6' }
        );
    });

    it('needs tests 2', async () => {
        const extractor = new FormDataExtractor(
            [new ExcelExtractorPlugin()],
            async _ => form.generateMetadata()
        );

        const buff = await form.generateOutput()
        for await (let page of extractor.process(buff)) {
            console.log(await page.getCellData('1', '1'))
        }
    });
});
