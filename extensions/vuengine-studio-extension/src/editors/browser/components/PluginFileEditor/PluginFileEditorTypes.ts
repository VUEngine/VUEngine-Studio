import { PluginConfigurationDataType } from '../../../../plugins/browser/ves-plugins-types';

export interface PluginFileTranslatedField {
    [key: string]: string
}

export interface PluginConfigurationData {
    name: string
    label: PluginFileTranslatedField
    description: PluginFileTranslatedField
    dataType: PluginConfigurationDataType
    type?: string
    min?: number
    max?: number
    step?: number
    default: null | string | boolean | number
}

export interface PluginFileData {
    displayName: PluginFileTranslatedField
    author: string
    description: PluginFileTranslatedField
    repository: string
    license: string
    tags: PluginFileTranslatedField[]
    dependencies: string[]
    configuration: PluginConfigurationData[]
}
