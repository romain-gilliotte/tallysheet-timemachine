const xl = require('excel4node');
const { TimeDimension } = require('olap-in-memory');
const TimeSlot = require('timeslot-dag');

async function createXlsx(id, start, end, sites, dataSource) {
    const [wb, boundaries] = getWorkbook(id, start, end, sites, dataSource);
    return [await wb.writeToBuffer(), boundaries];
}

function getWorkbook(id, start, end, sites, dataSource) {
    const boundaries = {};
    const wb = new xl.Workbook();

    wb.myStyles = {
        titleStyle: wb.createStyle({ font: { bold: true, size: 10 } }),
        tableStyle: wb.createStyle({
            font: { size: 10 },
            border: {
                left: { style: 'thin', color: '#000000' },
                right: { style: 'thin', color: '#000000' },
                top: { style: 'thin', color: '#000000' },
                bottom: { style: 'thin', color: '#000000' },
            },
        }),
    };

    const ws = wb.addWorksheet('Data Entry');

    addMetadata(ws, boundaries, id, start, end, sites, dataSource);
    addForm(ws, boundaries, dataSource);

    return [wb, boundaries];
}

function addMetadata(ws, boundaries, id, start, end, sites, dataSource) {
    const { titleStyle, tableStyle } = ws.wb.myStyles;

    // Add metadata sheet
    const metadata = ws.wb.addWorksheet('Metadata', { hidden: true });
    const activeSites = sites.filter(site => dataSource.entities.includes(site.id) && site.active);
    metadata.cell(1, 1).number(activeSites.length);
    activeSites.forEach((site, index) => {
        metadata.cell(1 + index, 2).string(site.id);
        metadata.cell(1 + index, 3).string(site.name);
    });

    const periods = new TimeDimension('time', dataSource.periodicity, start, end).getItems();
    metadata.cell(1, 4).number(periods.length);
    periods.forEach((period, index) => {
        const ts = new TimeSlot(period);
        const start = ts.firstDate.toISOString().substring(0, 10);
        const end = ts.lastDate.toISOString().substring(0, 10);

        metadata.cell(1 + index, 5).string(period);
        metadata.cell(1 + index, 6).string(`${ts.humanizeValue()} (${start} -> ${end})`);
    });

    // Write form id, so that we can find it when importing
    boundaries['qr'] = { sheet: 'Metadata', cell: 'J1' };
    metadata.cell(1, 10).string(id.toString('base64'));

    // Add fields to enter site name, period, collected by
    boundaries['siteName'] = { sheet: 'Data Entry', cell: 'A2' };
    ws.cell(1, 1, 1, 2, true).string('Collection site').style(titleStyle);
    ws.cell(2, 1, 2, 2, true).style(tableStyle);
    ws.addDataValidation({
        type: 'list',
        allowBlank: true,
        prompt: 'Choose from dropdown',
        error: 'Invalid choice was chosen',
        showDropDown: true,
        sqref: 'A2:B2',
        formulas: [`=Metadata!$C$1:$C$${1 + activeSites.length}`],
    });

    boundaries['periodName'] = { sheet: 'Data Entry', cell: 'D2' };
    ws.cell(1, 4, 1, 5, true).string('Covered period').style(titleStyle);
    ws.cell(2, 4, 2, 5, true).style(tableStyle);
    ws.addDataValidation({
        type: 'list',
        allowBlank: true,
        prompt: 'Choose from dropdown',
        error: 'Invalid choice was chosen',
        showDropDown: true,
        sqref: 'D2:E2',
        formulas: [`=Metadata!$F$1:$F$${1 + periods.length}`],
    });

    boundaries['collectedBy'] = { sheet: 'Metadata', cell: 'G2' };
    ws.cell(1, 7, 1, 8, true).string('Collected by').style(titleStyle);
    ws.cell(2, 7, 2, 8, true).style(tableStyle);
}

function addForm(ws, boundaries, dataSource) {
    const { titleStyle, tableStyle } = ws.wb.myStyles;

    let currentRow = 4;
    for (let variable of dataSource.elements) {
        ws.cell(currentRow, 1, currentRow, 10, true).string(variable.name).style(titleStyle);
        currentRow += 1;

        const tableStartRow = currentRow;
        const rowParts = variable.partitions.slice(0, variable.distribution);
        const colParts = variable.partitions.slice(variable.distribution);

        addTitlesOnTop(ws, colParts, currentRow, 1 + rowParts.length);
        currentRow += colParts.length;

        addTitlesOnLeft(ws, rowParts, currentRow, 1);
        currentRow += 2 + rowParts.reduce((m, d) => m * d.elements.length, 1);

        const tblWidth = rowParts.length + colParts.reduce((m, d) => m * d.elements.length, 1);
        const tblHeight = colParts.length + rowParts.reduce((m, d) => m * d.elements.length, 1);
        ws.cell(tableStartRow, 1, tableStartRow + tblHeight - 1, tblWidth).style(tableStyle);

        if (variable.partitions.length) {
            const els = cartesian(variable.partitions.map(p => p.elements.map(e => e.id)));
            const dataWidth = tblWidth - rowParts.length;
            for (let i = 0; i < els.length; ++i) {
                const key = els[i].reduce(
                    (m, el, i) => m + `[${variable.partitions[i].id}=${el}]`,
                    variable.id
                );

                boundaries[key] = {
                    sheet: 'Data Entry',
                    cell: xl.getExcelCellRef(
                        tableStartRow + colParts.length + Math.floor(i / dataWidth),
                        1 + rowParts.length + (i % dataWidth)
                    ),
                };
            }
        } else {
            boundaries[variable.id] = {
                sheet: 'Data Entry',
                cell: xl.getExcelCellRef(tableStartRow, 1),
            };
        }
    }
}

function addTitlesOnTop(ws, partitions, startRow, startCol, index = 0) {
    if (index == partitions.length) return;

    const colspan = partitions.slice(index + 1).reduce((m, d) => m * d.elements.length, 1);
    const elements = partitions[index].elements;

    for (let [itemIndex, element] of elements.entries()) {
        const itemStartCol = startCol + itemIndex * colspan;
        const itemEndCol = itemStartCol + colspan - 1;

        let cells =
            colspan == 1
                ? ws.cell(startRow, itemStartCol)
                : ws.cell(startRow, itemStartCol, startRow, itemEndCol, true);

        cells.string(element.name);

        addTitlesOnTop(ws, partitions, startRow + 1, itemStartCol, index + 1);
    }
}

function addTitlesOnLeft(ws, partitions, startRow, startCol, index = 0) {
    if (index == partitions.length) return;

    const rowspan = partitions.slice(index + 1).reduce((m, d) => m * d.elements.length, 1);
    const elements = partitions[index].elements;

    for (let [itemIndex, element] of elements.entries()) {
        const itemStartRow = startRow + itemIndex * rowspan;
        const itemEndRow = itemStartRow + rowspan - 1;

        let cells =
            rowspan == 1
                ? ws.cell(itemStartRow, startCol)
                : ws.cell(itemStartRow, startCol, itemEndRow, startCol, true);

        cells.string(element.name);

        addTitlesOnLeft(ws, partitions, itemStartRow, startCol + 1, index + 1);
    }
}

function cartesian(arr) {
    return arr.reduce(
        function (a, b) {
            return a
                .map(function (x) {
                    return b.map(function (y) {
                        return x.concat([y]);
                    });
                })
                .reduce(function (a, b) {
                    return a.concat(b);
                }, []);
        },
        [[]]
    );
}

module.exports = { createXlsx };
