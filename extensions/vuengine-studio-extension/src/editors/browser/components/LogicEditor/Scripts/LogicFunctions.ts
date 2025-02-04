export enum VariableType {
    Boolean = 'boolean',
    Integer = 'integer',
    String = 'string',
    Struct = 'struct',
    StructPointer = 'structPointer',
}

export interface ActionFunctionArgument {
    name: string
    label: string
    type: VariableType
    struct?: string // for type StructPointer
}

export interface ActionFunction {
    name: string
    label: string
    description: string
    arguments?: ActionFunctionArgument[]
}

export interface ActionFunctions {
    [id: string]: ActionFunction
}

export const LOGIC_FUNCTIONS: ActionFunctions = {
    'enterCollision': {
        name: 'enterCollision',
        label: 'Enter Collision',
        description: 'Called when the actor is colliding with another.',
        arguments: [{
            name: 'collisionInformation',
            label: 'Collision Information',
            type: VariableType.StructPointer,
            struct: 'CollisionInformation',
        }],
    },
    'exitCollision': {
        name: 'exitCollision',
        label: 'Exit Collision',
        description: 'Called _after_ the actor has collided with another.',
    },
    'handleMessage': {
        name: 'handleMessage',
        label: 'Handle Message',
        description: 'Called when the actor receives a message. ' +
            'Messaging serves the purpose of communicating classes decoupling their interfaces ' +
            '(ie; not having to implement specific methods). These messages can be delayed too..',
        arguments: [{
            name: 'telegram',
            label: 'Telegram',
            type: VariableType.Struct,
            struct: 'Telegram',
        }],
    },
    'hide': {
        name: 'hide',
        label: 'Hide',
        description: 'Called when the actor is hidden after it was visible.',
    },
    'ready': {
        name: 'ready',
        label: 'Ready',
        description: 'Called when the actor has been fully initialized.',
    },
    'resume': {
        name: 'resume',
        label: 'Resume',
        description: '',
    },
    'show': {
        name: 'show',
        label: 'Show',
        description: 'Called when the actor is shown after being hidden.',
    },
    'suspend': {
        name: 'suspend',
        label: 'Suspend',
        description: '',
    },
    'update': {
        name: 'update',
        label: 'Update',
        description: '',
    },
};
