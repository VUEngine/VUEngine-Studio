import { PreferenceScope, PreferenceService, deepClone, nls } from '@theia/core';
import { ConfirmDialog } from '@theia/core/lib/browser';
import React from 'react';
import styled from 'styled-components';
import {
    VB_ANAGLYPH_PALETTES,
    VB_DEFAULT_ANAGLYPH_PALETTE_ID,
    VB_DEFAULT_PALETTE_ID,
    VB_PALETTES,
} from '../../common/ves-vb-constants';
import VContainer from '../../../editors/browser/components/Common/Base/VContainer';
import { VesEmulatorPreferenceIds } from '../ves-emulator-preferences';
import {
    CustomAnaglyphPalette,
    CustomPalette,
    EMULATION_ANAGLYPH_PALETTES,
    EMULATION_PALETTES,
    getCustomPaletteId,
    formatColor,
    resolveAnaglyphPalette,
    resolvePalette,
    toVbPalette,
} from '../ves-emulator-types';

const StyledPalette = styled.button<{ selected?: boolean }>`
    align-items: center;
    background-color: ${p => p.selected ? 'var(--theia-list-activeSelectionBackground)' : 'var(--theia-secondaryButton-background)'};
    border: none;
    border-radius: 2px;
    box-sizing: border-box;
    color: var(--theia-foreground-color);
    cursor: pointer;
    display: flex;
    flex-direction: column;
    font-size: 80%;
    gap: 5px;
    min-height: 80px !important;
    overflow: hidden;
    padding: var(--theia-ui-padding) !important;
    width: 120px;

    &:focus,
    &:hover {
        outline: 1px solid var(--theia-button-background);
        outline-offset: 1px;
    }

    i {
        font-size: 120% !important;
        vertical-align: bottom;
    }

    div {      
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
`;

const StyledNewPalette = styled(StyledPalette)`
    background-color: transparent;
    border: 1px solid var(--theia-secondaryButton-background);

    i[class*='codicon-plus'] {
        color: var(--theia-secondaryButton-background);
        font-size: 180% !important;
    }
`;

export function PaletteSwatch(props: { colors: string[], small?: boolean }): React.JSX.Element {
    return <Swatch className={props.small ? 'small' : undefined}>
        {props.colors.map((color, level) =>
            <div key={level} style={{ backgroundColor: color }} />
        )}
    </Swatch>;
}

export function AnaglyphSwatch(props: { left: string, right: string, small?: boolean }): React.JSX.Element {
    return <Swatch className={props.small ? 'small' : undefined}>
        <div style={{ backgroundColor: props.left, gridRow: 'span 2' }} />
        <div style={{ backgroundColor: props.right, gridRow: 'span 2' }} />
    </Swatch>;
}

const Swatch = styled.div`
    border-radius: 2px;
    display: grid;
    grid-template-columns: 50% 50%;
    grid-template-rows: 50% 50%;
    height: 100%;
    overflow: hidden;
    width: 80px;

    &.small {
        width: 32px;
    }
`;

const PaletteLayout = styled(VContainer)`
    height: 100%;
    min-height: 0;
`;

const PaletteChoices = styled.div`
    flex-grow: 1;
    min-height: 0;
    overflow-y: auto;
`;

const PaletteList = styled.div`
    display: flex;
    flex-flow: wrap;
    gap: calc(var(--theia-ui-padding) * 2);
    padding: 2px;
`;

const ReadOnlyEntry = styled.div`
    align-items: center;
    background-color: var(--theia-list-activeSelectionBackground);
    border: 1px solid var(--theia-focusBorder);
    border-radius: 2px;
    color: var(--theia-list-activeSelectionForeground);
    display: flex;
    gap: var(--theia-ui-padding);
    padding: var(--theia-ui-padding);
`;

const ReadOnlyName = styled.div`
    flex-grow: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const PaletteEntry = styled.div <{ selected: boolean }>`
    align-items: center;
    background-color: ${p => p.selected ? 'var(--theia-list-activeSelectionBackground)' : 'transparent'};
    border: 1px solid ${p => p.selected ? 'var(--theia-focusBorder)' : 'var(--theia-dropdown-border)'};
    border-radius: 2px;
    color: ${p => p.selected ? 'var(--theia-list-activeSelectionForeground)' : 'inherit'};
    cursor: pointer;
    display: flex;
    padding: calc(var(--theia-ui-padding) / 2) var(--theia-ui-padding);
    gap: var(--theia-ui-padding);

    input[type="color"] {
        background-color: transparent;
        border: none;
        cursor: pointer;
        height: 22px;
        padding: 0;
        width: 24px;
    }

    button.theia-button {
        margin: 0;
        min-width: 24px;
    }
`;

const PaletteName = styled.div`
    flex-grow: 1;
    height: 16px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap !important;
    width: 100%;
`;

const DEFAULT_TINTS = VB_ANAGLYPH_PALETTES[VB_DEFAULT_ANAGLYPH_PALETTE_ID];

interface EmulatorPalettesProps {
    preferenceService: PreferenceService
    /** Whether the anaglyph pairs apply to the active rendering mode. */
    anaglyph: boolean
}

/**
 * Picks the colours the emulator shows the display in: a colour ramp for every
 * rendering mode that shows an eye on its own, and, while the Anaglyph mode is
 * active, the pair of tints it assigns to the two eyes.
 *
 * Selections take effect immediately, so the picture behind the window shows
 * what a palette actually looks like.
 */
export default function EmulatorPalettes(props: EmulatorPalettesProps): React.JSX.Element {
    const { preferenceService, anaglyph } = props;

    /**
     * Stored palettes with every colour filled in. settings.json is editable by
     * hand, and a palette missing a level would otherwise reach a colour input
     * as undefined; a missing level falls back to the default palette's.
     */
    const readCustomPalettes = (): CustomPalette[] =>
        preferenceService.get<CustomPalette[]>(
            VesEmulatorPreferenceIds.EMULATOR_BUILTIN_CUSTOM_PALETTES, []
        ).map(entry => ({
            name: entry.name ?? '',
            colors: toVbPalette(entry.colors ?? []).map(formatColor),
        }));

    const readCustomAnaglyphPalettes = (): CustomAnaglyphPalette[] =>
        preferenceService.get<CustomAnaglyphPalette[]>(
            VesEmulatorPreferenceIds.EMULATOR_BUILTIN_CUSTOM_ANAGLYPH_PALETTES, []
        ).map(entry => ({
            name: entry.name ?? '',
            left: entry.left ?? formatColor(DEFAULT_TINTS.left),
            right: entry.right ?? formatColor(DEFAULT_TINTS.right),
        }));

    const [palette, setPalette] = React.useState<string>(
        preferenceService.get(VesEmulatorPreferenceIds.EMULATOR_BUILTIN_PALETTE, VB_DEFAULT_PALETTE_ID)
    );
    const [anaglyphPalette, setAnaglyphPalette] = React.useState<string>(
        preferenceService.get(VesEmulatorPreferenceIds.EMULATOR_BUILTIN_ANAGLYPH_PALETTE, VB_DEFAULT_ANAGLYPH_PALETTE_ID)
    );
    const [customPalettes, setCustomPalettes] = React.useState<CustomPalette[]>(readCustomPalettes);
    const [customAnaglyphPalettes, setCustomAnaglyphPalettes] =
        React.useState<CustomAnaglyphPalette[]>(readCustomAnaglyphPalettes);

    const update = (preferenceId: string, value: unknown) =>
        preferenceService.set(preferenceId, value, PreferenceScope.User);

    const select = (id: string) =>
        update(VesEmulatorPreferenceIds.EMULATOR_BUILTIN_PALETTE, id);

    const selectAnaglyph = (id: string) =>
        update(VesEmulatorPreferenceIds.EMULATOR_BUILTIN_ANAGLYPH_PALETTE, id);

    /** A name no palette in the given list carries yet. */
    const newName = (taken: { name: string }[]): string => {
        const base = nls.localize('vuengine/emulator/palettes/custom', 'Custom');
        let name = base;
        let index = 1;
        while (taken.some(entry => entry.name === name)) {
            name = `${base} ${++index}`;
        }
        return name;
    };

    const addPalette = async () => {
        const name = newName(customPalettes);
        // Starts from the palette in use, so a custom one is a tweak of what
        // the picture already looks like rather than a blank slate.
        const colors = resolvePalette(palette, customPalettes).map(formatColor);
        await update(VesEmulatorPreferenceIds.EMULATOR_BUILTIN_CUSTOM_PALETTES, [
            ...customPalettes,
            { name, colors },
        ]);
        select(getCustomPaletteId(name));
    };

    const addAnaglyphPalette = async () => {
        const name = newName(customAnaglyphPalettes);
        await update(VesEmulatorPreferenceIds.EMULATOR_BUILTIN_CUSTOM_ANAGLYPH_PALETTES, [
            ...customAnaglyphPalettes,
            { name, left: '#ff0000', right: '#00ffff' },
        ]);
        selectAnaglyph(getCustomPaletteId(name));
    };

    /**
     * Typing and dragging a colour picker are shown right away but only written
     * to the preferences once the field is done with, so that a rename does not
     * cost a settings write per keystroke.
     */
    const editPalette = async (index: number, changes: Partial<CustomPalette>, persist = true) => {
        const updated = deepClone(customPalettes);
        const previousName = updated[index].name;
        updated[index] = { ...updated[index], ...changes };
        if (!persist) {
            setCustomPalettes(updated);
            return;
        }
        await update(VesEmulatorPreferenceIds.EMULATOR_BUILTIN_CUSTOM_PALETTES, updated);
        // A renamed palette is a new id, so a selection pointing at it follows.
        if (changes.name !== undefined && palette === getCustomPaletteId(previousName)) {
            select(getCustomPaletteId(changes.name));
        }
    };

    const editPaletteColor = (index: number, level: number, color: string, persist = true) => {
        const colors = [...customPalettes[index].colors];
        colors[level] = color;
        return editPalette(index, { colors }, persist);
    };

    const editAnaglyphPalette = async (index: number, changes: Partial<CustomAnaglyphPalette>, persist = true) => {
        const updated = deepClone(customAnaglyphPalettes);
        const previousName = updated[index].name;
        updated[index] = { ...updated[index], ...changes };
        if (!persist) {
            setCustomAnaglyphPalettes(updated);
            return;
        }
        await update(VesEmulatorPreferenceIds.EMULATOR_BUILTIN_CUSTOM_ANAGLYPH_PALETTES, updated);
        if (changes.name !== undefined && anaglyphPalette === getCustomPaletteId(previousName)) {
            selectAnaglyph(getCustomPaletteId(changes.name));
        }
    };

    const confirmRemove = async (name: string): Promise<boolean> => {
        const dialog = new ConfirmDialog({
            title: nls.localize('vuengine/emulator/palettes/removePalette', 'Remove Palette'),
            msg: nls.localize(
                'vuengine/emulator/palettes/areYouSureYouWantToRemove',
                'Are you sure you want to remove the palette "{0}"?',
                name
            ),
        });
        return !!await dialog.open();
    };

    const removePalette = async (index: number) => {
        const removed = customPalettes[index];
        if (!await confirmRemove(removed.name)) {
            return;
        }
        await update(
            VesEmulatorPreferenceIds.EMULATOR_BUILTIN_CUSTOM_PALETTES,
            customPalettes.filter((entry, i) => i !== index)
        );
        if (palette === getCustomPaletteId(removed.name)) {
            select(VB_DEFAULT_PALETTE_ID);
        }
    };

    const removeAnaglyphPalette = async (index: number) => {
        const removed = customAnaglyphPalettes[index];
        if (!await confirmRemove(removed.name)) {
            return;
        }
        await update(
            VesEmulatorPreferenceIds.EMULATOR_BUILTIN_CUSTOM_ANAGLYPH_PALETTES,
            customAnaglyphPalettes.filter((entry, i) => i !== index)
        );
        if (anaglyphPalette === getCustomPaletteId(removed.name)) {
            selectAnaglyph(VB_DEFAULT_ANAGLYPH_PALETTE_ID);
        }
    };

    React.useEffect(() => {
        const listener = preferenceService.onPreferenceChanged(({ preferenceName }) => {
            switch (preferenceName) {
                case VesEmulatorPreferenceIds.EMULATOR_BUILTIN_PALETTE:
                    return setPalette(preferenceService.get(
                        VesEmulatorPreferenceIds.EMULATOR_BUILTIN_PALETTE, VB_DEFAULT_PALETTE_ID
                    ));
                case VesEmulatorPreferenceIds.EMULATOR_BUILTIN_ANAGLYPH_PALETTE:
                    return setAnaglyphPalette(preferenceService.get(
                        VesEmulatorPreferenceIds.EMULATOR_BUILTIN_ANAGLYPH_PALETTE, VB_DEFAULT_ANAGLYPH_PALETTE_ID
                    ));
                case VesEmulatorPreferenceIds.EMULATOR_BUILTIN_CUSTOM_PALETTES:
                    return setCustomPalettes(readCustomPalettes());
                case VesEmulatorPreferenceIds.EMULATOR_BUILTIN_CUSTOM_ANAGLYPH_PALETTES:
                    return setCustomAnaglyphPalettes(readCustomAnaglyphPalettes());
            }
        });
        return () => listener.dispose();
    }, [preferenceService]);

    /**
     * The palette in use, when it is one of the project's own.
     *
     * Undefined for a built-in, which is the signal to show it read-only: the
     * index is what every edit needs, and a built-in has none.
     */
    const selectedPalette = React.useMemo(() => {
        const index = customPalettes.findIndex(
            entry => getCustomPaletteId(entry.name) === palette
        );
        return index < 0 ? undefined : { index, palette: customPalettes[index] };
    }, [customPalettes, palette]);

    const selectedAnaglyphPalette = React.useMemo(() => {
        const index = customAnaglyphPalettes.findIndex(
            entry => getCustomPaletteId(entry.name) === anaglyphPalette
        );
        return index < 0 ? undefined : { index, palette: customAnaglyphPalettes[index] };
    }, [customAnaglyphPalettes, anaglyphPalette]);

    const currentAnaglyph = resolveAnaglyphPalette(anaglyphPalette, customAnaglyphPalettes);

    return <>
        {!anaglyph &&
            <PaletteLayout gap={20}>
                <PaletteChoices>
                    <VContainer gap={20}>
                        <VContainer>
                            <label>
                                {nls.localize('vuengine/emulator/palettes/defaultPalettes', 'Default Palettes')}
                            </label>
                            <PaletteList>
                                {Object.keys(VB_PALETTES).map(id =>
                                    <StyledPalette
                                        key={id}
                                        selected={palette === id}
                                        onClick={() => select(id)}
                                        onKeyDown={() => select(id)}
                                    >
                                        <PaletteSwatch colors={VB_PALETTES[id].map(formatColor)} />
                                        <PaletteName>{EMULATION_PALETTES[id] ?? id}</PaletteName>
                                    </StyledPalette>
                                )}
                            </PaletteList>
                        </VContainer>
                        <VContainer>
                            <label>
                                {nls.localize('vuengine/emulator/palettes/customPalettes', 'Custom Palettes')}
                            </label>
                            <PaletteList>
                                {customPalettes.map((customPalette, index) => {
                                    const id = getCustomPaletteId(customPalette.name);
                                    return <StyledPalette
                                        key={`custom-${index}`}
                                        selected={palette === id}
                                        onClick={() => select(id)}
                                        onKeyDown={() => select(id)}
                                    >
                                        <PaletteSwatch colors={customPalette.colors} />
                                        <PaletteName>{customPalette.name}</PaletteName>
                                    </StyledPalette>;
                                })}
                                <StyledNewPalette onClick={addPalette}>
                                    <VContainer justifyContent='center' grow={1}>
                                        <i className='codicon codicon-plus' />
                                    </VContainer>
                                    <div>
                                        {nls.localize('vuengine/emulator/palettes/newPalette', 'New Palette')}
                                    </div>
                                </StyledNewPalette>
                            </PaletteList>
                        </VContainer>
                    </VContainer>
                </PaletteChoices>
                <VContainer>
                    <div>
                        {nls.localize('vuengine/emulator/palettes/current', 'Current')}
                    </div>
                    {selectedPalette
                        ? <PaletteEntry key={`custom-${selectedPalette.index}`} selected={true}>
                            <input
                                type="text"
                                className="theia-input"
                                style={{ flexGrow: 1, width: 0 }}
                                spellCheck={false}
                                value={selectedPalette.palette.name}
                                onBlur={e => editPalette(selectedPalette.index, { name: e.target.value })}
                                onChange={e => editPalette(selectedPalette.index, { name: e.target.value }, false)}
                            />
                            {selectedPalette.palette.colors.map((color, level) =>
                                <input
                                    key={level}
                                    type="color"
                                    value={color}
                                    onBlur={e => editPaletteColor(selectedPalette.index, level, e.target.value)}
                                    onChange={e => editPaletteColor(selectedPalette.index, level, e.target.value, false)}
                                />
                            )}
                            <button
                                className="theia-button secondary"
                                title={nls.localizeByDefault('Remove')}
                                onClick={() => removePalette(selectedPalette.index)}
                            >
                                <i className="codicon codicon-trash" />
                            </button>
                        </PaletteEntry>
                        : <ReadOnlyEntry>
                            <ReadOnlyName>{EMULATION_PALETTES[palette] ?? palette}</ReadOnlyName>
                            <PaletteSwatch colors={resolvePalette(palette, customPalettes).map(formatColor)} />
                        </ReadOnlyEntry>
                    }
                </VContainer>
            </PaletteLayout>
        }
        {anaglyph &&
            <PaletteLayout gap={20}>
                <PaletteChoices>
                    <VContainer gap={20}>
                        <VContainer>
                            <label>
                                {nls.localize('vuengine/emulator/palettes/defaultPalettes', 'Default Palettes')}
                            </label>
                            <PaletteList>
                                {Object.keys(VB_ANAGLYPH_PALETTES).map(id =>
                                    <StyledPalette
                                        key={id}
                                        selected={anaglyphPalette === id}
                                        onClick={() => selectAnaglyph(id)}
                                        onKeyDown={() => selectAnaglyph(id)}
                                    >
                                        <AnaglyphSwatch
                                            left={formatColor(VB_ANAGLYPH_PALETTES[id].left)}
                                            right={formatColor(VB_ANAGLYPH_PALETTES[id].right)}
                                        />
                                        <PaletteName>{EMULATION_ANAGLYPH_PALETTES[id] ?? id}</PaletteName>
                                    </StyledPalette>
                                )}
                            </PaletteList>
                        </VContainer>
                        <VContainer>
                            <label>
                                {nls.localize('vuengine/emulator/palettes/customPalettes', 'Custom Palettes')}
                            </label>
                            <PaletteList>
                                {customAnaglyphPalettes.map((customPalette, index) => {
                                    const id = getCustomPaletteId(customPalette.name);
                                    return <StyledPalette
                                        key={`custom-${index}`}
                                        selected={anaglyphPalette === id}
                                        onClick={() => selectAnaglyph(id)}
                                        onKeyDown={() => selectAnaglyph(id)}
                                    >
                                        <AnaglyphSwatch left={customPalette.left} right={customPalette.right} />
                                        <PaletteName>{customPalette.name}</PaletteName>
                                    </StyledPalette>;
                                })}
                                <StyledNewPalette onClick={addAnaglyphPalette}>
                                    <VContainer justifyContent='center' grow={1}>
                                        <i className='codicon codicon-plus' />
                                    </VContainer>
                                    <div>
                                        {nls.localize('vuengine/emulator/palettes/newPalette', 'New Palette')}
                                    </div>
                                </StyledNewPalette>
                            </PaletteList>
                        </VContainer>
                    </VContainer>
                </PaletteChoices>
                <VContainer>
                    <div>
                        {nls.localize('vuengine/emulator/palettes/current', 'Current')}
                    </div>
                    {selectedAnaglyphPalette
                        ? <PaletteEntry key={`custom-${selectedAnaglyphPalette.index}`} selected={true}>
                            <input
                                type="text"
                                className="theia-input"
                                style={{ flexGrow: 1, width: 0 }}
                                spellCheck={false}
                                value={selectedAnaglyphPalette.palette.name}
                                onBlur={e => editAnaglyphPalette(
                                    selectedAnaglyphPalette.index, { name: e.target.value }
                                )}
                                onChange={e => editAnaglyphPalette(
                                    selectedAnaglyphPalette.index, { name: e.target.value }, false
                                )}
                            />
                            <input
                                type="color"
                                title={nls.localize('vuengine/emulator/palettes/leftEyeTint', 'Tint of the left eye')}
                                value={selectedAnaglyphPalette.palette.left}
                                onBlur={e => editAnaglyphPalette(
                                    selectedAnaglyphPalette.index, { left: e.target.value }
                                )}
                                onChange={e => editAnaglyphPalette(
                                    selectedAnaglyphPalette.index, { left: e.target.value }, false
                                )}
                            />
                            <input
                                type="color"
                                title={nls.localize('vuengine/emulator/palettes/rightEyeTint', 'Tint of the right eye')}
                                value={selectedAnaglyphPalette.palette.right}
                                onBlur={e => editAnaglyphPalette(
                                    selectedAnaglyphPalette.index, { right: e.target.value }
                                )}
                                onChange={e => editAnaglyphPalette(
                                    selectedAnaglyphPalette.index, { right: e.target.value }, false
                                )}
                            />
                            <button
                                className="theia-button secondary"
                                title={nls.localizeByDefault('Remove')}
                                onClick={() => removeAnaglyphPalette(selectedAnaglyphPalette.index)}
                            >
                                <i className="codicon codicon-trash" />
                            </button>
                        </PaletteEntry>
                        : <ReadOnlyEntry>
                            <ReadOnlyName>
                                {EMULATION_ANAGLYPH_PALETTES[anaglyphPalette] ?? anaglyphPalette}
                            </ReadOnlyName>
                            <AnaglyphSwatch
                                left={formatColor(currentAnaglyph.left)}
                                right={formatColor(currentAnaglyph.right)}
                            />
                        </ReadOnlyEntry>
                    }
                </VContainer>
            </PaletteLayout>
        }
    </>;
}
