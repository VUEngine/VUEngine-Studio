import { nls } from '@theia/core';
import { EditorCommands } from '../../ves-editors-types';

export const EntityEditorCommands: EditorCommands = {
    ADD_COMPONENT: {
        id: 'editors.entityEditor.addComponent',
        label: nls.localize('vuengine/editors/commands/entityEditor/addComponent', 'Add Component'),
        category: nls.localize('vuengine/editors/commands/entityEditor/category', 'Entity Editor'),
    },
    CENTER_CURRENT_COMPONENT: {
        id: 'editors.entityEditor.centerCurrentComponent',
        label: nls.localize('vuengine/editors/commands/entityEditor/centerCurrentComponent', 'Center Current Component'),
        category: nls.localize('vuengine/editors/commands/entityEditor/category', 'Entity Editor'),
        keybinding: 'space',
    },
    DELETE_CURRENT_COMPONENT: {
        id: 'editors.entityEditor.deleteCurrentComponent',
        label: nls.localize('vuengine/editors/commands/entityEditor/deleteCurrentComponent', 'Delete Current Component'),
        category: nls.localize('vuengine/editors/commands/entityEditor/category', 'Entity Editor'),
        keybinding: ['ctrlcmd+backspace', 'delete'],
    },
    DESELECT_CURRENT_COMPONENT: {
        id: 'editors.entityEditor.deselectCurrentComponent',
        label: nls.localize('vuengine/editors/commands/entityEditor/deselectCurrentComponent', 'Deselect Current Component'),
        category: nls.localize('vuengine/editors/commands/entityEditor/category', 'Entity Editor'),
        keybinding: 'esc',
    },
    MOVE_COMPONENT_UP: {
        id: 'editors.entityEditor.moveComponentUp',
        label: nls.localize('vuengine/editors/commands/entityEditor/moveComponentUp', 'Move Current Component Up'),
        category: nls.localize('vuengine/editors/commands/entityEditor/category', 'Entity Editor'),
        keybinding: 'up',
    },
    MOVE_COMPONENT_DOWN: {
        id: 'editors.entityEditor.moveComponentDown',
        label: nls.localize('vuengine/editors/commands/entityEditor/moveComponentDown', 'Move Current Component Down'),
        category: nls.localize('vuengine/editors/commands/entityEditor/category', 'Entity Editor'),
        keybinding: 'down',
    },
    MOVE_COMPONENT_LEFT: {
        id: 'editors.entityEditor.moveComponentLeft',
        label: nls.localize('vuengine/editors/commands/entityEditor/moveComponentLeft', 'Move Current Component Left'),
        category: nls.localize('vuengine/editors/commands/entityEditor/category', 'Entity Editor'),
        keybinding: 'left',
    },
    MOVE_COMPONENT_RIGHT: {
        id: 'editors.entityEditor.moveComponentRight',
        label: nls.localize('vuengine/editors/commands/entityEditor/moveComponentRight', 'Move Current Component Right'),
        category: nls.localize('vuengine/editors/commands/entityEditor/category', 'Entity Editor'),
        keybinding: 'right',
    },
    INCREASE_COMPONENT_Z_DISPLACEMENT: {
        id: 'editors.entityEditor.increaseComponentZDisplacement',
        label: nls.localize('vuengine/editors/commands/entityEditor/increaseComponentZDisplacement', 'Increase Current Component Z Displacement'),
        category: nls.localize('vuengine/editors/commands/entityEditor/category', 'Entity Editor'),
        keybinding: 'shift+up',
    },
    DECREASE_COMPONENT_Z_DISPLACEMENT: {
        id: 'editors.entityEditor.decreaseComponentZDisplacement',
        label: nls.localize('vuengine/editors/commands/entityEditor/decreaseComponentZDisplacement', 'Decrease Current Component  Z Displacement'),
        category: nls.localize('vuengine/editors/commands/entityEditor/category', 'Entity Editor'),
        keybinding: 'shift+down',
    },
    INCREASE_COMPONENT_PARALLAX: {
        id: 'editors.entityEditor.increaseComponentParallax',
        label: nls.localize('vuengine/editors/commands/entityEditor/increaseComponentParallax', 'Increase Current Component Parallax'),
        category: nls.localize('vuengine/editors/commands/entityEditor/category', 'Entity Editor'),
        keybinding: 'shift+right',
    },
    DECREASE_COMPONENT_PARALLAX: {
        id: 'editors.entityEditor.decreaseComponentParallax',
        label: nls.localize('vuengine/editors/commands/entityEditor/decreaseComponentParallax', 'Decrease Current Component Parallax'),
        category: nls.localize('vuengine/editors/commands/entityEditor/category', 'Entity Editor'),
        keybinding: 'shift+left',
    },
};
