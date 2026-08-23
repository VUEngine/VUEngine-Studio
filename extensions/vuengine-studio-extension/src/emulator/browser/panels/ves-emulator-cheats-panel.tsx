import { BracketsSquare, Plus, Trash } from '@phosphor-icons/react';
import { nls } from '@theia/core';
import { ConfirmDialog } from '@theia/core/lib/browser';
import * as React from '@theia/core/shared/react';
import EmptyContainer from '../../../editors/browser/components/Common/EmptyContainer';
import {
    formatVesCheatCode,
    parseVesCheatCode,
    VES_CHEAT_DEFAULT_DIGITS,
    VES_CHEAT_DIGITS,
    VesCheat,
    VesCheatCode,
    vesCheatMaxValue,
} from '../../common/ves-emulator-cheats';
import { VesEmulatorCheatStore } from '../ves-emulator-cheat-store';
import { EmulatorPanelType, VesEmulatorDebugSource, VesEmulatorPanel } from './ves-emulator-panel';
import { control, field } from './ves-emulator-vip-detail';

/** What a new cheat, and a new code, start out as. */
const NEW_CHEAT_ADDRESS = 0x05000000;

/**
 * The cheats kept beside the ROM: named sets of writes the core repeats every
 * frame, which is what holds a value against a game that keeps changing it.
 *
 * The list on top is every cheat in the file, with the selected one's name,
 * switch and codes editable below it. Everything here edits the store, which
 * owns the list, writes the file and pushes the enabled writes into the core —
 * so a cheat stays on with this panel closed, and the panel is only a view of
 * it. That is also why nothing is polled: the store says when to redraw.
 */
export class VesEmulatorCheatsPanel extends VesEmulatorPanel {

    protected selected = 0;

    constructor(
        source: VesEmulatorDebugSource,
        instanceId: string,
        protected readonly cheats: VesEmulatorCheatStore
    ) {
        super(EmulatorPanelType.CHEATS, source, instanceId);
        this.title.label = nls.localize('vuengine/emulator/panels/cheats', 'Cheats');
        this.addClass('ves-emulator-vip-split');
        this.toDispose.push(this.cheats.onDidChange(() => this.update()));
    }

    /**
     * Nothing here comes from the running simulation, so there is nothing to
     * poll for: the store fires when the list changes, and that is the only
     * thing this panel draws. Not polling is also what lets the name field be
     * an ordinary text input rather than one fighting a refresh.
     */
    protected startPolling(): void {
        this.refresh();
    }

    protected refresh(): void {
        this.update();
    }

    protected select(index: number): void {
        this.selected = Math.min(Math.max(0, index), Math.max(0, this.cheats.list.length - 1));
        this.update();
    }

    protected addCheat(): void {
        this.selected = this.cheats.add(nls.localize('vuengine/emulator/cheats/newCheat', 'New cheat'));
    }

    /**
     * Delete a cheat, once the user has confirmed it.
     *
     * Worth asking about: the row's only handle is a small button beside a
     * checkbox people click often, and a cheat is typed in by hand — a
     * misclick would throw away work with nothing to undo it, and removing the
     * last one takes the file with it.
     */
    protected async removeCheat(index: number): Promise<void> {
        const cheat = this.cheats.list[index];
        if (!cheat) {
            return;
        }
        const dialog = new ConfirmDialog({
            title: nls.localize('vuengine/emulator/cheats/deleteCheatQuestion', 'Delete Cheat?'),
            msg: nls.localize(
                'vuengine/emulator/cheats/areYouSureYouWantToDelete',
                'Are you sure you want to delete {0}?',
                cheat.description || nls.localize('vuengine/emulator/cheats/thisCheat', 'this cheat'),
            ),
        });
        if (await dialog.open()) {
            this.cheats.remove(index);
            this.select(this.selected);
        }
    }

    /** Replace one of a cheat's codes, or drop it when `code` is undefined. */
    protected setCode(cheat: VesCheat, index: number, code: VesCheatCode | undefined): void {
        const codes = [...cheat.codes];
        if (code) {
            codes[index] = code;
        } else {
            codes.splice(index, 1);
        }
        this.cheats.update(this.selected, { codes });
    }

    protected addCode(cheat: VesCheat): void {
        this.cheats.update(this.selected, {
            codes: [
                ...cheat.codes,
                { address: NEW_CHEAT_ADDRESS, value: 0, digits: VES_CHEAT_DEFAULT_DIGITS },
            ],
        });
    }

    protected render(): React.ReactNode {
        const cheats = this.cheats.list;
        const selected = Math.min(this.selected, Math.max(0, cheats.length - 1));
        const cheat = cheats[selected];

        /*
        if (!this.cheats.isLoaded) {
            return <EmptyContainer
                title={nls.localize('vuengine/emulator/cheats/noCheatFile', 'No cheat file for this ROM yet.')}
            />;
        }
        */
        if (cheats.length === 0) {
            return <EmptyContainer
                title={nls.localize('vuengine/emulator/cheats/noCheat', 'No cheats have been configured')}
                description={nls.localize('vuengine/emulator/cheats/noCheatDescription', 'Add cheats to pin certain memory addresses to a given value.')}
                icon={<BracketsSquare size={32} />}
                buttonIconCls='codicon codicon-add'
                buttonLabel={nls.localize('vuengine/emulator/cheats/addCheat', 'Add Cheat')}
                onClick={this.addCheat.bind(this)}
            />;
        }

        return <>
            <div className='ves-emulator-panel-toolbar'>
                <button className='theia-button secondary' onClick={() => this.addCheat()}>
                    <Plus size={12} />
                    {nls.localize('vuengine/emulator/cheats/addCheat', 'Add Cheat')}
                </button>
                <span className='ves-emulator-vip-footer'>{this.cheats.fileUri?.path.base ?? ''}</span>
            </div>
            <div className='ves-emulator-vip-split-table'>
                <fieldset className='ves-emulator-vip-inspector-group'>
                    <legend>
                        {nls.localize('vuengine/emulator/cheats/cheats', 'Cheats')}
                    </legend>
                    <table className='ves-emulator-vip-table ves-emulator-vip-selectable-table ves-emulator-cheats-table'>
                        <thead>
                            <tr>
                                <th>{nls.localize('vuengine/emulator/cheats/on', 'On')}</th>
                                <th>{nls.localizeByDefault('Name')}</th>
                                <th title={nls.localize('vuengine/emulator/cheats/codesHint', 'Address and value of each write')}>
                                    {nls.localize('vuengine/emulator/cheats/codes', 'Codes')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {cheats.map((entry, index) => (
                                <tr
                                    key={index}
                                    className={`${entry.enabled ? '' : 'inactive'}${index === selected ? ' selected' : ''}`}
                                    onClick={() => this.select(index)}
                                >
                                    <td>
                                        <input
                                            type='checkbox'
                                            checked={entry.enabled}
                                            onChange={e => this.cheats.update(index, { enabled: e.target.checked })}
                                        />
                                    </td>
                                    <td className='name'>{entry.description}</td>
                                    <td className='name'>{entry.codes.map(formatVesCheatCode).join(' ')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </fieldset>
            </div>
            {cheat
                ? this.renderDetail(cheat)
                : <div className='ves-emulator-vip-footer'>
                    {nls.localize('vuengine/emulator/cheats/empty', 'No cheats yet. Add one to get started.')}
                </div>}
        </>;
    }

    protected renderDetail(cheat: VesCheat): React.ReactNode {
        return <div className='ves-emulator-vip-detail'>
            <div className='ves-emulator-vip-detail-groups'>
                <fieldset className='ves-emulator-vip-inspector-group'>
                    <legend>{nls.localize('vuengine/emulator/cheats/cheat', 'Cheat')}</legend>
                    <div className='ves-emulator-vip-detail-fields'>
                        {control(
                            nls.localizeByDefault('Name'),
                            <input
                                className='theia-input'
                                value={cheat.description}
                                onChange={e => this.cheats.update(this.selected, { description: e.target.value })}
                            />,
                            undefined,
                            true
                        )}
                        {field(
                            nls.localize('vuengine/emulator/cheats/writes', 'Writes'),
                            `${cheat.codes.length}`
                        )}
                    </div>
                    <div className='ves-emulator-vip-detail-flags'>
                        <label>
                            <input
                                type='checkbox'
                                checked={cheat.enabled}
                                onChange={e => this.cheats.update(this.selected, { enabled: e.target.checked })}
                            />
                            {nls.localize('vuengine/emulator/cheats/enabled', 'Enabled')}
                        </label>
                        <button className='theia-button secondary' onClick={() => this.removeCheat(this.selected)}>
                            <Trash size={12} />
                            {nls.localize('vuengine/emulator/cheats/removeCheat', 'Remove Cheat')}
                        </button>
                    </div>
                </fieldset>

                {this.renderCodesGroup(cheat)}
            </div>
        </div>;
    }

    /**
     * One row per write: where it goes, what it writes, and how wide the write
     * is. The address is typed in hexadecimal, since that is how every
     * published code is written; the value follows it so the two read the way
     * the file spells them, `ADDRESS:VALUE`.
     */
    protected renderCodesGroup(cheat: VesCheat): React.ReactNode {
        return <fieldset className='ves-emulator-vip-inspector-group'>
            <legend>{nls.localize('vuengine/emulator/cheats/codes', 'Codes')}</legend>
            {cheat.codes.map((code, index) => (
                <div className='ves-emulator-cheats-code' key={index}>
                    <input
                        className='theia-input address'
                        value={(code.address >>> 0).toString(16).toUpperCase()}
                        spellCheck={false}
                        title={nls.localize('vuengine/emulator/cheats/addressHint', 'Address to write to, in hexadecimal')}
                        onChange={e => {
                            const address = parseInt(e.target.value, 16);
                            if (!Number.isNaN(address)) {
                                this.setCode(cheat, index, { ...code, address: address >>> 0 });
                            }
                        }}
                    />
                    <span className='separator'>:</span>
                    <input
                        className='theia-input value'
                        value={(code.value >>> 0).toString(16).toUpperCase().padStart(code.digits, '0')}
                        spellCheck={false}
                        title={nls.localize('vuengine/emulator/cheats/valueHint', 'Value to write, in hexadecimal')}
                        onChange={e => {
                            const value = parseInt(e.target.value, 16);
                            if (!Number.isNaN(value)) {
                                this.setCode(cheat, index, {
                                    ...code,
                                    value: Math.min(vesCheatMaxValue(code.digits), value >>> 0),
                                });
                            }
                        }}
                    />
                    <select
                        className='theia-select'
                        value={code.digits}
                        title={nls.localize('vuengine/emulator/cheats/widthHint', 'How wide the write is')}
                        onChange={e => {
                            const digits = parseInt(e.target.value, 10);
                            this.setCode(cheat, index, {
                                ...code,
                                digits,
                                value: Math.min(vesCheatMaxValue(digits), code.value),
                            });
                        }}
                    >
                        {VES_CHEAT_DIGITS.map(digits => (
                            <option key={digits} value={digits}>{digits * 4} bit</option>
                        ))}
                    </select>
                    <button
                        className='ves-emulator-cheats-remove'
                        title={nls.localize('vuengine/emulator/cheats/removeCode', 'Remove code')}
                        onClick={() => this.setCode(cheat, index, undefined)}
                    >
                        <Trash size={12} />
                    </button>
                </div>
            ))}
            <div className='ves-emulator-cheats-code'>
                <button className='theia-button secondary' onClick={() => this.addCode(cheat)}>
                    <Plus size={12} />
                    {nls.localize('vuengine/emulator/cheats/addCode', 'Add Code')}
                </button>
                <input
                    className='theia-input paste'
                    placeholder={nls.localize('vuengine/emulator/cheats/paste', 'Paste a code, e.g. 50091A4:0001')}
                    spellCheck={false}
                    onKeyDown={e => {
                        if (e.key !== 'Enter') {
                            return;
                        }
                        const pasted = parseVesCheatCode(e.currentTarget.value);
                        if (pasted) {
                            this.cheats.update(this.selected, { codes: [...cheat.codes, pasted] });
                            e.currentTarget.value = '';
                        }
                    }}
                />
            </div>
        </fieldset>;
    }
}
