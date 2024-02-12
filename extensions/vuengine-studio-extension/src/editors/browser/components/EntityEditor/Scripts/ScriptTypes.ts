export enum ScriptType {
    Custom = 'custom',
    Inherited = 'inherited',
}

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
            type: 'text',
            default: '',
        }, {
            key: 'positionX',
            label: 'X Position',
            type: 'number',
            default: 0,
            min: 0,
            max: 63,
        }, {
            key: 'positionY',
            label: 'Y Position',
            type: 'number',
            default: 0,
            min: 0,
            max: 47,
        }, {
            key: 'font',
            label: 'Font',
            type: 'type',
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
        iconClass: 'fa fa-commenting-o',
        template: 'templates/action/ListenerObject_addEventListener',
    },
    'removeEventListener': {
        id: 'removeEventListener',
        name: 'Remove Event Listener',
        category: 'Messaging',
        iconClass: 'fa fa-commenting-o',
        template: 'templates/action/ListenerObject_removeEventListener',
    },
    'fireEvent': {
        id: 'fireEvent',
        name: 'Fire Event',
        category: 'Messaging',
        iconClass: 'fa fa-commenting-o',
        template: 'templates/action/ListenerObject_fireEvent',
        config: [{
            key: 'event',
            label: 'Event',
            type: 'type',
            typeId: 'Event',
            default: 'ContainerDeleted',
        }]
    },
};
