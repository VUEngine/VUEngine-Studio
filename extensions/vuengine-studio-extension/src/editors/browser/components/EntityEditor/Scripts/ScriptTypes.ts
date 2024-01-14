export interface ActionMap {
    [id: string]: ActionData
}

export interface ActionConfigData {
    key: string
    label: string
    type: 'text' | 'number' | 'boolean' | 'type'
    default: string | number | boolean
    typeId?: string // only needed for type 'type'
    min?: number // only needed for type 'number'
    max?: number // only needed for type 'number'
    step?: number // only needed for type 'number'
}

export interface ActionData {
    id: string
    name: string
    category: string
    iconClass: string
    template: string
    config?: ActionConfigData[]
}

export interface ScriptedActionData {
    id: string
    config?: {
        [key: string]: any
    }
}
