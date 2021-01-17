import xlsx from 'xlsx';
import { FormData, CellValue } from 'tallysheet-timemachine';
import ExcelForm from './form';

export default class ExcelFormData extends FormData {
    form: ExcelForm;
    ws: xlsx.WorkBook;


/* 


        const extracted = {};
        for (let key in form.boundaries) {
            const addr = form.boundaries[key];
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
    
        yield new FormData()
        return {
            $set: {
                status: 'pending_dataentry',
                processed: {
                    dataSourceId: form.dataSourceId,
                    extracted,
                },
            },
        };
*/

    constructor(form: ExcelForm, ws: xlsx.WorkBook) {
        super();

        this.form = form;
        this.ws = ws;
    }

    getData(): CellValue[][] {
        return this.form.questionList.questions.map(variable => this.getVariableData(variable.id));
    }
    
    getVariableData(variableId: string): CellValue[] {
        
    }
    
    getCellData(variableId: string, partitionIds: string[]): CellValue[] {
        const variable = this.form.questionList.questions.find(v => v.id == variableId);
        const rect = this.form.getCellBoundaries(variableId, partitionIds);
        

        if (variable) {
            return ws.Sheets['Metadata'][cellId].v


        }
        else {
            throw new Error('Variable not found');
        }

    }

}
