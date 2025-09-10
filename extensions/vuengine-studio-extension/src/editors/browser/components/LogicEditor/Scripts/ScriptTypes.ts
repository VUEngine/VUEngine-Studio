export enum ScriptType {
    Custom = 'custom',
    Inherited = 'inherited',
}

export interface ScriptedActionBranchData {
    script: ScriptedActionData[]
}

export interface ScriptedActionData {
    id: string
    branches?: ScriptedActionBranchData[]
    config?: {
        [key: string]: any
    }
}
