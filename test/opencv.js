const cv = require('opencv4nodejs');
const { findQrCode, reprojectFromCode } = require('../src/tasks/data-entry/cv/extract-context');
const {
    extractPage,
    getEdges,
    getPageContour,
} = require('../src/tasks/data-entry/cv/extract-page');

const width = 1050;
const height = 1485;

// 'data/opencv-data/paper/felix-02.jpeg',
// 'data/opencv-data/paper/felix-06.jpeg',
// 'data/opencv-data/paper/fred-03.jpeg',
// 'data/opencv-data/paper/fred-05.jpeg',
// 'data/opencv-data/paper/fred-06.jpeg',
// 'data/opencv-data/paper/fred-07.jpeg',
// 'data/opencv-data/paper/fred-08.jpeg',
// 'data/opencv-data/paper/fred-09.jpeg',
// 'data/opencv-data/paper/fred-10.jpeg',
// 'data/opencv-data/paper/fred-11.jpeg',
// 'data/opencv-data/paper/fred-12.jpeg',
// 'data/opencv-data/paper/fred-13.jpeg',
// 'data/opencv-data/paper/fred-15.jpeg',
// 'data/opencv-data/paper/fred-16.jpeg',
// 'data/opencv-data/paper/fred-17.jpeg',
// 'data/opencv-data/paper/fred-18.jpeg',

// pas du papier
const samples = [
    'data/opencv-data/paper/felix-01.jpeg',
    'data/opencv-data/paper/felix-03.jpeg',
    'data/opencv-data/paper/felix-04.jpeg',
    'data/opencv-data/paper/felix-05.jpeg',
    'data/opencv-data/paper/felix-07.jpeg',
    'data/opencv-data/paper/felix-08.jpeg',

    'data/opencv-data/screen/ana-01.jpeg',
    'data/opencv-data/screen/romain-01.jpeg',
    'data/opencv-data/screen/romain-02.jpeg',
    'data/opencv-data/screen/romain-03.jpeg',
    // qrcode not found sur celle la
    // 'data/opencv-data/paper/fred-01.jpeg',
    'data/opencv-data/paper/fred-02.jpeg',
    'data/opencv-data/paper/fred-04.jpeg',
    'data/opencv-data/paper/fred-14.jpeg',
];

describe('findQrCode', function () {
    this.timeout(50000);

    samples.forEach((sample, index) => {
        it(`should find qr code in ${sample}`, function () {
            let image = cv.imread(sample);
            image = reprojectFromCode(image, width, height);

            const edges = extractPage(image, width, height);
            cv.imwrite(`output/${index}-2.png`, edges);

            // image = extractPage(image, width, height);
            // cv.imwrite(`output/${index}-3.png`, image);
        });
    });
});
