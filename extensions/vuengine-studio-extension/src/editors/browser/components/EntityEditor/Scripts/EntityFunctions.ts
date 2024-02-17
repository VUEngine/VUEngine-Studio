export enum EntityType {
    Entity = 'Entity',
    AnimatedEntity = 'AnimatedEntity',
    Actor = 'Actor',
}

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
    entityType: EntityType
    arguments?: ActionFunctionArgument[]
}

export interface ActionFunctions {
    [id: string]: ActionFunction
}

export const ENTITY_FUNCTIONS: ActionFunctions = {
    'enterCollision': {
        name: 'enterCollision',
        label: 'Enter Collision',
        description: 'Called when the entity is colliding with another.',
        entityType: EntityType.Actor,
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
        description: 'Called _after_ the entity has collided with another.',
        entityType: EntityType.Actor,
    },
    'handleMessage': {
        name: 'handleMessage',
        label: 'Handle Message',
        description: 'Called when the entity receives a message. ' +
            'Messaging serves the purpose of communicating classes decoupling their interfaces ' +
            '(ie; not having to implement specific methods). These messages can be delayed too..',
        entityType: EntityType.Entity,
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
        description: 'Called when the entity is hidden after it was visible.',
        entityType: EntityType.Entity,
    },
    'ready': {
        name: 'ready',
        label: 'Ready',
        description: 'Called when the entity has been fully initialized.',
        entityType: EntityType.Entity,
    },
    'resume': {
        name: 'resume',
        label: 'Resume',
        description: '',
        entityType: EntityType.Entity,
    },
    'show': {
        name: 'show',
        label: 'Show',
        description: 'Called when the entity is shown after being hidden.',
        entityType: EntityType.Entity,
    },
    'suspend': {
        name: 'suspend',
        label: 'Suspend',
        description: '',
        entityType: EntityType.Entity,
    },
    'update': {
        name: 'update',
        label: 'Update',
        description: '',
        entityType: EntityType.Actor,
    },
};
