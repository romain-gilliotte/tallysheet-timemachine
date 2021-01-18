import { CellValue } from "./types";

export default abstract class FormData {
    abstract getCellData(questionId: string, disagregationIds: string[]): Promise<CellValue>;

}
