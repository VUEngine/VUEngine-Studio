export enum ActionConfigType {
    Boolean = 'boolean',
    Number = 'number',
    Text = 'text',
    TextArea = 'textarea',
    Type = 'type',
}

export interface ActionArgumentsData {
    key: string
    label: string
    description: string
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
    label: string
    description: string
    category: string
    iconClass: string
    template: string
    branches?: BranchData[]
    arguments?: ActionArgumentsData[]
}

export interface ActionMap {
    [id: string]: ActionData
}

export const AVAILABLE_ACTIONS: ActionMap = {
    'VUEngine::pause': {
        id: 'VUEngine::pause',
        label: 'Pause',
        description: "Pause the game by pushing the provided game state into the engine's state machine's stack.",
        category: 'Engine',
        iconClass: 'fa fa-pause',
        template: 'templates/action/VUEngine_pause',
        arguments: [{
            key: 'pauseState',
            label: 'Pause Game State',
            description: 'Pause game state',
            type: ActionConfigType.Text,
            default: '',
        }],
    },
    'VUEngine::unpause': {
        id: 'VUEngine::unpause',
        label: 'Unpause',
        description: "Unpause the game by removing the provided game state from the engine's state machine's stack.",
        category: 'Engine',
        iconClass: 'fa fa-play',
        template: 'templates/action/VUEngine_unpause',
        arguments: [{
            key: 'pauseState',
            label: 'Pause Game State',
            description: 'Pause game state',
            type: ActionConfigType.Text,
            default: '',
        }],
    },
    'VUEngine::enableKeypad': {
        id: 'VUEngine::enableKeypad',
        label: 'Enable Keypad',
        description: 'Enable user input.',
        category: 'Engine',
        iconClass: 'fa fa-toggle-on',
        template: 'templates/action/VUEngine_enableKeypad',
    },
    'VUEngine::disableKeypad': {
        id: 'VUEngine::disableKeypad',
        label: 'Disable Keypad',
        description: 'Disable user input.',
        category: 'Engine',
        iconClass: 'fa fa-toggle-off',
        template: 'templates/action/VUEngine_disableKeypad',
    },
    'VUEngine::wait': {
        id: 'VUEngine::wait',
        label: 'Wait',
        description: 'Halt the game by the provided time.',
        category: 'Engine',
        iconClass: 'fa fa-hourglass-half',
        template: 'templates/action/VUEngine_wait',
        arguments: [{
            key: 'milliseconds',
            label: 'Milliseconds',
            description: 'Time to halt the game',
            type: ActionConfigType.Number,
            default: 100,
            min: 1,
        }]
    },
    'Printing::text': {
        id: 'Printing::text',
        label: 'Print Text',
        description: 'Print a string.',
        category: 'Printing',
        iconClass: 'fa fa-font',
        template: 'templates/action/Printing_text',
        arguments: [{
            key: 'text',
            label: 'Text',
            description: 'String to print',
            type: ActionConfigType.TextArea,
            default: '',
        }, {
            key: 'positionX',
            label: 'X Position',
            description: 'Column to start printing at',
            type: ActionConfigType.Number,
            default: 0,
            min: 0,
            max: 63,
        }, {
            key: 'positionY',
            label: 'Y Position',
            description: 'Row to start printing at',
            type: ActionConfigType.Number,
            default: 0,
            min: 0,
            max: 47,
        }, {
            key: 'font',
            label: 'Font',
            description: 'Name of font to use for printing',
            type: ActionConfigType.Type,
            typeId: 'Font',
            default: 'Default',
        }]
    },
    'Printing::int32': {
        id: 'Printing::int32',
        label: 'Print Number',
        description: 'Print an integer value.',
        category: 'Printing',
        iconClass: 'fa fa-font',
        template: 'templates/action/Printing_int32',
    },
    'Printing::clear': {
        id: 'Printing::clear',
        label: 'Clear Printing Layer',
        description: 'Clear printing area in BGMAP memory',
        category: 'Printing',
        iconClass: 'fa fa-font',
        template: 'templates/action/Printing_clear',
    },
    'addEventListener': {
        id: 'addEventListener',
        label: 'Add Event Listener',
        description: 'Register an object that will listen for events.',
        category: 'Messaging',
        iconClass: 'codicon codicon-bell',
        template: 'templates/action/ListenerObject_addEventListener',
    },
    'removeEventListener': {
        id: 'removeEventListener',
        label: 'Remove Event Listener',
        description: 'Remove a specific listener object from the listening to a give code with the provided callback.',
        category: 'Messaging',
        iconClass: 'codicon codicon-bell-slash',
        template: 'templates/action/ListenerObject_removeEventListener',
    },
    'fireEvent': {
        id: 'fireEvent',
        label: 'Fire Event',
        description: 'Fire an event with the provided code.',
        category: 'Messaging',
        iconClass: 'codicon codicon-symbol-event',
        template: 'templates/action/ListenerObject_fireEvent',
        arguments: [{
            key: 'event',
            label: 'Event',
            description: 'Code of the event to fire.',
            type: ActionConfigType.Type,
            typeId: 'Event',
            default: 'ContainerDeleted',
        }]
    },
    'loop': {
        id: 'loop',
        label: 'Loop',
        description: 'Loop the code block until the given condition is met.',
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
        label: 'If/Else',
        description: 'An if/else conditional block.',
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
        label: 'Set Variable',
        description: 'Assign a variable.',
        category: 'Logic',
        iconClass: 'codicon codicon-symbol-variable',
        template: 'templates/action/setVariable',
    },
};
