import { nls } from '@theia/core';
import React from 'react';
import HContainer from '../Common/Base/HContainer';
import { CompilerConfigData, MemorySectionsDataKeys } from './CompilerConfigEditorTypes';
import VContainer from '../Common/Base/VContainer';
import InfoLabel from '../Common/InfoLabel';

interface MemorySectionsProps {
    data: CompilerConfigData
    updateData: (data: CompilerConfigData) => void
}

export default function MemorySections(props: MemorySectionsProps): React.JSX.Element {
    const { data, updateData } = props;

    const setLength = (type: MemorySectionsDataKeys, length: number) => {
        updateData({
            ...data,
            memorySections: {
                ...data.memorySections,
                [type]: {
                    ...data.memorySections[type],
                    length,
                },
            },
        });
    };

    const setOrigin = (type: MemorySectionsDataKeys, origin: string) => {
        updateData({
            ...data,
            memorySections: {
                ...data.memorySections,
                [type]: {
                    ...data.memorySections[type],
                    origin,
                },
            },
        });
    };

    return <VContainer gap={15}>
        <table>
            <tr>
                <td style={{ width: 200 }}>
                    <InfoLabel
                        label={nls.localize('vuengine/editors/compilerConfig/memorySection', 'Memory Section')}
                        tooltip={nls.localize(
                            'vuengine/editors/compilerConfig/memorySectionDramDescription',
                            'At almost double the size of WRAM, there is a comparatively large amount of BGMAP memory available on the Virtual Boy, \
which is also almost as fast to access as WRAM. \
Therefore, you can reserve some memory at the end of it to use as additional working RAM. \
The engine will place everything assigned to .dram_data and .dram_bss here. \
The reserved space will be unavailable for BGMAP data.'
                        )}
                    />
                </td>
                <td style={{ width: 80 }}>
                    {nls.localize('vuengine/editors/compilerConfig/size', 'Size')}
                </td>
                <td>
                    {nls.localize('vuengine/editors/compilerConfig/endAddress', 'End Address')}
                </td>
            </tr>
            {(['dram'] as MemorySectionsDataKeys[]).map(section =>
                <tr>
                    <td>
                        {section.toUpperCase()}
                    </td>
                    <td>
                        <HContainer alignItems='center'>
                            <input
                                type="number"
                                className="theia-input"
                                style={{ width: 36 }}
                                onChange={e => setLength(section, parseInt(e.target.value))}
                                value={data.memorySections[section].length}
                                min="0"
                                max="114"
                            />
                            KB
                        </HContainer>
                    </td>
                    <td>
                        <input
                            className="theia-input"
                            style={{ width: 100 }}
                            onChange={e => setOrigin(section, e.target.value)}
                            value={data.memorySections[section].origin}
                        />
                    </td>
                </tr>
            )}
        </table>
        <table>
            <tr>
                <td style={{ width: 200 }}>
                    {nls.localize('vuengine/editors/compilerConfig/memorySection', 'Memory Section')}
                </td>
                <td style={{ width: 80 }}>
                    {nls.localize('vuengine/editors/compilerConfig/size', 'Size')}
                </td>
                <td>
                    {nls.localize('vuengine/editors/compilerConfig/startAddress', 'Start Address')}
                </td>
            </tr>
            {(['exp', 'wram', 'sram', 'rom'] as MemorySectionsDataKeys[]).map(section =>
                <tr>
                    <td>
                        {section.toUpperCase()}
                    </td>
                    <td>
                        <HContainer alignItems='center'>
                            <input
                                type="number"
                                className="theia-input"
                                style={{ width: 36 }}
                                onChange={e => setLength(section, parseInt(e.target.value))}
                                value={data.memorySections[section].length}
                                min="0"
                            />
                            {section === 'wram' ? 'KB' : 'MB'}
                        </HContainer>
                    </td>
                    <td>
                        <input
                            className="theia-input"
                            style={{ width: 100 }}
                            onChange={e => setOrigin(section, e.target.value)}
                            value={data.memorySections[section].origin}
                        />
                    </td>
                </tr>
            )}
        </table>
    </VContainer>;
}
