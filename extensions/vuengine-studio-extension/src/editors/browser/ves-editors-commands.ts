import { Command } from '@theia/core';
import { ActorEditorCommands } from './components/ActorEditor/ActorEditorCommands';
import { CommonEditorCommands } from './components/Common/Editor/CommonEditorCommands';
import { FontEditorCommands } from './components/FontEditor/FontEditorCommands';
import { MusicEditorCommands } from './components/MusicEditor/MusicEditorCommands';
import { PixelEditorCommands } from './components/PixelEditor/PixelEditorCommands';
import { EditorCommands } from './ves-editors-types';

export namespace VesEditorsCommands {
    export const GENERATE: Command = Command.toLocalizedCommand(
        {
            id: 'editors.generate',
            label: 'Generate File(s)',
            category: 'Editor',
            iconClass: 'codicon codicon-server-process',
        },
        'vuengine/editors/commands/generate',
        'vuengine/editors/commands/category'
    );
    export const OPEN_IN_EDITOR: Command = Command.toLocalizedCommand(
        {
            id: 'editors.openInEditor',
            label: 'Open in graphical editor',
            category: 'Editor',
            iconClass: 'codicon codicon-preview',
        },
        'vuengine/editors/commands/openInEditor',
        'vuengine/editors/commands/category'
    );
    export const OPEN_SOURCE: Command = Command.toLocalizedCommand(
        {
            id: 'editors.showSource',
            label: 'Show Source',
            category: 'Editor',
            iconClass: 'codicon codicon-json',
        },
        'vuengine/editors/commands/showSource',
        'vuengine/editors/commands/category'
    );

    export const GENERATE_ID: Command = Command.toLocalizedCommand(
        {
            id: 'editors.generateId',
            label: 'Generate new item ID',
            category: 'Editor',
            iconClass: 'codicon codicon-gear'
        },
        'vuengine/editors/commands/generateId',
        'vuengine/editors/commands/category'
    );
};

export const EditorsCommands: EditorCommands[] = [
    ActorEditorCommands,
    CommonEditorCommands,
    FontEditorCommands,
    MusicEditorCommands,
    PixelEditorCommands,
];
