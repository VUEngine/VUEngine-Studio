import { nls } from '@theia/core';
import { EditorCommand } from '../../ves-editors-types';

export namespace ActorEditorCommands {
    export const ADD_COMPONENT: EditorCommand = {
        id: 'editors.actorEditor.addComponent',
        label: nls.localize('vuengine/editors/actor/commands/addComponent', 'Add Component'),
        category: nls.localize('vuengine/editors/actor/commands/category', 'Actor Editor'),
    };
    export const CENTER_CURRENT_COMPONENT: EditorCommand = {
        id: 'editors.actorEditor.centerCurrentComponent',
        label: nls.localize('vuengine/editors/actor/commands/centerCurrentComponent', 'Center Current Component'),
        category: nls.localize('vuengine/editors/actor/commands/category', 'Actor Editor'),
        keybinding: 'space',
    };
    export const DELETE_CURRENT_COMPONENT: EditorCommand = {
        id: 'editors.actorEditor.deleteCurrentComponent',
        label: nls.localize('vuengine/editors/actor/commands/deleteCurrentComponent', 'Delete Current Component'),
        category: nls.localize('vuengine/editors/actor/commands/category', 'Actor Editor'),
        keybinding: ['ctrlcmd+backspace', 'delete'],
    };
    export const DESELECT_CURRENT_COMPONENT: EditorCommand = {
        id: 'editors.actorEditor.deselectCurrentComponent',
        label: nls.localize('vuengine/editors/actor/commands/deselectCurrentComponent', 'Deselect Current Component'),
        category: nls.localize('vuengine/editors/actor/commands/category', 'Actor Editor'),
        keybinding: 'esc',
    };
    export const MOVE_COMPONENT_UP: EditorCommand = {
        id: 'editors.actorEditor.moveComponentUp',
        label: nls.localize('vuengine/editors/actor/commands/moveComponentUp', 'Move Current Component Up'),
        category: nls.localize('vuengine/editors/actor/commands/category', 'Actor Editor'),
        keybinding: 'up',
    };
    export const MOVE_COMPONENT_DOWN: EditorCommand = {
        id: 'editors.actorEditor.moveComponentDown',
        label: nls.localize('vuengine/editors/actor/commands/moveComponentDown', 'Move Current Component Down'),
        category: nls.localize('vuengine/editors/actor/commands/category', 'Actor Editor'),
        keybinding: 'down',
    };
    export const MOVE_COMPONENT_LEFT: EditorCommand = {
        id: 'editors.actorEditor.moveComponentLeft',
        label: nls.localize('vuengine/editors/actor/commands/moveComponentLeft', 'Move Current Component Left'),
        category: nls.localize('vuengine/editors/actor/commands/category', 'Actor Editor'),
        keybinding: 'left',
    };
    export const MOVE_COMPONENT_RIGHT: EditorCommand = {
        id: 'editors.actorEditor.moveComponentRight',
        label: nls.localize('vuengine/editors/actor/commands/moveComponentRight', 'Move Current Component Right'),
        category: nls.localize('vuengine/editors/actor/commands/category', 'Actor Editor'),
        keybinding: 'right',
    };
    export const INCREASE_COMPONENT_Z_DISPLACEMENT: EditorCommand = {
        id: 'editors.actorEditor.increaseComponentZDisplacement',
        label: nls.localize('vuengine/editors/actor/commands/increaseComponentZDisplacement', 'Increase Current Component Z Displacement'),
        category: nls.localize('vuengine/editors/actor/commands/category', 'Actor Editor'),
        keybinding: 'shift+up',
    };
    export const DECREASE_COMPONENT_Z_DISPLACEMENT: EditorCommand = {
        id: 'editors.actorEditor.decreaseComponentZDisplacement',
        label: nls.localize('vuengine/editors/actor/commands/decreaseComponentZDisplacement', 'Decrease Current Component  Z Displacement'),
        category: nls.localize('vuengine/editors/actor/commands/category', 'Actor Editor'),
        keybinding: 'shift+down',
    };
    export const INCREASE_COMPONENT_PARALLAX: EditorCommand = {
        id: 'editors.actorEditor.increaseComponentParallax',
        label: nls.localize('vuengine/editors/actor/commands/increaseComponentParallax', 'Increase Current Component Parallax'),
        category: nls.localize('vuengine/editors/actor/commands/category', 'Actor Editor'),
        keybinding: 'shift+right',
    };
    export const DECREASE_COMPONENT_PARALLAX: EditorCommand = {
        id: 'editors.actorEditor.decreaseComponentParallax',
        label: nls.localize('vuengine/editors/actor/commands/decreaseComponentParallax', 'Decrease Current Component Parallax'),
        category: nls.localize('vuengine/editors/actor/commands/category', 'Actor Editor'),
        keybinding: 'shift+left',
    };
    export const PREVIEW_BACKGROUND_NEXT: EditorCommand = {
        id: 'editors.actorEditor.previewBackgroundNext',
        label: nls.localize('vuengine/editors/actor/commands/previewBackgroundNext', 'Preview: Change Background'),
        category: nls.localize('vuengine/editors/actor/commands/category', 'Actor Editor'),
    };
    export const PREVIEW_TOGGLE_ANAGLYPH: EditorCommand = {
        id: 'editors.actorEditor.previewToggleAnaglyph',
        label: nls.localize('vuengine/editors/actor/commands/previewToggleAnaglyph', 'Preview: Toggle Anaglyph'),
        category: nls.localize('vuengine/editors/actor/commands/category', 'Actor Editor'),
    };
    export const PREVIEW_TOGGLE_SCREEN_FRAME: EditorCommand = {
        id: 'editors.actorEditor.previewScreenFrame',
        label: nls.localize('vuengine/editors/actor/commands/previewScreenFrame', 'Preview: Toggle Screen Frame'),
        category: nls.localize('vuengine/editors/actor/commands/category', 'Actor Editor'),
    };
};
