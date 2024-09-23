import { nls } from '@theia/core';
import React, { Dispatch, SetStateAction } from 'react';
import HContainer from '../../Common/HContainer';
import InfoLabel from '../../Common/InfoLabel';
import NumberArrayPreview from '../../Common/NumberArrayPreview';
import VContainer from '../../Common/VContainer';
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
            tooltip={nls.localize(
                'vuengine/musicEditor/waveformsDescription',
                'You can set up up to 5 waveforms that can be used by instruments.'
            )}
        />
        <div className="lightLabel">
            {nls.localize('vuengine/editors/clickToEdit', 'Click To Edit')}
        </div>
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
