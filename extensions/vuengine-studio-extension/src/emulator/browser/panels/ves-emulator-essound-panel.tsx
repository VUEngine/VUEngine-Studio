import { MusicNotes, Plug } from '@phosphor-icons/react';
import { nls } from '@theia/core';
import * as React from '@theia/core/shared/react';
import HContainer from '../../../editors/browser/components/Common/Base/HContainer';
import EmptyContainer from '../../../editors/browser/components/Common/EmptyContainer';
import {
    ES_SOUND_FIRST_MP3,
    ES_SOUND_FIRST_WAV,
    ES_SOUND_LAST_MP3,
    ES_SOUND_LAST_WAV,
} from '../../common/ves-emulator-essound';
import { ES_SOUND_HISTORY_LENGTH, VesEmulatorEsSoundPlayer } from '../ves-emulator-essound-player';
import { EmulatorPanelType, hex, VesEmulatorDebugSource, VesEmulatorPanel } from './ves-emulator-panel';

export class VesEmulatorEsSoundPanel extends VesEmulatorPanel {

    constructor(
        source: VesEmulatorDebugSource,
        instanceId: string,
        protected readonly player: VesEmulatorEsSoundPlayer
    ) {
        super(EmulatorPanelType.ES_SOUND, source, instanceId);
        this.title.label = nls.localize('vuengine/emulator/panels/esSound', 'ESSound');
        this.addClass('ves-emulator-vip-split');
        this.toDispose.push(this.player.onDidChange(() => this.update()));
    }

    protected startPolling(): void {
        this.refresh();
    }

    protected refresh(): void {
        this.update();
    }

    protected render(): React.ReactNode {
        if (!this.player.isScanned) {
            return <EmptyContainer
                title={nls.localize(
                  'vuengine/emulator/panels/notRunning',
                  'The emulator is not running.',
                )}
                icon={<Plug size={32} />}
            />;
        }

        const tracks = this.player.list;
        const playing = this.player.playing;

        return <>
            {tracks.length === 0
                ? <EmptyContainer
                    title={nls.localize('vuengine/emulator/esSound/noFiles', 'No ESSound audio files found')}
                    description={nls.localize(
                        'vuengine/emulator/esSound/noFilesDescription',
                        'Put {0} up to {1} and/or {2} up to {3} next to the ROM, then load it again. Until there is \
something to play, the emulator will pretend that it does not support ESSound.',
                        `${ES_SOUND_FIRST_MP3}.mp3`,
                        `${ES_SOUND_LAST_MP3}.mp3`,
                        `${ES_SOUND_FIRST_WAV}.wav`,
                        `${ES_SOUND_LAST_WAV}.wav`,
                    )}
                    icon={<MusicNotes size={32} />}
                />
                : <HContainer>
                    <table className='ves-emulator-vip-table ves-emulator-essound-table'>
                        <thead>
                            <tr>
                                <th>{nls.localize('vuengine/emulator/esSound/track', 'Track')}</th>
                                <th>{nls.localizeByDefault('File')}</th>
                                <th>{nls.localize('vuengine/emulator/esSound/size', 'Size')}</th>
                                <th>{nls.localize('vuengine/emulator/esSound/state', 'State')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tracks.map(track => (
                                <tr key={track.id}>
                                    <td>{track.id}</td>
                                    <td className='name'>{track.name}</td>
                                    <td>{Math.round(track.size / 1024)} KB</td>
                                    <td>{playing.includes(track.id)
                                        ? nls.localize('vuengine/emulator/esSound/playing', 'Playing')
                                        : ''}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {this.renderHistory()}
                </HContainer>
            }
        </>;
    }

    protected renderHistory(): React.ReactNode {
        const commands = this.player.commands;
        return <div className='ves-emulator-vip-detail'>
            <fieldset className='ves-emulator-vip-inspector-group ves-emulator-essound-history'>
                <legend>
                    {nls.localize('vuengine/emulator/esSound/lastCommands', 'Last {0} Commands', ES_SOUND_HISTORY_LENGTH)}
                </legend>
                {commands.length === 0
                    ? <div className='ves-emulator-vip-footer'>
                        {nls.localize('vuengine/emulator/esSound/noCommands', 'The game has not written to the ESSound port.')}
                    </div>
                    : <table className='ves-emulator-vip-table ves-emulator-essound-table'>
                        <tbody>
                            {commands.map((entry, index) => (
                                <tr key={index} className={entry.problem ? 'inactive' : ''} title={entry.problem}>
                                    <td><code>{hex(entry.message.raw, 4)}</code></td>
                                    <td className='name'>{entry.description}</td>
                                    <td className='name'>{entry.problem ?? ''}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                }
            </fieldset>
        </div>;
    }
}
