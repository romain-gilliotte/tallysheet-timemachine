import Form from "./form";

export type CellValue = { value: number, confidence: number };

export default abstract class FormData {

    abstract get form(): Form;

    abstract getData(id: string): CellValue[][];
    abstract getVariableData(id: string): CellValue[];
    abstract getCellData(variableId: string, partitionIds: string[]): CellValue[];
}
