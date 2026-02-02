import { deepClone, nls } from '@theia/core';
import { ConfirmDialog } from '@theia/core/lib/browser';
import React, { Dispatch, SetStateAction, useContext, useEffect } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import HContainer from '../../Common/Base/HContainer';
import VContainer from '../../Common/Base/VContainer';
import ImportExport from '../ImportExport/ImportExport';
import { getPatternName } from '../SoundEditor';
import { SoundEditorCommands } from '../SoundEditorCommands';
import { SoundData, SoundEvent } from '../SoundEditorTypes';
import { isEqual } from 'lodash';

const MAX_UNUSED_PATTERNS_TO_LIST = 15;
const MAX_UNUSED_INSTRUMENTS_TO_LIST = 15;
const MAX_DUPLICATE_PATTERNS_TO_LIST = 5;

interface UtilitiesProps {
    soundData: SoundData
    updateSoundData: (soundData: SoundData) => void
    setUtilitiesDialogOpen: Dispatch<SetStateAction<boolean>>
}

export default function Utilities(props: UtilitiesProps): React.JSX.Element {
    const { soundData, updateSoundData, setUtilitiesDialogOpen } = props;
    const { services, setCommands, onCommandExecute, enableCommands, focusEditor } = useContext(EditorsContext) as EditorsContextType;

    const removeUnusedPatterns = async (): Promise<void> => {
        // find all unused patterns
        const unusedPatterns: Record<string, string> = {};
        Object.keys(soundData.patterns).forEach(patternId => {
            let found = false;
            soundData.tracks.forEach(track => {
                if (Object.values(track.sequence).includes(patternId)) {
                    found = true;
                }
            });

            if (!found) {
                unusedPatterns[patternId] = getPatternName(soundData, patternId);
            }
        });
        const unusedPatternsNames = Object.values(unusedPatterns);

        // stop if no unused patterns found
        if (unusedPatternsNames.length === 0) {
            services.messageService.info(nls.localize(
                'vuengine/editors/sound/noUnusedPatternsFound',
                'No unused patterns could be found.'
            ));
            return;
        }

        const ellipsis = unusedPatternsNames.length > MAX_UNUSED_PATTERNS_TO_LIST ? '\n[…]' : '';
        const patternList = `• ${unusedPatternsNames.slice(0, MAX_UNUSED_PATTERNS_TO_LIST).join('\n• ')}${ellipsis}`;

        // prompt
        const dialog = new ConfirmDialog({
            title: SoundEditorCommands.REMOVE_UNUSED_PATTERNS.label,
            msg: `${nls.localize(
                'vuengine/editors/sound/confirmRemoveUnusedPatterns',
                'This will delete all patterns that are not currently placed on any track.\n\
Are you sure you want to do this?\n\n\
A total of {0} patterns will be deleted.',
                unusedPatternsNames.length
            )}\n\n${patternList}`,
        });

        const confirmed = await dialog.open();
        if (confirmed) {
            const unusedPatternsIds = Object.keys(unusedPatterns);

            // filter out unused patterns
            const updatedPatterns = Object.fromEntries(
                Object.entries({ ...soundData.patterns })
                    .filter(([pId, p]) => !unusedPatternsIds.includes(pId))
            );

            updateSoundData({
                ...soundData,
                patterns: updatedPatterns,
            });

            services.messageService.info(nls.localize(
                'vuengine/editors/sound/unusedPatternsDeleted',
                'Successfully deleted {0} unused patterns.',
                unusedPatternsNames.length
            ));
        }
    };

    const removeUnusedInstruments = async (): Promise<void> => {
        // get all instruments used on placed patterns or set as track default instrument
        const usedInstruments: string[] = [];
        soundData.tracks.forEach(track => {
            usedInstruments.push(track.instrument);

            Object.values(track.sequence).forEach(patternId => {
                const pattern = soundData.patterns[patternId];
                Object.values(pattern?.events ?? {}).forEach(event => {
                    if (event[SoundEvent.Instrument]) {
                        usedInstruments.push(event[SoundEvent.Instrument]);
                    }
                });
            });
        });

        // get all instruments, then filter out used ones
        const unusedInstrumentIds = Object.keys(soundData.instruments)
            .filter(instrumentId => !usedInstruments.includes(instrumentId));

        // stop if no unused instruments found
        if (unusedInstrumentIds.length === 0) {
            services.messageService.info(nls.localize(
                'vuengine/editors/sound/noUnusedInstrumentsFound',
                'No unused instruments could be found.'
            ));
            return;
        }

        const unusedInstrumentsNames = unusedInstrumentIds.map(instrumentId => soundData.instruments[instrumentId].name ?? 'unnamed');
        const ellipsis = unusedInstrumentsNames.length > MAX_UNUSED_INSTRUMENTS_TO_LIST ? '\n[…]' : '';
        const patternList = `• ${unusedInstrumentsNames.slice(0, MAX_UNUSED_INSTRUMENTS_TO_LIST).join('\n• ')}${ellipsis}`;

        const dialog = new ConfirmDialog({
            title: SoundEditorCommands.REMOVE_UNUSED_INSTRUMENTS.label,
            msg: `${nls.localize(
                'vuengine/editors/sound/confirmRemoveUnusedInstruments',
                "This will delete all instruments that are not currently used as a track's default instrument or in any pattern that is placed on a track.\n\
Are you sure you want to do this?\n\n\
A total of {0} instruments will be deleted.",
                unusedInstrumentsNames.length
            )}\n\n${patternList}`,
        });
        const confirmed = await dialog.open();
        if (confirmed) {
            // filter out unused
            const updatedInstruments = Object.fromEntries(
                Object.entries({ ...soundData.instruments })
                    .filter(([iId, i]) => !unusedInstrumentIds.includes(iId))
            );

            updateSoundData({
                ...soundData,
                instruments: updatedInstruments,
            });

            services.messageService.info(nls.localize(
                'vuengine/editors/sound/unusedInstrumentsDeleted',
                'Successfully deleted {0} unused instruments.',
                unusedInstrumentsNames.length
            ));
        }
    };

    const cleanDuplicatePatterns = async (): Promise<void> => {
        // get a map of all duplicate patterns, first appearances being the keys
        const processedPatternIds: string[] = [];
        const duplicatePatternsMap: Record<string, string[]> = {};
        const sortedPatternEntries = Object.entries(soundData.patterns)
            .sort(([patternIdA, patternConfigA], [patternIdB, patternConfigB]) =>
                getPatternName(soundData, patternIdA).localeCompare(getPatternName(soundData, patternIdB))
            );

        sortedPatternEntries.forEach(([patternId, patternConfig]) => {
            processedPatternIds.push(patternId);
            sortedPatternEntries.forEach(([comparePatternId, comparePatternConfig]) => {
                if (!processedPatternIds.includes(comparePatternId) && isEqual(
                    { ...patternConfig, name: '' },
                    { ...comparePatternConfig, name: '' }
                )) {
                    processedPatternIds.push(comparePatternId);
                    if (!duplicatePatternsMap[patternId]) {
                        duplicatePatternsMap[patternId] = [];
                    }

                    duplicatePatternsMap[patternId].push(comparePatternId);
                }
            });
        });
        const duplicatePatterns = Object.entries(duplicatePatternsMap);
        console.log('duplicatePatternsMap', duplicatePatternsMap);

        // stop if no unused patterns found
        if (duplicatePatterns.length === 0) {
            services.messageService.info(nls.localize(
                'vuengine/editors/sound/noDuplicatePatternsFound',
                'No duplicate patterns could be found.'
            ));
            return;
        }
        const ellipsis = duplicatePatterns.length > MAX_DUPLICATE_PATTERNS_TO_LIST ? '• […]' : '';
        let patternList = '';
        let numberOfPatternsToDelete = 0;
        Object.values(duplicatePatterns).forEach(([patternId, duplicatePatternIds], index) => {
            numberOfPatternsToDelete += duplicatePatternIds.length;
            if (index < MAX_DUPLICATE_PATTERNS_TO_LIST) {
                patternList += `• ${getPatternName(soundData, patternId)} → ${duplicatePatternIds.map(y => getPatternName(soundData, y)).join(', ')}\n`;
            }
        });
        patternList += ellipsis;

        // prompt
        const dialog = new ConfirmDialog({
            title: SoundEditorCommands.REMOVE_UNUSED_PATTERNS.label,
            msg: `${nls.localize(
                'vuengine/editors/sound/confirmCleanDuplicatePatterns',
                'This will remove all duplicate patterns and replace references with ones to the duplicated pattern.\n\
        Are you sure you want to do this?\n\n\
        A total of {0} patterns will be deleted.',
                numberOfPatternsToDelete
            )}\n\n${patternList}`,
            maxWidth: 376,
        });

        const confirmed = await dialog.open();
        if (confirmed) {
            let updatedTracks = deepClone(soundData.tracks);
            let updatedPatterns = Object.entries({ ...soundData.patterns });

            Object.values(duplicatePatterns).forEach(([patternId, duplicatePatternIds]) => {
                // filter out duplicate patterns
                duplicatePatternIds.forEach(duplicatePatternId => {
                    updatedPatterns = updatedPatterns.filter(([pId]) => pId !== duplicatePatternId);
                });

                updatedTracks = updatedTracks.map(track => ({
                    ...track,
                    sequence: Object.fromEntries(Object.entries(track.sequence).map(([step, pId]) => ([
                        step,
                        duplicatePatternIds.includes(pId) ? patternId : pId
                    ])))
                }));
                // replace all references with original pattern ID
            });

            updateSoundData({
                ...soundData,
                patterns: Object.fromEntries(updatedPatterns),
                tracks: updatedTracks,
            });

            services.messageService.info(nls.localize(
                'vuengine/editors/sound/duplicatePatternsCleaned',
                'Successfully cleaned up and deleted {0} duplicate patterns.',
                numberOfPatternsToDelete
            ));
        }
    };

    const commandListener = (commandId: string): void => {
        switch (commandId) {
            case SoundEditorCommands.REMOVE_UNUSED_PATTERNS.id:
                if (soundData.tracks.length > 0) {
                    removeUnusedPatterns();
                    setUtilitiesDialogOpen(false);
                    enableCommands();
                    focusEditor();
                }
                break;
            case SoundEditorCommands.REMOVE_UNUSED_INSTRUMENTS.id:
                if (soundData.tracks.length > 0) {
                    removeUnusedInstruments();
                    setUtilitiesDialogOpen(false);
                    enableCommands();
                    focusEditor();
                }
                break;
            case SoundEditorCommands.CLEAN_DUPLICATE_PATTERNS.id:
                if (soundData.tracks.length > 0) {
                    cleanDuplicatePatterns();
                    setUtilitiesDialogOpen(false);
                    enableCommands();
                    focusEditor();
                }
                break;
        }
    };

    useEffect(() => {
        setCommands([
            ...Object.values(SoundEditorCommands).map(c => c.id)
        ]);
    }, []);

    useEffect(() => {
        const disp = onCommandExecute(commandListener);
        return () => disp.dispose();
    }, [
        soundData,
    ]);

    return (
        <VContainer gap={15}>
            <ImportExport
                soundData={soundData}
            />
            {soundData.tracks.length > 0 &&
                <VContainer>
                    <label>
                        {nls.localize('vuengine/editors/sound/clean', 'Clean')}
                    </label>
                    <HContainer>
                        <button
                            className='theia-button secondary'
                            onClick={() => services.commandService.executeCommand(SoundEditorCommands.REMOVE_UNUSED_PATTERNS.id)}
                        >
                            {SoundEditorCommands.REMOVE_UNUSED_PATTERNS.label}
                        </button>
                        <button
                            className='theia-button secondary'
                            onClick={() => services.commandService.executeCommand(SoundEditorCommands.REMOVE_UNUSED_INSTRUMENTS.id)}
                        >
                            {SoundEditorCommands.REMOVE_UNUSED_INSTRUMENTS.label}
                        </button>
                    </HContainer>
                    <HContainer>
                        <button
                            className='theia-button secondary'
                            onClick={() => services.commandService.executeCommand(SoundEditorCommands.CLEAN_DUPLICATE_PATTERNS.id)}
                        >
                            {SoundEditorCommands.CLEAN_DUPLICATE_PATTERNS.label}
                        </button>
                    </HContainer>
                </VContainer>
            }
        </VContainer>
    );
}
