import { nls, PreferenceScope, PreferenceService } from '@theia/core';
import { HoverService } from '@theia/core/lib/browser';
import { PreferenceDataProperty } from '@theia/core/lib/common/preferences/preference-schema';
import React from 'react';
import styled from 'styled-components';
import HContainer from '../../../editors/browser/components/Common/Base/HContainer';
import Input from '../../../editors/browser/components/Common/Base/Input';
import RadioSelect from '../../../editors/browser/components/Common/Base/RadioSelect';
import Range from '../../../editors/browser/components/Common/Base/Range';
import VContainer from '../../../editors/browser/components/Common/Base/VContainer';
import HoverInfo from '../../../editors/browser/components/Common/HoverInfo';
import InfoLabel from '../../../editors/browser/components/Common/InfoLabel';
import {
    VesEmulatorPreferenceIds,
    VesEmulatorPreferenceSchema,
} from '../ves-emulator-preferences';

/**
 * The settings this window offers, in the order it offers them.
 *
 * Curated rather than "everything under the Emulator category", because most
 * of that category already has somewhere better to be edited: the rendering
 * mode and scale are toolbar controls, the palettes have a window of their
 * own, player 2's controls are part of Configure Input, and the emulator
 * configs have a whole view. Repeating those here would give two places to
 * change one thing and no clue which is authoritative.
 *
 * What is left is everything the emulator reads but never let anyone set —
 * which, before this window, meant opening the application's own preferences
 * to change how the emulator behaves.
 */
const SECTIONS: { title: string, ids: string[] }[] = [
    {
        title: nls.localize('vuengine/emulator/preferences/sections/rewind', 'Rewind'),
        ids: [
            // Reachable today only as a one-way prompt: pressing rewind while
            // it is off offers to turn it on, and nothing offers to turn it
            // off again.
            VesEmulatorPreferenceIds.EMULATOR_BUILTIN_REWIND_ENABLE,
            VesEmulatorPreferenceIds.EMULATOR_BUILTIN_REWIND_GRANULARITY,
            VesEmulatorPreferenceIds.EMULATOR_BUILTIN_REWIND_BUFFER_SIZE,
        ],
    },
    {
        title: nls.localize('vuengine/emulator/preferences/sections/speed', 'Speed'),
        ids: [
            VesEmulatorPreferenceIds.EMULATOR_BUILTIN_FAST_FORWARD_RATIO,
            VesEmulatorPreferenceIds.EMULATOR_BUILTIN_SLOW_MOTION_RATIO,
        ],
    },
    {
        title: nls.localize('vuengine/emulator/preferences/sections/saveData', 'Save Data'),
        ids: [VesEmulatorPreferenceIds.EMULATOR_BUILTIN_SRAM_INIT],
    },
];

/**
 * One category of settings.
 *
 * A fieldset rather than a heading and a group, because that is what this is:
 * a named set of related controls, which is the element's whole purpose and
 * what a screen reader announces when focus enters it. Styled here rather than
 * borrowing `.ves-emulator-vip-inspector-group`, which looks the same but is
 * named for a panel this has nothing to do with.
 */
const Section = styled.fieldset`
    border: var(--theia-border-width) solid var(--theia-editorGroup-border);
    border-radius: 2px;
    display: flex;
    flex-direction: column;
    gap: var(--theia-ui-padding);
    margin: 0;
    min-width: 0;
    padding: calc(var(--theia-ui-padding) * 2);

    legend {
        opacity: 0.7;
        padding: 0 var(--theia-ui-padding);
    }
`;

/**
 * The button that puts a setting back the way it came.
 *
 * Styled down to an icon rather than using `theia-button`, because it belongs
 * to the control beside it rather than standing on its own — the same weight a
 * clear or reveal affordance inside a field has.
 */
const ResetButton = styled.button`
    background: transparent;
    border: none;
    color: var(--theia-foreground);
    cursor: pointer;
    display: flex;
    margin: 0;
    min-width: unset;
    padding: 2px;

    &:disabled {
        cursor: default;
        opacity: 0.3;
    }

    &:not(:disabled):hover {
        color: var(--theia-focusBorder);
    }
`;

/** Wide enough for the longest text any of these takes, and no wider. */
const TEXT_WIDTH = 220;

/**
 * The emulator's own settings, editable without leaving it.
 *
 * Every control is built from the preference schema rather than written out by
 * hand: the label, the description, the type, the range and the choices all
 * come from the same declaration the application's preferences page reads. A
 * preference added to the schema and listed above therefore arrives here
 * complete, and one whose bounds change cannot end up described differently in
 * two places.
 */
export default function EmulatorPreferences(props: {
    preferenceService: PreferenceService,
    /**
     * Passed in rather than taken from a context: `InfoLabel` falls back to
     * the editors' context for one, and this window is not in an editor.
     */
    hoverService: HoverService,
}): React.JSX.Element {
    const { preferenceService, hoverService } = props;
    const [, setVersion] = React.useState(0);

    // Written elsewhere as well — the toolbar, the rewind prompt, another
    // window — so what is shown follows the preference rather than a local
    // copy of it.
    React.useEffect(() => {
        const listener = preferenceService.onPreferenceChanged(({ preferenceName }) => {
            if (preferenceName.startsWith('emulator.')) {
                setVersion(version => version + 1);
            }
        });
        return () => listener.dispose();
    }, [preferenceService]);

    const set = (id: string, value: unknown): void => {
        preferenceService.set(id, value, PreferenceScope.User);
    };

    const control = (id: string, schema: PreferenceDataProperty): React.ReactNode => {
        const value = preferenceService.get(id, schema.default);

        if (schema.type === 'boolean') {
            // The tooltip sits beside the label rather than inside it: an
            // InfoLabel here would give up the wrapping `<label>`, and with it
            // the ability to toggle the setting by clicking its name.
            return <HContainer alignItems="center" gap={5}>
                <label>
                    <input
                        type="checkbox"
                        checked={value === true}
                        onChange={e => set(id, e.target.checked)}
                    />
                    {' '}
                    {schema.title}
                </label>
                {schema.description &&
                    <HoverInfo tooltip={schema.description} hoverService={hoverService} />}
            </HContainer>;
        }

        if (schema.enum) {
            const labels = (schema as { enumItemLabels?: string[] }).enumItemLabels;
            return <RadioSelect
                options={schema.enum.map((option: unknown, index: number) => ({
                    value: String(option),
                    label: labels?.[index] ?? String(option),
                }))}
                defaultValue={String(value)}
                onChange={options => set(id, options[0].value)}
                hoverService={hoverService}
            />;
        }

        // A slider beside its number, which suits every numeric setting here:
        // each is a bounded quantity where the useful question is "how far
        // along the range", not "which exact value".
        if ((schema.type === 'number' || schema.type === 'integer')
            && schema.minimum !== undefined && schema.maximum !== undefined) {
            return <Range
                value={Number(value)}
                min={schema.minimum}
                max={schema.maximum}
                step={schema.multipleOf}
                setValue={next => set(id, next)}
                width='100%'
            />;
        }

        return <Input
            value={String(value ?? '')}
            type='string'
            width={TEXT_WIDTH}
            title={schema.title}
            setValue={next => set(id, next)}
        />;
    };

    /**
     * Put a setting back to what the schema says it should be.
     *
     * Removes the stored value rather than writing the default over it: the
     * two look the same today, but only the first leaves the setting following
     * the default if the default is ever changed.
     */
    const reset = (id: string, schema: PreferenceDataProperty): React.ReactNode => {
        const isDefault = preferenceService.get(id, schema.default) === schema.default;
        return <ResetButton
            disabled={isDefault}
            title={isDefault
                ? undefined
                : nls.localize('vuengine/general/resetToDefault', 'Reset to Default')}
            onClick={() => preferenceService.set(id, undefined, PreferenceScope.User)}
        >
            <i className="codicon codicon-discard" />
        </ResetButton>;
    };

    return <VContainer gap={10}>
        {SECTIONS.map(section => {
            const settings = section.ids
                .map(id => ({ id, schema: VesEmulatorPreferenceSchema.properties[id] }))
                // A listed preference that is not in the schema would render
                // as an empty row and say nothing about why; skipping it keeps
                // the window honest if the two ever drift apart.
                .filter(entry => entry.schema !== undefined);
            if (settings.length === 0) {
                return undefined;
            }

            return <Section key={section.title}>
                <legend>{section.title}</legend>
                <VContainer gap={10}>
                    {settings.map(({ id, schema }) => (
                        <VContainer key={id}>
                            {schema.type === 'boolean'
                                ? <HContainer alignItems="center" gap={5}>
                                    <div style={{ flexGrow: 1, minWidth: 0 }}>
                                        {control(id, schema)}
                                    </div>
                                    {reset(id, schema)}
                                </HContainer>
                                : <VContainer>
                                    <InfoLabel
                                        label={schema.title ?? id}
                                        tooltip={schema.description}
                                        hoverService={hoverService}
                                        style={{ flexGrow: 1, whiteSpace: 'normal' }}
                                    />
                                    <HContainer alignItems="center" gap={5}>
                                        {/* The control takes the width; the
                                            reset keeps to its icon. */}
                                        <div style={{ flexGrow: 1, minWidth: 0 }}>
                                            {control(id, schema)}
                                        </div>
                                        {reset(id, schema)}
                                    </HContainer>
                                </VContainer>}
                        </VContainer>
                    ))}
                </VContainer>
            </Section>;
        })}
    </VContainer>;
}
