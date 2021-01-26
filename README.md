WARNING: THIS LIBRARY IS A WORK IN PROGRESS, AND IT NOT PUBLISHED IN NPM YET.

# Tallysheet Time Machine

<!-- ![Test suite](https://github.com/romain-gilliotte/tallysheet-timemachine/workflows/Test%20suite/badge.svg)
![npm bundle size](https://img.shields.io/bundlephobia/minzip/tallysheet-timemachine)
![NPM](https://img.shields.io/npm/l/tallysheet-timemachine)
![npm](https://img.shields.io/npm/v/tallysheet-timemachine)
![npm](https://img.shields.io/npm/dt/tallysheet-timemachine) -->

Tallysheet Time Machine brings back paper and Excel tallysheets from the past with some improvements!

It is a set of NodeJS library which enables generation and parsing/image recognition/OCR of paper and Excel tally sheets.

![Tallysheet photo](./data/readme/paper.jpeg)
![Excel screenshot](./data/readme/excel.png)

# Rationale behind the project

Tallysheet Time Machine was written as a companion library for [Monitool](https://github.com/romain-gilliotte/monitool), a full-featured open-source monitoring platform targeted at humanitarian organizations.

By reducing the amount of work needed to perform computer-less data collection, it aims to make the process easier on situations where online/offline form builders cannot be used, and paper and Excel are the only ways.

# Installation

The module runs only in NodeJS as it depends on native NodeJS libraries.

Install only the modules you really need!

This is specially true if you don't need the paper form support which depends on `opencv`. It will pull several hundred MB of files on your `node_packages` folder.

If using containers, a smaller footprint can be achieved by installing only used bits of `opencv`. A [sampler Dockerfile](./data/readme/Dockerfile) is available for that purpose.

```console
$ npm install tallysheet-timemachine
$ npm install tallysheet-timemachine-excel  # Excel support
$ npm install tallysheet-timemachine-paper  # Paper support
$ npm install tallysheet-timemachine-zip    # Zip file unpacking
$ npm install tallysheet-timemachine-pdf    # PDF file unpacking
```

The project is written in Typescript, autocompletion is supported.

```javascript
// Form generation
import { QuestionList } from 'tallysheet-timemachine';
import { PaperForm } from 'tallysheet-timemachine-paper';
import { ExcelForm } from 'tallysheet-timemachine-xlsx';

// Form parsing / image recognition
import { FormDataExtractor } from 'tallysheet-timemachine';
import { PdfExtractorPlugin } from 'tallysheet-timemachine-pdf';
import { ExcelExtractorPlugin, ExcelFormData } from 'tallysheet-timemachine-xlsx';
import { PaperExtractorPlugin, PaperFormData } from 'tallysheet-timemachine-paper';
import { ZipExtractorPlugin } from 'tallysheet-timemachine-zip';
```

# Usage

## Form creation

Forms are created with the `TallySheet` class.
Convenience methods are available to add questions, disagregations and elements.

```javascript
const questionList = new QuestionList('ql1');
questionList.addSite('s1', 'Paris');
questionList.addQuestion('q1', 'Number of consultations');
questionList.addDisagregation('q1', 'd1', 'Age');
questionList.addDisagregationElement('q1', 'd1', 'de1', 'Under 12');
questionList.addDisagregationElement('q1', 'd1', 'de2', '12 and more');

// Will generate the following tally sheet:
//                             ____________________
// Number of consultations    | Under 12 | Over 12 |
//                            |____xx____|____xx___|
```

They can also be imported from a POJO object

```javascript
const questionList = QuestionList.fromObject({
    id: 'ql1',
    sites: [{ id: 's1', name: 'Paris' }],
    questions: [
        {
            id: 'q1',
            name: 'Number of consultations'
            disagregations: [
                {
                    id: 'd1',
                    name: 'Age'
                    elements: [{id: 'de1', name: 'Under 12'}, { id: 'de2', name: '12 and more'}]
                }
            ]
        }
    ]
})
```

## File Generation

Once a `QuestionList` is created, multiple `Form` can be derived, depending on file format and chosen options.

The `Form` instances contain metadata which must be saved to a file or database to enable later image recognition / Excel parsing once the form is filled.

```javascript
// Create template
const form = new PaperForm(questionList, { orientation: 'portrait', language: 'fr' });
// [or] new PaperForm(questionList, { orientation: 'landscape', language: 'en' });
// [or] new ExcelForm(questionList, { language: 'en' });
// [or] ...

await form.generateOutput(); // Buffer containing form (pdf, xlsx)
await form.generateMetadata(); // JSON serializable blob that will be needed later on
```

## Parsing / Image recognition

```javascript
const extractor = new FormExtractor(
    // Loaded plugins
    [
        new PdfFormExtractor(),
        new ImageFormExtractor(),
        new XlsxFormExtractor(),
        new ZipFormExtractor(),
    ],

    // Form loader (you are responsible for storing the metadata between generation and data extraction)
    formId => {
        const templateFile = fs.readFileSync(`formMetadata-${page.formId}.json`);
        const template = PaperFormTemplate.fromObject(JSON.parse(templateFile));
        return template;
    }
);

// Load file and search forms inside it.
const zip = fs.readFileSync('./stackOfFormsPhotosAndExcel.zip');

for await (let formData of extractor.process(zip)) {
    // Access a reprojected image (only for paperforms) or the data directly (only for excel).
    formData.getImage(); // => Buffer containing the reprojected image.
    formData.getData(); // => { [questionId]: [1, 2, 3, 4, ...] }

    // We can also iterate questions
    for (let variable of formData.getVariables()) {
        // Get the boundaries of the corresponding variable data.
        formData.getVariableBoundaries(variable.id);

        // Same as getImage() and getData() for a given variable.
        formData.getVariableImage(variable.id); // Get a cropped image of the variable data
        formData.getVariableData(variable.id); // Get the actual data
    }
}
```
