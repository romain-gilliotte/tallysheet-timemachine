import xl from 'excel4node';
import { TimeDimension } from 'olap-in-memory';
import TimeSlot from 'timeslot-dag';
import { Form } from "../../tallysheet-timemachine/src";
import { Partition } from '../../tallysheet-timemachine/src/types';

type ExcelRect = {sheet: string, tl: string, br: string};

export default class ExcelForm extends Form {

    protected ready: boolean = false;
    protected xlsxFile: Buffer | null = null;
    protected boundaries: Record<string, ExcelRect> = {};

    async getVariableBoundaries(variableId: string): Promise<ExcelRect> {
        await this.generate();

        const tlRect = this.boundaries[variableId];
        const brRect = this.boundaries[variableId];

        return {sheet: tlRect.sheet, tl: tlRect.tl, br: brRect.br};
    }

    async getCellBoundaries(variableId: string, partitionIds: string[]): Promise<ExcelRect> {
        await this.generate();
        return this.boundaries[`${variableId}${partitionIds.join('')}`];
    }

    async export(): Promise<Buffer> {
        await this.generate();
        return this.xlsxFile!;
    }
    
    private async generate(): Promise<void> {
        if (this.ready)
            return;
        
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

        this.addMetadata(ws);
        this.addForm(ws);
        this.ready = true;
    }

    private addMetadata(ws: any): void {
        const { titleStyle, tableStyle } = ws.wb.myStyles;

        // Add metadata sheet
        const metadata = ws.wb.addWorksheet('Metadata', { hidden: true });
        metadata.cell(1, 1).number(this.questionList.sites.length);
        this.questionList.sites.forEach((site, index) => {
            metadata.cell(1 + index, 2).string(site.id);
            metadata.cell(1 + index, 3).string(site.name);
        });

        const periods = new TimeDimension(
            'time',
            this.questionList.periodicity, 
            this.questionList.start, 
            this.questionList.end
        ).getItems();

        metadata.cell(1, 4).number(periods.length);
        periods.forEach((period: string, index: number) => {
            const ts = new TimeSlot(period);
            const start = ts.firstDate.toISOString().substring(0, 10);
            const end = ts.lastDate.toISOString().substring(0, 10);

            metadata.cell(1 + index, 5).string(period);
            metadata.cell(1 + index, 6).string(`${ts.humanizeValue()} (${start} -> ${end})`);
        });

        // Write form id, so that we can find it when importing
        this.boundaries['qr'] = { sheet: 'Metadata', tl: 'J1', br: 'J1' };
        metadata.cell(1, 10).string(id.toString('base64'));

        // Add fields to enter site name, period, collected by
        this.boundaries['siteName'] = { sheet: 'Data Entry', tl: 'A2', br: 'A2' };
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

        this.boundaries['periodName'] = { sheet: 'Data Entry', tl: 'D2', br: 'D2' };
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

        this.boundaries['collectedBy'] = { sheet: 'Metadata', tl: 'G2', br: 'G2' };
        ws.cell(1, 7, 1, 8, true).string('Collected by').style(titleStyle);
        ws.cell(2, 7, 2, 8, true).style(tableStyle);
    }

    private addForm(ws: any): void {
        const { titleStyle, tableStyle } = ws.wb.myStyles;

        let currentRow = 4;
        for (let variable of this.questionList.questions) {
            ws.cell(currentRow, 1, currentRow, 10, true).string(variable.name).style(titleStyle);
            currentRow += 1;

            const tableStartRow = currentRow;
            const rowParts = variable.partitions.slice(0, variable.distribution);
            const colParts = variable.partitions.slice(variable.distribution);

            this.addTitlesOnTop(ws, colParts, currentRow, 1 + rowParts.length);
            currentRow += colParts.length;

            this.addTitlesOnLeft(ws, rowParts, currentRow, 1);
            currentRow += 2 + rowParts.reduce((m, d) => m * d.elements.length, 1);

            const tblWidth = rowParts.length + colParts.reduce((m, d) => m * d.elements.length, 1);
            const tblHeight = colParts.length + rowParts.reduce((m, d) => m * d.elements.length, 1);
            ws.cell(tableStartRow, 1, tableStartRow + tblHeight - 1, tblWidth).style(tableStyle);

            if (variable.partitions.length) {
                const els = this.cartesian(variable.partitions.map(p => p.elements.map(e => e.id)));
                const dataWidth = tblWidth - rowParts.length;
                for (let i = 0; i < els.length; ++i) {
                    const key = els[i].reduce(
                        (m, el, i) => m + `[${variable.partitions[i].id}=${el}]`,
                        variable.id
                    );

                    const cell = xl.getExcelCellRef(
                        tableStartRow + colParts.length + Math.floor(i / dataWidth),
                        1 + rowParts.length + (i % dataWidth)
                    );

                    this.boundaries[key] = {sheet: 'Data Entry', tl: cell, br: cell };
                }
            } else {
                const cell = xl.getExcelCellRef(tableStartRow, 1);
                this.boundaries[variable.id] = { sheet: 'Data Entry', tl: cell, br: cell };
            }
        }
    }

    private addTitlesOnTop(ws: any, partitions: Partition[], startRow: number, startCol: number, index: number = 0): void {
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

            this.addTitlesOnTop(ws, partitions, startRow + 1, itemStartCol, index + 1);
        }
    }

    private addTitlesOnLeft(ws: any, partitions: Partition[], startRow: number, startCol: number, index: number = 0): void {
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

            this.addTitlesOnLeft(ws, partitions, itemStartRow, startCol + 1, index + 1);
        }
    }
}
