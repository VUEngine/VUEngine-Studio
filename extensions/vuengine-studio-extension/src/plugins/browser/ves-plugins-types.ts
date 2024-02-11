export const VUENGINE_PLUGINS_PREFIX = 'vuengine//';
export const USER_PLUGINS_PREFIX = 'user//';

export enum PluginConfigurationDataType {
    boolean = 'boolean',
    constant = 'constant',
    hex = 'hex',
    integer = 'integer',
    string = 'string',
    type = 'type',
}

export interface PluginConfiguration {
    name: string
    label: string
    description?: string
    dataType: PluginConfigurationDataType
    type?: string
    min?: number
    max?: number
    step?: number
    default: null | string | boolean | number
}
