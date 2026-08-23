import * as React from '@theia/core/shared/react';

/**
 * The rows of a detail view: the label/value pairs the Worlds and Objects
 * panels put under their tables, and the number input they edit them with.
 *
 * Kept out of the panels themselves because both build the same kind of view
 * over different structures, and a field that reads one way in one of them and
 * another way in the other would be worse than either.
 */

/** A read-only label/value pair. */
export function field(label: string, value: React.ReactNode, hint?: string): React.JSX.Element {
    return <div className='ves-emulator-vip-detail-field' key={label} title={hint}>
        <span className='label'>{label}</span>
        <span className='value'>{value}</span>
    </div>;
}

/**
 * The same pair, with an editable control in place of the value.
 *
 * `wide` gives the row the whole width of its group rather than one column of
 * it, for a control that needs the room — a name, rather than a number.
 */
export function control(label: string, input: React.ReactNode, hint?: string, wide = false): React.JSX.Element {
    return <div className={`ves-emulator-vip-detail-field${wide ? ' wide' : ''}`} key={label} title={hint}>
        <span className='label'>{label}</span>
        {input}
    </div>;
}

/**
 * A number input that writes every keystroke straight through.
 *
 * Committing per keystroke rather than on blur is what makes editing work at
 * all here: the panels poll, so anything not written back is overwritten by
 * the next refresh a fraction of a second later. A value that does not parse
 * — the empty field left behind by selecting all and typing, say — is
 * dropped rather than written as a zero.
 */
export function numberInput(
    value: number,
    min: number,
    max: number,
    commit: (value: number) => void,
    step?: number
): React.JSX.Element {
    return <input
        type='number'
        className='theia-input'
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => {
            const parsed = parseInt(e.target.value, 10);
            if (!Number.isNaN(parsed)) {
                commit(Math.min(max, Math.max(min, parsed)));
            }
        }}
    />;
}
