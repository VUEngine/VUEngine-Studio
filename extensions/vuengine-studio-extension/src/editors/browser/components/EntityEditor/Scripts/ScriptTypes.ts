export enum ScriptType {
    Custom = 'custom',
    Inherited = 'inherited',
}

export enum ActionConfigType {
    Boolean = 'boolean',
    Number = 'number',
    Text = 'text',
    TextArea = 'textarea',
    Type = 'type',
}

export interface ActionMap {
    [id: string]: ActionData
}

export interface ActionConfigData {
    key: string
    label: string
    type: ActionConfigType
    default: string | number | boolean
    typeId?: string // only needed for type 'type'
    min?: number // only needed for type 'number'
    max?: number // only needed for type 'number'
    step?: number // only needed for type 'number'
}

export interface BranchData {
    name: string
    endNodeIconClass?: string
    // condition
}

export interface ActionData {
    id: string
    name: string
    category: string
    iconClass: string
    template: string
    branches?: BranchData[]
    config?: ActionConfigData[]
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

export const AVAILABLE_ACTIONS: ActionMap = {
    'Printing::text': {
        id: 'Printing::text',
        name: 'Print Text',
        category: 'Printing',
        iconClass: 'fa fa-font',
        template: 'templates/action/Printing_text',
        config: [{
            key: 'text',
            label: 'Text',
            type: ActionConfigType.TextArea,
            default: '',
        }, {
            key: 'positionX',
            label: 'X Position',
            type: ActionConfigType.Number,
            default: 0,
            min: 0,
            max: 63,
        }, {
            key: 'positionY',
            label: 'Y Position',
            type: ActionConfigType.Number,
            default: 0,
            min: 0,
            max: 47,
        }, {
            key: 'font',
            label: 'Font',
            type: ActionConfigType.Type,
            typeId: 'Font',
            default: 'Default',
        }]
    },
    'Printing::int32': {
        id: 'Printing::int32',
        name: 'Print Number',
        category: 'Printing',
        iconClass: 'fa fa-font',
        template: 'templates/action/Printing_int32',
    },
    'Printing::clear': {
        id: 'Printing::clear',
        name: 'Clear Printing Layer',
        category: 'Printing',
        iconClass: 'fa fa-font',
        template: 'templates/action/Printing_clear',
    },
    'addEventListener': {
        id: 'addEventListener',
        name: 'Add Event Listener',
        category: 'Messaging',
        iconClass: 'codicon codicon-bell',
        template: 'templates/action/ListenerObject_addEventListener',
    },
    'removeEventListener': {
        id: 'removeEventListener',
        name: 'Remove Event Listener',
        category: 'Messaging',
        iconClass: 'codicon codicon-bell-slash',
        template: 'templates/action/ListenerObject_removeEventListener',
    },
    'fireEvent': {
        id: 'fireEvent',
        name: 'Fire Event',
        category: 'Messaging',
        iconClass: 'codicon codicon-symbol-event',
        template: 'templates/action/ListenerObject_fireEvent',
        config: [{
            key: 'event',
            label: 'Event',
            type: ActionConfigType.Type,
            typeId: 'Event',
            default: 'ContainerDeleted',
        }]
    },
    'loop': {
        id: 'loop',
        name: 'Loop',
        category: 'Logic',
        iconClass: 'codicon codicon-refresh',
        template: 'templates/action/loop',
        branches: [{
            name: 'Loop',
            endNodeIconClass: 'codicon codicon-refresh',
        }],
    },
    'ifElse': {
        id: 'ifElse',
        name: 'If/Else',
        category: 'Logic',
        iconClass: 'codicon codicon-arrow-swap',
        template: 'templates/action/ifElse',
        branches: [{
            name: 'If',
        }, {
            name: 'Else',
        }],
    },
    'setVariable': {
        id: 'setVariable',
        name: 'Set Variable',
        category: 'Logic',
        iconClass: 'codicon codicon-symbol-variable',
        template: 'templates/action/setVariable',
    },
};
