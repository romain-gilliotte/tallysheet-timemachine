const AdmZip = require('adm-zip');
const { Hash } = require('crypto');
const FileType = require('file-type');
const { InputOutput } = require('../../../io');

/**
 * @param {InputOutput} io
 * @param {any} upload
 */
async function processZipUpload(io, upload) {
    const zip = new AdmZip(upload.original.data.buffer);
    for (let entry of zip.getEntries()) {
        const buffer = entry.getData();

        // FIXME: guard against zip bombs!

        await queueFile(io, upload.projectId, entry.name, buffer);
    }

    return { $set: { status: 'hidden' } };
}

async function queueFile(io, projectId, filename, buffer) {
    let type = await FileType.fromBuffer(buffer);
    if (!type) {
        if (filename.endsWith('.pdf')) type = { mime: 'application/pdf' };
        if (filename.endsWith('.png')) type = { mime: 'image/png' };
        if (filename.endsWith('.jpg')) type = { mime: 'image/jpeg' };
        if (filename.endsWith('.tiff')) type = { mime: 'image/tiff' };
        if (filename.endsWith('.zip')) type = { mime: 'application/zip' };
        if (filename.endsWith('.xlsx'))
            type = { mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
    }

    if (!type) {
        // Skip the file if not in one of the supported types
        return;
    }

    try {
        const insertion = await io.database.collection('input_upload').insertOne({
            status: 'pending_processing',
            projectId: projectId,
            original: {
                sha1: new Hash('sha1').update(buffer).digest(),
                name: filename,
                size: buffer.byteLength,
                mimeType: type.mime,
                data: buffer,
            },
        });

        await io.queue.add(
            'process-upload',
            { uploadId: insertion.insertedId },
            { attempts: 1, removeOnComplete: true }
        );
    } catch (e) {
        if (!e.message.includes('duplicate key error')) {
            throw e;
        }
    }
}

module.exports = { processZipUpload };
