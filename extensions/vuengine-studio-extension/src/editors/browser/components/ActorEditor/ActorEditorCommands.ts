import { nls } from '@theia/core';
import { EditorCommands } from '../../ves-editors-types';

export const ActorEditorCommands: EditorCommands = {
    ADD_COMPONENT: {
        id: 'editors.actorEditor.addComponent',
        label: nls.localize('vuengine/editors/actor/commands/addComponent', 'Add Component'),
        category: nls.localize('vuengine/editors/actor/commands/category', 'Actor Editor'),
    },
    CENTER_CURRENT_COMPONENT: {
        id: 'editors.actorEditor.centerCurrentComponent',
        label: nls.localize('vuengine/editors/actor/commands/centerCurrentComponent', 'Center Current Component'),
        category: nls.localize('vuengine/editors/actor/commands/category', 'Actor Editor'),
        keybinding: 'space',
    },
    DELETE_CURRENT_COMPONENT: {
        id: 'editors.actorEditor.deleteCurrentComponent',
        label: nls.localize('vuengine/editors/actor/commands/deleteCurrentComponent', 'Delete Current Component'),
        category: nls.localize('vuengine/editors/actor/commands/category', 'Actor Editor'),
        keybinding: ['ctrlcmd+backspace', 'delete'],
    },
    DESELECT_CURRENT_COMPONENT: {
        id: 'editors.actorEditor.deselectCurrentComponent',
        label: nls.localize('vuengine/editors/actor/commands/deselectCurrentComponent', 'Deselect Current Component'),
        category: nls.localize('vuengine/editors/actor/commands/category', 'Actor Editor'),
        keybinding: 'esc',
    },
    MOVE_COMPONENT_UP: {
        id: 'editors.actorEditor.moveComponentUp',
        label: nls.localize('vuengine/editors/actor/commands/moveComponentUp', 'Move Current Component Up'),
        category: nls.localize('vuengine/editors/actor/commands/category', 'Actor Editor'),
        keybinding: 'up',
    },
    MOVE_COMPONENT_DOWN: {
        id: 'editors.actorEditor.moveComponentDown',
        label: nls.localize('vuengine/editors/actor/commands/moveComponentDown', 'Move Current Component Down'),
        category: nls.localize('vuengine/editors/actor/commands/category', 'Actor Editor'),
        keybinding: 'down',
    },
    MOVE_COMPONENT_LEFT: {
        id: 'editors.actorEditor.moveComponentLeft',
        label: nls.localize('vuengine/editors/actor/commands/moveComponentLeft', 'Move Current Component Left'),
        category: nls.localize('vuengine/editors/actor/commands/category', 'Actor Editor'),
        keybinding: 'left',
    },
    MOVE_COMPONENT_RIGHT: {
        id: 'editors.actorEditor.moveComponentRight',
        label: nls.localize('vuengine/editors/actor/commands/moveComponentRight', 'Move Current Component Right'),
        category: nls.localize('vuengine/editors/actor/commands/category', 'Actor Editor'),
        keybinding: 'right',
    },
    INCREASE_COMPONENT_Z_DISPLACEMENT: {
        id: 'editors.actorEditor.increaseComponentZDisplacement',
        label: nls.localize('vuengine/editors/actor/commands/increaseComponentZDisplacement', 'Increase Current Component Z Displacement'),
        category: nls.localize('vuengine/editors/actor/commands/category', 'Actor Editor'),
        keybinding: 'shift+up',
    },
    DECREASE_COMPONENT_Z_DISPLACEMENT: {
        id: 'editors.actorEditor.decreaseComponentZDisplacement',
        label: nls.localize('vuengine/editors/actor/commands/decreaseComponentZDisplacement', 'Decrease Current Component  Z Displacement'),
        category: nls.localize('vuengine/editors/actor/commands/category', 'Actor Editor'),
        keybinding: 'shift+down',
    },
    INCREASE_COMPONENT_PARALLAX: {
        id: 'editors.actorEditor.increaseComponentParallax',
        label: nls.localize('vuengine/editors/actor/commands/increaseComponentParallax', 'Increase Current Component Parallax'),
        category: nls.localize('vuengine/editors/actor/commands/category', 'Actor Editor'),
        keybinding: 'shift+right',
    },
    DECREASE_COMPONENT_PARALLAX: {
        id: 'editors.actorEditor.decreaseComponentParallax',
        label: nls.localize('vuengine/editors/actor/commands/decreaseComponentParallax', 'Decrease Current Component Parallax'),
        category: nls.localize('vuengine/editors/actor/commands/category', 'Actor Editor'),
        keybinding: 'shift+left',
    },
};
