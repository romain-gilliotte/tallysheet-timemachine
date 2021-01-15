# Tallysheet Time Machine

![Test suite](https://github.com/romain-gilliotte/tallysheet-timemachine/workflows/Test%20suite/badge.svg)
![npm bundle size](https://img.shields.io/bundlephobia/minzip/tallysheet-timemachine)
![NPM](https://img.shields.io/npm/l/tallysheet-timemachine)
![npm](https://img.shields.io/npm/v/tallysheet-timemachine)
![npm](https://img.shields.io/npm/dt/tallysheet-timemachine)

Tallysheet Time Machine brings back paper and Excel tallysheets from the past with some improvements!

It is a set of NodeJS library which enables generation and parsing/image recognition/OCR of paper and Excel tally sheets.

![Tallysheet photo](./data/readme/paper.jpeg)
![Excel screenshot](./data/readme/excel.png)

# Rationale behind the project

Tallysheet Time Machine was written as a companion library for [Monitool](https://github.com/romain-gilliotte/monitool), a full-featured open-source monitoring platform targeted at humanitarian organizations.

By reducing the amount of work needed to perform computer-less data collection, it aims to make the process easier on situations where online/offline form builders cannot be used, and paper and Excel are the only ways.

Other projects:
- None known
- ... PR to add yours!

# Milestones

Besides the OCR, which is not supported (only regions are extracted from Paper), Tallysheet Time Machine is already in production.

However, it was actually build as a module in Monitool, and needs to be extracted from the main repo: this library is a complete work in progress.

- [x] Extract page from background image, reproject it, and crop it to get variable data. 
- [x] Write README
- [x] Design public API as doc in the README
- [x] Move code from monitool as-is
- [ ] Remove dependencies to other Monitool code
- [ ] Port code to TypeScript
- [ ] Split into multiple packages (main, zip, xlsx, paper, ...)
- [ ] Make everything work again
- [ ] Write proper tests / improve testing dataset
- [ ] Use Mturk or similar to implement OCR feature
- [ ] Use dataset to generate proper OCR

# Installation

The module runs only in NodeJS as it depends on native NodeJS libraries.

Install only the modules you really need! 

This is specially true if you don't need the paper form support which depends on `opencv`. It will pull several hundred MB of files on your `node_packages` folder.

```console
$ npm install tallysheet-timemachine        # Mandatory
$ npm install tallysheet-timemachine-excel  # Excel support
$ npm install tallysheet-timemachine-paper  # Paper support
$ npm install tallysheet-timemachine-zip    # Zip file unpacking
```

Typescript autocompletion is supported. Once installed, the main class is available as the index of the package.

```javascript
import TallySheet from 'tallysheet-timemachine';      // ES6+
const TallySheet = require('tallysheet-timemachine'); // CommonJS
```

# Usage

## Form creation

Forms are created with the `TallySheet` class.
Convenience methods are available to add variables, partitions and elements.

```javascript
const ts = new TallySheet(123);
ts.addSite('1', 'Paris');
ts.addVariable('1', 'Number of consultations');
ts.addPartition('1', '1', 'Age');
ts.addPartitionElement('1', '1', '1', 'Under 12');
ts.addPartitionElement('1', '1', '2', '12 and more');

// Will generate the following tally sheet:
//                             ____________________
// Number of consultations    | Under 12 | Over 12 |
//                            |____xx____|____xx___|
```

They can also be imported from a POJO object

```javascript
const ts = TallySheet.fromObject({
    id: '1',
    sites: [{ id: '1', name: 'Paris' }],
    variables: [
        {
            id: '1',
            name: 'Number of consultations'
            partitions: [
                {
                    id: '1',
                    name: 'Age'
                    elements: [{id: '1', name: 'Under 12'}, { id: '2', name: '12 and more'}]
                }
            ]
        }
    ]
})
```

## File Generation

Once a `TallySheet` is created, multiple `Template`s can be derived, for each file format and option.

```javascript
// Create template
const template = ts.createTemplate('pdf', { orientation: 'portrait', language: 'fr' });
// [or] ts.render('pdf', { orientation: 'landscape', language: 'en' });
// [or] ts.render('xlsx', { language: 'en' });
// [or] ...

fs.writeFileSync('form.pdf', await template.render());
```

The `Template`s instances contain metadata: they must be serialized and kept to be able to perform later image recognition/parsing once the form is filled.

```javascript
const metadata = JSON.stringify(template.toObject());
fs.writeFileSync(`formMetadata-${template.id}.json`, metadata);
```

## Parsing / Image recognition

```javascript
// Extract filled forms from zip files, images or pdf.
const zip = fs.readFileSync('./stackOfFormsPhotosAndExcel.zip');

for await (let page of TallySheet.findForms(zip)) {
    // The identifier of the template and the page number are stored in the form
    // (either in the QR-code or in hidden data in the Excel files).
    page.type;       // "paper" or "excel"
    page.templateId; // Reference to the template, which helps us perform the OCR.
    page.pageNo;     // Always 1 for Excel, can be any number for multipage paper forms.

    // With the template which generated the form, let's extract the data
    // (You are responsible for storing the template somewhere).
    const templateFile = fs.readFileSync(`formMetadata-${page.templateId}.json`);
    const template = PaperFormTemplate.fromObject(JSON.parse(templateFile));
    const entry = await template.processEntry(page);

    // Access a reprojected image (only for paperforms) or the data directly (only for excel).
    entry.getImage(); // => Buffer containing the reprojected image.
    entry.getData();  // => { [variableId]: [1, 2, 3, 4, ...] }
    
    // We can also iterate variables
    for (let variable of entry.getVariables()) {
        // Get the boundaries of the corresponding variable data.
        entry.getVariableBoundaries(variable.id);

        // Same as getImage() and getData() for a given variable.
        entry.getVariableImage(variable.id); // Get a cropped image of the variable data
        entry.getVariableData(variable.id);  // Get the actual data
    }
}
```
