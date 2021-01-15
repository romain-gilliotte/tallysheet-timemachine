const xlsx = require('xlsx');
const _ = require('lodash');
const { InputOutput } = require('../../../io');

/**
 * @param {InputOutput} io
 * @param {any} upload
 */
async function processXlsxUpload(io, upload) {
    const ws = xlsx.read(upload.original.data.buffer);

    const templateId = Buffer.from(ws.Sheets['Metadata']['J1'].v, 'base64');
    const template = await io.database.collection('forms').findOne({ randomId: templateId });
    if (!template) {
        throw Error('Could not find associated form');
    }

    const extracted = {};
    for (let key in template.boundaries) {
        const addr = template.boundaries[key];
        if (ws.Sheets[addr.sheet] && ws.Sheets[addr.sheet][addr.cell])
            extracted[key] = ws.Sheets[addr.sheet][addr.cell].v;
    }

    for (let key of ['site', 'period']) {
        if (extracted[`${key}Name`]) {
            const cellName = _.findKey(ws.Sheets['Metadata'], c => c.v == extracted[`${key}Name`]);
            const { c, r } = xlsx.utils.decode_cell(cellName);
            const cellId = xlsx.utils.encode_cell({ c: c - 1, r: r });

            extracted[key] = ws.Sheets['Metadata'][cellId].v;
            delete extracted[`${key}Name`];
        }
    }

    return {
        $set: {
            status: 'pending_dataentry',
            processed: {
                dataSourceId: template.dataSourceId,
                extracted,
            },
        },
    };
}

module.exports = { processXlsxUpload };
