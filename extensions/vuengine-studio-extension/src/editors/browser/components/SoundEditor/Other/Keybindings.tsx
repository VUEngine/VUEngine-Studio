import React, { useContext } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import VContainer from '../../Common/Base/VContainer';
import ButtonAssignment from '../../Common/ButtonAssignment/ButtonAssignment';
import ButtonAssignmentGroup from '../../Common/ButtonAssignment/ButtonAssignmentGroup';
import { SoundEditorCommands } from '../SoundEditorCommands';
import HContainer from '../../Common/Base/HContainer';
import { nls } from '@theia/core';

interface KeybindingsProps {
}

export default function Keybindings(props: KeybindingsProps): React.JSX.Element {
    const { services } = useContext(EditorsContext) as EditorsContextType;

    return <VContainer gap={20} grow={1}>
        <HContainer alignItems='start' wrap='wrap'>
            <VContainer gap={10}>
                <label>
                    {nls.localize('vuengine/editors/sound/general', 'General')}
                </label>
                <HContainer alignItems='start' wrap='wrap'>
                    <ButtonAssignmentGroup>
                        <ButtonAssignment
                            command={SoundEditorCommands.PLAY_PAUSE}
                            commandService={services.commandService}
                            vesCommonService={services.vesCommonService}
                        />
                        <ButtonAssignment
                            command={SoundEditorCommands.STOP}
                            commandService={services.commandService}
                            vesCommonService={services.vesCommonService}
                        />
                    </ButtonAssignmentGroup>
                    <ButtonAssignmentGroup>
                        <ButtonAssignment
                            command={SoundEditorCommands.TOGGLE_EVENT_LIST_VISIBILITY}
                            commandService={services.commandService}
                            vesCommonService={services.vesCommonService}
                        />
                        <ButtonAssignment
                            command={SoundEditorCommands.TOGGLE_SEQUENCER_VISIBILITY}
                            commandService={services.commandService}
                            vesCommonService={services.vesCommonService}
                        />
                        <ButtonAssignment
                            command={SoundEditorCommands.TOGGLE_EFFECTS_PANEL_VISIBILITY}
                            commandService={services.commandService}
                            vesCommonService={services.vesCommonService}
                        />
                        <ButtonAssignment
                            command={SoundEditorCommands.OPEN_INSTRUMENT_EDITOR}
                            commandService={services.commandService}
                            vesCommonService={services.vesCommonService}
                        />
                    </ButtonAssignmentGroup>
                </HContainer>
            </VContainer>
        </HContainer>
        <hr />
        <HContainer alignItems='start' wrap='wrap'>
            <VContainer gap={10}>
                <label>
                    {nls.localize('vuengine/editors/sound/options', 'Options')}
                </label>
                <HContainer alignItems='start' wrap='wrap'>
                    <ButtonAssignmentGroup>
                        <ButtonAssignment
                            command={SoundEditorCommands.TOGGLE_NOTE_SNAPPING}
                            commandService={services.commandService}
                            vesCommonService={services.vesCommonService}
                        />
                        <ButtonAssignment
                            command={SoundEditorCommands.SET_NOTE_LENGTH_1}
                            commandService={services.commandService}
                            vesCommonService={services.vesCommonService}
                        />
                        <ButtonAssignment
                            command={SoundEditorCommands.SET_NOTE_LENGTH_2}
                            commandService={services.commandService}
                            vesCommonService={services.vesCommonService}
                        />
                        <ButtonAssignment
                            command={SoundEditorCommands.SET_NOTE_LENGTH_4}
                            commandService={services.commandService}
                            vesCommonService={services.vesCommonService}
                        />
                        <ButtonAssignment
                            command={SoundEditorCommands.SET_NOTE_LENGTH_8}
                            commandService={services.commandService}
                            vesCommonService={services.vesCommonService}
                        />
                        <ButtonAssignment
                            command={SoundEditorCommands.SET_NOTE_LENGTH_16}
                            commandService={services.commandService}
                            vesCommonService={services.vesCommonService}
                        />
                    </ButtonAssignmentGroup>
                </HContainer>
            </VContainer>
            <VContainer gap={10}>
                <label>
                    {nls.localize('vuengine/editors/sound/tools', 'Tools')}
                </label>
                <HContainer alignItems='start' wrap='wrap'>
                    <ButtonAssignmentGroup>
                        <ButtonAssignment
                            command={SoundEditorCommands.IMPORT}
                            commandService={services.commandService}
                            vesCommonService={services.vesCommonService}
                        />
                        <ButtonAssignment
                            command={SoundEditorCommands.EXPORT}
                            commandService={services.commandService}
                            vesCommonService={services.vesCommonService}
                        />
                        <ButtonAssignment
                            command={SoundEditorCommands.REMOVE_UNUSED_PATTERNS}
                            commandService={services.commandService}
                            vesCommonService={services.vesCommonService}
                        />
                        <ButtonAssignment
                            command={SoundEditorCommands.REMOVE_UNUSED_INSTRUMENTS}
                            commandService={services.commandService}
                            vesCommonService={services.vesCommonService}
                        />
                    </ButtonAssignmentGroup>
                </HContainer>
            </VContainer>
        </HContainer>
        <hr />
        <VContainer gap={10}>
            <label>
                {nls.localize('vuengine/editors/sound/sequencer', 'Sequencer')}
            </label>
            <HContainer alignItems='start' wrap='wrap'>
                <ButtonAssignmentGroup>
                    <ButtonAssignment
                        command={SoundEditorCommands.ADD_TRACK}
                        commandService={services.commandService}
                        vesCommonService={services.vesCommonService}
                    />
                    <ButtonAssignment
                        command={SoundEditorCommands.ADD_PATTERN}
                        commandService={services.commandService}
                        vesCommonService={services.vesCommonService}
                    />
                    <ButtonAssignment
                        command={SoundEditorCommands.REMOVE_CURRENT_PATTERN}
                        commandService={services.commandService}
                        vesCommonService={services.vesCommonService}
                    />
                    <ButtonAssignment
                        command={SoundEditorCommands.SELECT_NEXT_SEQUENCE_INDEX}
                        commandService={services.commandService}
                        vesCommonService={services.vesCommonService}
                    />
                    <ButtonAssignment
                        command={SoundEditorCommands.SELECT_PREVIOUS_SEQUENCE_INDEX}
                        commandService={services.commandService}
                        vesCommonService={services.vesCommonService}
                    />
                </ButtonAssignmentGroup>
                <ButtonAssignmentGroup>
                    <ButtonAssignment
                        command={SoundEditorCommands.SELECT_TRACK_1}
                        commandService={services.commandService}
                        vesCommonService={services.vesCommonService}
                    />
                    <ButtonAssignment
                        command={SoundEditorCommands.SELECT_TRACK_2}
                        commandService={services.commandService}
                        vesCommonService={services.vesCommonService}
                    />
                    <ButtonAssignment
                        command={SoundEditorCommands.SELECT_TRACK_3}
                        commandService={services.commandService}
                        vesCommonService={services.vesCommonService}
                    />
                    <ButtonAssignment
                        command={SoundEditorCommands.SELECT_TRACK_4}
                        commandService={services.commandService}
                        vesCommonService={services.vesCommonService}
                    />
                    <ButtonAssignment
                        command={SoundEditorCommands.SELECT_TRACK_5}
                        commandService={services.commandService}
                        vesCommonService={services.vesCommonService}
                    />
                    <ButtonAssignment
                        command={SoundEditorCommands.SELECT_TRACK_6}
                        commandService={services.commandService}
                        vesCommonService={services.vesCommonService}
                    />
                    <ButtonAssignment
                        command={SoundEditorCommands.SELECT_NEXT_TRACK}
                        commandService={services.commandService}
                        vesCommonService={services.vesCommonService}
                    />
                    <ButtonAssignment
                        command={SoundEditorCommands.SELECT_PREVIOUS_TRACK}
                        commandService={services.commandService}
                        vesCommonService={services.vesCommonService}
                    />
                </ButtonAssignmentGroup>
                <ButtonAssignmentGroup>
                    <ButtonAssignment
                        command={SoundEditorCommands.SEQUENCER_VERTICAL_SCALE_REDUCE}
                        commandService={services.commandService}
                        vesCommonService={services.vesCommonService}
                    />
                    <ButtonAssignment
                        command={SoundEditorCommands.SEQUENCER_VERTICAL_SCALE_INCREASE}
                        commandService={services.commandService}
                        vesCommonService={services.vesCommonService}
                    />
                    <ButtonAssignment
                        command={SoundEditorCommands.SEQUENCER_VERTICAL_SCALE_RESET}
                        commandService={services.commandService}
                        vesCommonService={services.vesCommonService}
                    />
                    <ButtonAssignment
                        command={SoundEditorCommands.SEQUENCER_HORIZONTAL_SCALE_REDUCE}
                        commandService={services.commandService}
                        vesCommonService={services.vesCommonService}
                    />
                    <ButtonAssignment
                        command={SoundEditorCommands.SEQUENCER_HORIZONTAL_SCALE_INCREASE}
                        commandService={services.commandService}
                        vesCommonService={services.vesCommonService}
                    />
                    <ButtonAssignment
                        command={SoundEditorCommands.SEQUENCER_HORIZONTAL_SCALE_RESET}
                        commandService={services.commandService}
                        vesCommonService={services.vesCommonService}
                    />
                </ButtonAssignmentGroup>
            </HContainer>
        </VContainer>
        <hr />
        <VContainer gap={10}>
            <label>
                {nls.localize('vuengine/editors/sound/pianoRoll', 'Piano Roll')}
            </label>
            <HContainer alignItems='start' wrap='wrap'>
                <ButtonAssignmentGroup>
                    <ButtonAssignment
                        command={SoundEditorCommands.PIANO_ROLL_SELECT_NEXT_STEP}
                        commandService={services.commandService}
                        vesCommonService={services.vesCommonService}
                    />
                    <ButtonAssignment
                        command={SoundEditorCommands.PIANO_ROLL_SELECT_PREVIOUS_STEP}
                        commandService={services.commandService}
                        vesCommonService={services.vesCommonService}
                    />
                    <ButtonAssignment
                        command={SoundEditorCommands.PIANO_ROLL_SELECT_NEXT_BAR}
                        commandService={services.commandService}
                        vesCommonService={services.vesCommonService}
                    />
                    <ButtonAssignment
                        command={SoundEditorCommands.PIANO_ROLL_SELECT_PREVIOUS_BAR}
                        commandService={services.commandService}
                        vesCommonService={services.vesCommonService}
                    />
                </ButtonAssignmentGroup>
                <ButtonAssignmentGroup>
                    <ButtonAssignment
                        command={SoundEditorCommands.SELECT_AT_CURSOR_POSITION}
                        commandService={services.commandService}
                        vesCommonService={services.vesCommonService}
                    />
                    <ButtonAssignment
                        command={SoundEditorCommands.ADD_AT_CURSOR_POSITION}
                        commandService={services.commandService}
                        vesCommonService={services.vesCommonService}
                    />
                    <ButtonAssignment
                        command={SoundEditorCommands.SELECT_ALL_NOTES}
                        commandService={services.commandService}
                        vesCommonService={services.vesCommonService}
                    />
                    <ButtonAssignment
                        command={SoundEditorCommands.REMOVE_SELECTED_NOTES}
                        commandService={services.commandService}
                        vesCommonService={services.vesCommonService}
                    />
                    <ButtonAssignment
                        command={SoundEditorCommands.COPY_SELECTED_NOTES}
                        commandService={services.commandService}
                        vesCommonService={services.vesCommonService}
                    />
                    <ButtonAssignment
                        command={SoundEditorCommands.PASTE_SELECTED_NOTES}
                        commandService={services.commandService}
                        vesCommonService={services.vesCommonService}
                    />
                    <ButtonAssignment
                        command={SoundEditorCommands.NOTES_UP}
                        commandService={services.commandService}
                        vesCommonService={services.vesCommonService}
                    />
                    <ButtonAssignment
                        command={SoundEditorCommands.NOTES_DOWN}
                        commandService={services.commandService}
                        vesCommonService={services.vesCommonService}
                    />
                    <ButtonAssignment
                        command={SoundEditorCommands.NOTES_UP_AN_OCTAVE}
                        commandService={services.commandService}
                        vesCommonService={services.vesCommonService}
                    />
                    <ButtonAssignment
                        command={SoundEditorCommands.NOTES_DOWN_AN_OCTAVE}
                        commandService={services.commandService}
                        vesCommonService={services.vesCommonService}
                    />
                </ButtonAssignmentGroup>
                <ButtonAssignmentGroup>
                    <ButtonAssignment
                        command={SoundEditorCommands.PIANO_ROLL_VERTICAL_SCALE_REDUCE}
                        commandService={services.commandService}
                        vesCommonService={services.vesCommonService}
                    />
                    <ButtonAssignment
                        command={SoundEditorCommands.PIANO_ROLL_VERTICAL_SCALE_INCREASE}
                        commandService={services.commandService}
                        vesCommonService={services.vesCommonService}
                    />
                    <ButtonAssignment
                        command={SoundEditorCommands.PIANO_ROLL_VERTICAL_SCALE_RESET}
                        commandService={services.commandService}
                        vesCommonService={services.vesCommonService}
                    />
                    <ButtonAssignment
                        command={SoundEditorCommands.PIANO_ROLL_HORIZONTAL_SCALE_REDUCE}
                        commandService={services.commandService}
                        vesCommonService={services.vesCommonService}
                    />
                    <ButtonAssignment
                        command={SoundEditorCommands.PIANO_ROLL_HORIZONTAL_SCALE_INCREASE}
                        commandService={services.commandService}
                        vesCommonService={services.vesCommonService}
                    />
                    <ButtonAssignment
                        command={SoundEditorCommands.PIANO_ROLL_HORIZONTAL_SCALE_RESET}
                        commandService={services.commandService}
                        vesCommonService={services.vesCommonService}
                    />
                </ButtonAssignmentGroup>
            </HContainer>
        </VContainer>
    </VContainer>;
}
