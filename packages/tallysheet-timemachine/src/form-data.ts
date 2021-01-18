
export type CellValue = { value: number, confidence: number };

export default abstract class FormData {
    abstract getCellData(variableId: string, disagregationIds: string[]): Promise<CellValue>;

}
