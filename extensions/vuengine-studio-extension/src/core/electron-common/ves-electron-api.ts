import { JsonSchema } from '@jsonforms/core';
import { VisitOptions } from 'sort-json';

export interface VesCoreAPI {
    setZoomFactor(zoomFactor: number): void;
    getUserDefault(preference: string, type: string): string;
    dereferenceJsonSchema(schema: JsonSchema): Promise<JsonSchema>;
    sortJson<T>(old: T, options?: VisitOptions): T;
}

declare global {
    interface Window {
        electronVesCore: VesCoreAPI
    }
}

export const VES_CHANNEL_SET_ZOOM_FACTOR = 'setZoomFactor';
export const VES_CHANNEL_GET_USER_DEFAULT = 'getUserDefault';
export const VES_CHANNEL_DEREFERENCE_JSON_SCHEMA = 'dereferenceJsonSchema';
export const VES_CHANNEL_SORT_JSON = 'sortJson';
