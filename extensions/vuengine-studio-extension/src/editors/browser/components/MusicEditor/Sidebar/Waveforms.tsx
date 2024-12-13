import { nls } from '@theia/core';
import React, { Dispatch, SetStateAction } from 'react';
import HContainer from '../../Common/Base/HContainer';
import InfoLabel from '../../Common/InfoLabel';
import NumberArrayPreview from '../../Common/NumberArrayPreview';
import VContainer from '../../Common/Base/VContainer';
import { VSU_NUMBER_OF_WAVEFORM_BANKS } from '../../VsuEmulator/VsuEmulatorTypes';
import { SongData } from '../MusicEditorTypes';

interface WaveformsProps {
    songData: SongData
    setWaveformDialogOpen: Dispatch<SetStateAction<number>>
}

export default function Waveforms(props: WaveformsProps): React.JSX.Element {
    const { songData, setWaveformDialogOpen } = props;

    return <VContainer>
        <InfoLabel
            label={nls.localize('vuengine/musicEditor/waveforms', 'Waveforms')}
            subLabel={nls.localize('vuengine/editors/clickToEdit', 'Click To Edit')}
            tooltip={nls.localize(
                'vuengine/musicEditor/waveformsDescription',
                'You can set up up to 5 waveforms that can be used by instruments.'
            )}
        />
        <HContainer>
            {([...Array(VSU_NUMBER_OF_WAVEFORM_BANKS)].map((v, x) =>
                <NumberArrayPreview
                    key={x}
                    active={true}
                    maximum={64}
                    data={songData.waveforms[x] ?? []}
                    onClick={() => setWaveformDialogOpen(x)}
                />
            ))}
        </HContainer>
    </VContainer>;
}
