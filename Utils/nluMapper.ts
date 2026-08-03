export type ExtractedValue = string | number | null;
export type ExtractionResult = Record<string, ExtractedValue>;

export function parseExtractionResponse(content: string, fields: string[]): ExtractionResult {
    let payload: any;
    try {
        payload = JSON.parse(content);
    } catch (err) {
        throw new Error("LLM response was not valid JSON");
    }

    if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
        throw new Error("LLM response was not a JSON object");
    }

    const result: ExtractionResult = {};
    for (const field of fields) {
        const value = payload[field];
        result[field] = value === undefined ? null : value;
    }
    return result;
}
