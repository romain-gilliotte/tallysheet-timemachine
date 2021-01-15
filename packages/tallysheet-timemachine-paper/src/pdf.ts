const ArucoMarker = require('aruco-marker');
const PdfPrinter = require('pdfmake');
const LayoutBuilder = require('pdfmake/src/layoutBuilder');

const printer = new PdfPrinter({
    Roboto: {
        normal: 'node_modules/roboto-fontface/fonts/roboto/Roboto-Regular.woff',
        bold: 'node_modules/roboto-fontface/fonts/roboto/Roboto-Medium.woff',
    },
});

const strings = Object.freeze({
    fr: Object.freeze({
        collection_site: 'Lieu de collecte',
        covered_period: 'Période couverte',
        collected_by: 'Saisie par',
    }),
    en: Object.freeze({
        collection_site: 'Collection site',
        covered_period: 'Covered period',
        collected_by: 'Collected by',
    }),
    es: Object.freeze({
        collection_site: 'Lugar de colecta',
        covered_period: 'Periodo',
        collected_by: 'Rellenado por',
    }),
});

/**
 * Create a paper form from a datasource
 *
 * @param {Buffer} randomId
 * @param {any} dataSource
 * @param {'portrait'|'landscape'} orientation
 * @param {'en'|'es'|'fr'} language
 */
async function createPdf(randomId, dataSource, orientation, language) {
    const docDef = createDataSourceDocDef(randomId, dataSource, orientation, language);
    const [stream, boundaries] = createPdfStream(docDef);
    const buffer = await new Promise(resolve => {
        const buffers = [];
        stream.on('data', data => void buffers.push(data));
        stream.on('end', () => void resolve(Buffer.concat(buffers)));
    });

    return [buffer, boundaries];
}

/**
 * Retrieve the coordinates of all tables within a given paper form.
 *
 * This works by hooking pdfmake's templating engine, and running the generation
 * in order to steal the positions of the items of interest.
 *
 * We do this to be able to retrieve table locations to deal with uploads of form pictures / scans
 *
 * @returns {[PDFKit.PDFDocument, Array<{x: number, y: number, w: number, h: number}>]}
 */
function createPdfStream(docDef) {
    const boundaries = getFixedBoundaries(docDef.pageOrientation);
    const [W, H] = docDef.pageOrientation === 'portrait' ? [595.28, 841.89] : [841.89, 595.28];
    const WR = 1 / W; // "width ratio"
    const HR = 1 / H;
    const VAR_MARGIN_TOP = -20;
    const VAR_MARGIN_OTHER = 5;

    let baseY = Infinity; // We need the baseY to deal with the first table of page 2 and more.

    const hookedProcessNode = LayoutBuilder.prototype.processNode;
    LayoutBuilder.prototype.processNode = function (node) {
        let pageNo, x, y, w, h;

        if (node._varId) {
            // Save position before rendering table
            const position = this.writer.writer.getCurrentPositionOnPage();
            pageNo = position.pageNumber;
            x = position.left;
            y = position.top;

            if (y < baseY) {
                baseY = y; // Remember lowest y
            }
        }

        hookedProcessNode.apply(this, arguments);

        if (node._varId) {
            // Compare new position on document with previously saved one.
            // This will tell us where the table is.
            const position = this.writer.writer.getCurrentPositionOnPage();
            if (pageNo !== position.pageNumber) {
                pageNo = position.pageNumber;
                y = baseY;
            }

            w = position.pageInnerWidth;
            h = position.top - y;

            boundaries[node._varId] = {
                pageNo,
                x: (x - VAR_MARGIN_OTHER) * WR,
                y: (y - VAR_MARGIN_TOP) * HR, // variable labels have 15 margin on top
                w: (w + 2 * VAR_MARGIN_OTHER) * WR,
                h: (h + VAR_MARGIN_TOP + VAR_MARGIN_OTHER) * HR,
            };
        }
    };

    // Render pdf
    const stream = printer.createPdfKitDocument(docDef);
    stream.end(); // work around bug in pdfkit never ending the stream.

    // Restore pdfmake.
    LayoutBuilder.prototype.processNode = hookedProcessNode;

    return [stream, boundaries];
}

/**
 * Compute boundaries of elements which never move.
 * Instead of hooking pdfmake, we simply hardcode those.
 *
 * @param {'portrait'|'landscape'} orientation
 */
function getFixedBoundaries(orientation) {
    const [W, H] = orientation === 'portrait' ? [595.28, 841.89] : [841.89, 595.28];
    const WR = 1 / W;
    const HR = 1 / H;

    return {
        corner: { x: 0, y: 0, w: 1, h: 1 },
        qr: {
            x: (W - 20 - 84) * WR, // 84 = 4px * 21 modules
            y: 20 * HR,
            w: 84 * WR,
            h: 84 * HR,
        },
        'aruco-62': {
            x: 20 * WR,
            y: (H - 20 - 25) * HR,
            w: 25 * WR,
            h: 25 * HR,
        },
        'aruco-112': {
            x: 0.5 * (W - 25) * WR,
            y: (H - 20 - 25) * HR,
            w: 25 * WR,
            h: 25 * HR,
        },
        'aruco-207': {
            x: (W - 20 - 25) * WR,
            y: (H - 20 - 25) * HR,
            w: 25 * WR,
            h: 25 * HR,
        },
        site: {
            x: 20 * WR,
            y: 88 * HR,
            w: (orientation === 'portrait' ? 141 : 222) * WR,
            h: 16 * HR,
        },
        period: {
            x: (orientation === 'portrait' ? 170 : 252) * WR,
            y: 88 * HR,
            w: (orientation === 'portrait' ? 141 : 222) * WR,
            h: 16 * HR,
        },
        collectedBy: {
            x: (orientation === 'portrait' ? 320 : 485) * WR,
            y: 88 * HR,
            w: (orientation === 'portrait' ? 152 : 233) * WR,
            h: 16 * HR,
        },
    };
}

function createDataSourceDocDef(qrCode, dataSource, pageOrientation, language) {
    return {
        pageSize: 'A4',
        pageOrientation: pageOrientation,
        pageMargins: [20, 105, 20, 45],
        styles: {
            variableName: { fontSize: 10, bold: true, margin: [0, 10, 0, 5] },
            normal: { fontSize: 8, margin: [0, 0, 0, 0] },
        },
        header: (currentPage, pageCount) => ({
            margin: [20, 20, 20, 0],
            columns: [
                {
                    width: '*',
                    stack: [
                        {
                            text: dataSource.name,
                            fontSize: 22,
                            bold: true,
                            margin: [0, 0, 0, 0],
                        },
                        {
                            text: pageCount > 1 ? `${currentPage} / ${pageCount}` : ' ',
                            margin: [0, 0, 0, 2],
                        },
                        createMetadata(language),
                    ],
                },
                {
                    // Styling
                    width: 'auto',
                    margin: [20, 0, 0, 0],

                    // Version 1 (21x21) will be used with high ECC correction
                    // to ensure that we find it on crappy pictures.
                    qr: Buffer.concat([qrCode, Buffer.from([currentPage])]),
                    eccLevel: 'H',
                    mode: 'octet',

                    // This is approximative: the generator rounds each block size to be an integer
                    // number of pixels
                    fit: 90,
                },
            ],
        }),
        footer: {
            margin: [20, 0, 20, 0],
            columns: [
                {
                    alignment: 'left',
                    svg: new ArucoMarker(62).toSVG('25px'),
                },
                {
                    alignment: 'center',
                    svg: new ArucoMarker(112).toSVG('25px'),
                },
                {
                    alignment: 'right',
                    svg: new ArucoMarker(207).toSVG('25px'),
                },
            ],
        },
        content: [
            ...dataSource.elements.filter(variable => variable.active).map(createVariableDocDef),
        ],
    };
}

function createMetadata(language) {
    return {
        columns: [
            {
                stack: [
                    {
                        style: 'variableName',
                        text: strings[language].collection_site,
                    },
                    {
                        table: {
                            headerRows: 0,
                            widths: ['*'],
                            body: [[{ style: 'normal', text: ' ' }]],
                        },
                        margin: [0, 0, 10, 0],
                    },
                ],
            },
            {
                stack: [
                    {
                        style: 'variableName',
                        text: strings[language].covered_period,
                    },
                    {
                        table: {
                            headerRows: 0,
                            widths: ['*'],
                            body: [[{ style: 'normal', text: ' ' }]],
                        },
                        margin: [0, 0, 10, 0],
                    },
                ],
            },
            {
                stack: [
                    { style: 'variableName', text: strings[language].collected_by },
                    {
                        table: {
                            headerRows: 0,
                            widths: ['*'],
                            body: [[{ style: 'normal', text: ' ' }]],
                        },
                        margin: [0, 0, 0, 0],
                    },
                ],
            },
        ],
    };
}

// FIXME this is messy, rewrite with recursive functions like reporting-xlsx
// This should be 30 lignes of code
function createVariableDocDef(variable) {
    var body, widths;

    // remove inactive partitions and elements before generating layout
    var activePartitions = variable.partitions
        .filter(p => p.active)
        .map(p => ({
            ...p,
            elements: p.elements.filter(pe => pe.active),
        }));

    var colPartitions = activePartitions.slice(variable.distribution),
        rowPartitions = activePartitions.slice(0, variable.distribution);

    var topRows = makeTopRows(colPartitions),
        bodyRows = makeLeftCols(rowPartitions);

    if (!bodyRows.length) bodyRows.push([]);

    var dataColsPerRow = topRows.length ? topRows[0].length : 1;

    // Add empty data fields to bodyRows
    bodyRows.forEach(function (bodyRow) {
        for (var i = 0; i < dataColsPerRow; ++i) bodyRow.push({ text: ' ', style: 'normal' });
    });

    // Add empty field in the top-left corner for topRows
    topRows.forEach(function (topRow, index) {
        for (var i = 0; i < rowPartitions.length; ++i)
            topRow.unshift({
                text: { text: ' ', style: 'normal' },
                colSpan: i == rowPartitions.length - 1 ? rowPartitions.length : 1,
                rowSpan: index == 0 ? topRows.length : 1,
            });
    });

    body = topRows.concat(bodyRows);

    widths = [];
    for (var i = 0; i < rowPartitions.length; ++i) widths.push('auto');
    for (var j = 0; j < dataColsPerRow; ++j) widths.push('*');

    // Create stack with label and table.
    return {
        _varId: variable.id,
        _varName: variable.name,
        unbreakable: true,
        stack: [
            { style: 'variableName', text: variable.name },
            {
                table: {
                    headerRows: colPartitions.length,
                    dontBreakRows: true,
                    widths: widths,
                    body: [...topRows, ...bodyRows],
                },
            },
        ],
    };
}

function makeTopRows(partitions) {
    var totalCols = partitions.reduce(function (memo, tp) {
            return memo * tp.elements.length;
        }, 1),
        currentColSpan = totalCols;

    var body = [];

    // Create header rows for top partitions
    partitions.forEach(function (tp) {
        // Update currentColSpan
        currentColSpan /= tp.elements.length;

        // Create header row
        var row = [];

        // Add one field for each element in tp, with current colspan
        for (var colIndex = 0; colIndex < totalCols; ++colIndex) {
            // Add field
            var tpe = tp.elements[(colIndex / currentColSpan) % tp.elements.length];
            row.push({ colSpan: currentColSpan, style: 'normal', text: tpe.name });

            // Add as many fillers as the colSpan value - 1
            var colLimit = colIndex + currentColSpan - 1;
            for (; colIndex < colLimit; ++colIndex) row.push('');
        }

        // push to body
        body.push(row);
    });

    return body;
}

function makeLeftCols(partitions) {
    let rows = makeTopRows(partitions);

    if (rows.length === 0) return [];

    var result = new Array(rows[0].length);

    for (var x = 0; x < rows[0].length; ++x) {
        result[x] = new Array(rows.length);

        for (var y = 0; y < rows.length; ++y) {
            result[x][y] = JSON.parse(JSON.stringify(rows[y][x]));

            if (result[x][y].colSpan) {
                result[x][y].rowSpan = result[x][y].colSpan;
                delete result[x][y].colSpan;
            } else if (result[x][y].rowSpan) {
                result[x][y].colSpan = result[x][y].rowSpan;
                delete result[x][y].rowSpan;
            }
        }
    }

    return result;
}

module.exports = { createPdf, createDataSourceDocDef };
