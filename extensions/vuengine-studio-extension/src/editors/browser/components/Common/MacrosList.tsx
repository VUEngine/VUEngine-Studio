import { nls } from '@theia/core';
import { ConfirmDialog } from '@theia/core/lib/browser';
import { SelectComponent } from '@theia/core/lib/browser/widgets/select-component';
import React, { useContext } from 'react';
import VContainer from './Base/VContainer';
import { EditorsContext, EditorsContextType } from '../../ves-editors-types';
import HContainer from './Base/HContainer';
import { toUpperSnakeCase } from './Utils';

export enum MacroType {
    Boolean = 'boolean',
    Define = 'define',
    Macro = 'macro',
    Number = 'number',
    Text = 'text',
    Undefine = 'undefine',
}

export interface MacroData {
    _id: string
    enabled: boolean
    name: string
    type: MacroType
    value: any
}

interface MacrosListProps {
    data: MacroData[]
    updateData: (data: MacroData[]) => void
}

export default function MacrosList(props: MacrosListProps): React.JSX.Element {
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const { data, updateData } = props;

    const addMacro = (): void => {
        updateData([
            ...(data ?? []),
            {
                _id: services.vesCommonService.nanoid(),
                enabled: true,
                name: '',
                type: MacroType.Define,
                value: '',
            }
        ]);
    };

    const removeMacro = async (index: number): Promise<void> => {
        const dialog = new ConfirmDialog({
            title: nls.localize('vuengine/macrosList/removeMacro', 'Remove Macro'),
            msg: nls.localize('vuengine/macrosList/areYouSureYouWantToRemoveMacro', 'Are you sure you want to remove this macro?'),
        });
        const confirmed = await dialog.open();
        if (confirmed) {
            updateData([
                ...(data?.slice(0, index) ?? []),
                ...(data?.slice(index + 1) ?? [])
            ]);
        }
    };

    const setMacro = async (index: number, value: MacroData): Promise<void> => {
        updateData([
            ...(data?.slice(0, index) ?? []),
            value,
            ...(data?.slice(index + 1) ?? [])
        ]);
    };

    return (
        <VContainer>
            {data?.length > 0
                ? <table>
                    <thead>
                        <tr>
                            <th align="left">
                                {nls.localize('vuengine/macrosList/enabled', 'Enabled')}
                            </th>
                            <th align="left" style={{ width: '30%' }}>
                                {nls.localize('vuengine/macrosList/name', 'Name')}
                            </th>
                            <th align="left">
                                {nls.localize('vuengine/macrosList/type', 'Type')}
                            </th>
                            <th align="left" style={{ width: '70%' }}>
                                {nls.localize('vuengine/macrosList/value', 'Value')}
                            </th>
                            <th align="left">
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            data?.sort((a, b) => a.name.localeCompare(b.name))
                                .map((macro, index) => (
                                    <tr key={macro._id ?? index}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={macro.enabled ?? true}
                                                onChange={e => setMacro(index, {
                                                    ...macro,
                                                    enabled: !(macro.enabled ?? true),
                                                })}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                className='theia-input full-width'
                                                value={macro.name}
                                                autoFocus={macro.name === ''}
                                                onChange={e => setMacro(index, {
                                                    ...macro,
                                                    name: e.target.value,
                                                })}
                                            />
                                        </td>
                                        <td>
                                            <SelectComponent
                                                options={[{
                                                    value: MacroType.Boolean,
                                                    label: nls.localize('vuengine/macrosList/type/boolean', 'Boolean'),
                                                }, {
                                                    value: MacroType.Define,
                                                    label: '#define',
                                                }, {
                                                    value: MacroType.Macro,
                                                    label: nls.localize('vuengine/macrosList/type/macro', 'Macro'),
                                                }, {
                                                    value: MacroType.Number,
                                                    label: nls.localize('vuengine/macrosList/type/number', 'Number'),
                                                }, {
                                                    value: MacroType.Text,
                                                    label: nls.localize('vuengine/macrosList/type/text', 'Text'),
                                                }, {
                                                    value: MacroType.Undefine,
                                                    label: '#undef',
                                                }]}
                                                defaultValue={macro.type ?? MacroType.Define}
                                                onChange={option => setMacro(index, {
                                                    ...macro,
                                                    type: option.value as MacroType,
                                                })}
                                            />
                                        </td>
                                        <td>
                                            {(macro.type === MacroType.Text || macro.type === MacroType.Macro) &&
                                                <input
                                                    className='theia-input full-width'
                                                    value={macro.value}
                                                    autoFocus={macro.value === ''}
                                                    onChange={e => setMacro(index, {
                                                        ...macro,
                                                        value: e.target.value,
                                                    })}
                                                />
                                            }
                                            {macro.type === MacroType.Number &&
                                                <input
                                                    className='theia-input full-width'
                                                    type='number'
                                                    value={macro.value}
                                                    autoFocus={macro.value === ''}
                                                    onChange={e => setMacro(index, {
                                                        ...macro,
                                                        value: e.target.value === '' ? 0 : parseInt(e.target.value),
                                                    })}
                                                />
                                            }
                                            {macro.type === MacroType.Boolean &&
                                                <input
                                                    type="checkbox"
                                                    checked={macro.value ?? true}
                                                    onChange={e => setMacro(index, {
                                                        ...macro,
                                                        value: e.target.checked,
                                                    })}
                                                />
                                            }
                                        </td>
                                        <td>
                                            <HContainer alignItems="center">
                                                <button
                                                    className='theia-button secondary'
                                                    onClick={() => removeMacro(index)}
                                                    title={nls.localize('vuengine/macrosList/removeMacro', 'Remove Macro')}
                                                >
                                                    <i className='codicon codicon-x' />
                                                </button>
                                                {macro.name === '' &&
                                                    <i
                                                        className="error codicon codicon-warning"
                                                        title={nls.localize('vuengine/macrosList/emptyMacroName', 'Empty Macro Name')}
                                                    />
                                                }
                                                {data?.filter(p => '__' + toUpperSnakeCase(p.name) === '__' + toUpperSnakeCase(macro.name)).length > 1 &&
                                                    <i
                                                        className="error codicon codicon-warning"
                                                        title={nls.localize('vuengine/macrosList/duplicateMacroName', 'Duplicate Macro Name')}
                                                    />
                                                }
                                            </HContainer>
                                        </td>
                                    </tr>
                                ))
                        }
                    </tbody>
                </table>
                : <div className="secondaryText">
                    {nls.localize('vuengine/macrosList/noMacrosDefined', 'No macros defined.')}
                </div>}
            <button
                className='theia-button add-button'
                onClick={addMacro}
                title={nls.localize('vuengine/macrosList/addMacro', 'Add Macro')}
            >
                <i className='codicon codicon-plus' />
            </button>
        </VContainer>
    );
}
