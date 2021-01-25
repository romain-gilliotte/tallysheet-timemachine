import xl from 'excel4node';
import { TimeDimension } from 'olap-in-memory';
import { Disagregation, Form, QuestionList } from 'tallysheet-timemachine';
import TimeSlot from 'timeslot-dag';
import { CellAddr, ExcelMetadata } from './types';

export default class ExcelForm extends Form {
    protected wb: any;
    protected boundaries: Record<string, CellAddr[]>;

    get mimeType(): string {
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    }

    constructor(questionList: QuestionList) {
        super(questionList);

        this.boundaries = {};
        this.wb = new xl.Workbook();
        this.fillWorkbook();
    }

    async generateOutput(): Promise<Buffer> {
        return this.wb.writeToBuffer();
    }

    async generateMetadata(): Promise<ExcelMetadata> {
        // This method is actually synchronous, but might not be for other plugins.

        return this.questionList.questions.map(q => ({
            id: q.id,
            boundaries: this.boundaries[q.id],
            disagregations: q.disagregations.map(d => ({
                id: d.id,
                elements: d.elements.map(e => e.id),
            })),
        }));
    }

    getQuestionBoundaries(questionId: string): CellAddr {
        const boundaries = this.boundaries[questionId];
        return {
            sheet: boundaries[0].sheet,
            cell: `${boundaries[0].cell}:${boundaries[boundaries.length - 1].cell}`,
        };
    }

    getCellBoundaries(questionId: string, disagregationIds: string[]): CellAddr {
        const question = this.questionList.getQuestion(questionId);
        const index = disagregationIds.reduce((m: number, id: string, index: number) => {
            const elements = question.disagregations[index].elements;
            const elementIndex = elements.findIndex(e => e.id == disagregationIds[index]);
            return m * elements.length + elementIndex;
        }, 0);

        return this.boundaries[questionId][index];
    }

    private fillWorkbook(): void {
        this.wb.myStyles = {
            titleStyle: this.wb.createStyle({ font: { bold: true, size: 10 } }),
            tableStyle: this.wb.createStyle({
                font: { size: 10 },
                border: {
                    left: { style: 'thin', color: '#000000' },
                    right: { style: 'thin', color: '#000000' },
                    top: { style: 'thin', color: '#000000' },
                    bottom: { style: 'thin', color: '#000000' },
                },
            }),
        };

        const periods = new TimeDimension(
            'time',
            this.questionList.periodicity,
            this.questionList.start,
            this.questionList.end
        ).getItems();

        const ws = this.wb.addWorksheet('Data Entry');
        this.addMetadata(ws, periods);
        this.addHeader(ws, periods);
        this.addForm(ws);
    }

    private addMetadata(ws: any, periods: string[]): void {
        // Add metadata sheet
        const metadata = ws.wb.addWorksheet('Metadata', { hidden: true });
        metadata.cell(1, 1).number(this.questionList.sites.length);
        this.questionList.sites.forEach((site, index) => {
            metadata.cell(1 + index, 2).string(site.id);
            metadata.cell(1 + index, 3).string(site.name);
        });

        metadata.cell(1, 4).number(periods.length);
        periods.forEach((period: string, index: number) => {
            const ts = new TimeSlot(period);
            const start = ts.firstDate.toISOString().substring(0, 10);
            const end = ts.lastDate.toISOString().substring(0, 10);

            metadata.cell(1 + index, 5).string(period);
            metadata.cell(1 + index, 6).string(`${ts.humanizeValue()} (${start} -> ${end})`);
        });

        // Write form id, so that we can find it when importing
        this.boundaries['qr'] = [{ sheet: 'Metadata', cell: 'J1' }];
        metadata.cell(1, 10).string(this.id.toString('base64'));
    }

    private addHeader(ws: any, periods: string[]): void {
        const { titleStyle, tableStyle } = ws.wb.myStyles;

        // Add fields to enter site name, period, collected by
        this.boundaries['siteName'] = [{ sheet: 'Data Entry', cell: 'A2' }];
        ws.cell(1, 1, 1, 2, true).string('Collection site').style(titleStyle);
        ws.cell(2, 1, 2, 2, true).style(tableStyle);
        ws.addDataValidation({
            type: 'list',
            allowBlank: true,
            prompt: 'Choose from dropdown',
            error: 'Invalid choice was chosen',
            showDropDown: true,
            sqref: 'A2:B2',
            formulas: [`=Metadata!$C$1:$C$${1 + this.questionList.sites.length}`],
        });

        this.boundaries['periodName'] = [{ sheet: 'Data Entry', cell: 'D2' }];
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

        this.boundaries['collectedBy'] = [{ sheet: 'Data Entry', cell: 'G2' }];
        ws.cell(1, 7, 1, 8, true).string('Collected by').style(titleStyle);
        ws.cell(2, 7, 2, 8, true).style(tableStyle);
    }

    private addForm(ws: any): void {
        const { titleStyle, tableStyle } = ws.wb.myStyles;

        let currentRow = 4;
        for (let question of this.questionList.questions) {
            ws.cell(currentRow, 1, currentRow, 10, true).string(question.name).style(titleStyle);
            currentRow += 1;

            const tableStartRow = currentRow;
            const rowParts = question.disagregations.slice(0, question.distribution);
            const colParts = question.disagregations.slice(question.distribution);

            this.addTitlesOnTop(ws, colParts, currentRow, 1 + rowParts.length);
            currentRow += colParts.length;

            this.addTitlesOnLeft(ws, rowParts, currentRow, 1);
            currentRow += 2 + rowParts.reduce((m, d) => m * d.elements.length, 1);

            const tblWidth = rowParts.length + colParts.reduce((m, d) => m * d.elements.length, 1);
            const tblHeight = colParts.length + rowParts.reduce((m, d) => m * d.elements.length, 1);
            ws.cell(tableStartRow, 1, tableStartRow + tblHeight - 1, tblWidth).style(tableStyle);

            if (question.disagregations.length) {
                const dataWidth = tblWidth - rowParts.length;
                const numCells = question.disagregations.reduce(
                    (m: number, d: Disagregation) => m * d.elements.length,
                    1
                );

                this.boundaries[question.id] = new Array(numCells);
                for (let i = 0; i < numCells; ++i) {
                    const cell = xl.getExcelCellRef(
                        tableStartRow + colParts.length + Math.floor(i / dataWidth),
                        1 + rowParts.length + (i % dataWidth)
                    );

                    this.boundaries[question.id][i] = { sheet: 'Data Entry', cell };
                }
            } else {
                const cell = xl.getExcelCellRef(tableStartRow, 1);
                this.boundaries[question.id] = [{ sheet: 'Data Entry', cell }];
            }
        }
    }

    private addTitlesOnTop(
        ws: any,
        disagregations: Disagregation[],
        startRow: number,
        startCol: number,
        index: number = 0
    ): void {
        if (index == disagregations.length) return;

        const colspan = disagregations.slice(index + 1).reduce((m, d) => m * d.elements.length, 1);
        const elements = disagregations[index].elements;

        for (let [itemIndex, element] of elements.entries()) {
            const itemStartCol = startCol + itemIndex * colspan;
            const itemEndCol = itemStartCol + colspan - 1;

            let cells =
                colspan == 1
                    ? ws.cell(startRow, itemStartCol)
                    : ws.cell(startRow, itemStartCol, startRow, itemEndCol, true);

            cells.string(element.name);

            this.addTitlesOnTop(ws, disagregations, startRow + 1, itemStartCol, index + 1);
        }
    }

    private addTitlesOnLeft(
        ws: any,
        disagregations: Disagregation[],
        startRow: number,
        startCol: number,
        index: number = 0
    ): void {
        if (index == disagregations.length) return;

        const rowspan = disagregations.slice(index + 1).reduce((m, d) => m * d.elements.length, 1);
        const elements = disagregations[index].elements;

        for (let [itemIndex, element] of elements.entries()) {
            const itemStartRow = startRow + itemIndex * rowspan;
            const itemEndRow = itemStartRow + rowspan - 1;

            let cells =
                rowspan == 1
                    ? ws.cell(itemStartRow, startCol)
                    : ws.cell(itemStartRow, startCol, itemEndRow, startCol, true);

            cells.string(element.name);

            this.addTitlesOnLeft(ws, disagregations, itemStartRow, startCol + 1, index + 1);
        }
    }
}
