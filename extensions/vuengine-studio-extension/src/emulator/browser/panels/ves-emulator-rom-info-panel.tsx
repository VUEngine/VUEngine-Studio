import { nls } from '@theia/core';
import * as React from '@theia/core/shared/react';
import EmptyContainer from '../../../editors/browser/components/Common/EmptyContainer';
import { BUILD_MODE_DESCRIPTIONS, BuildMode } from '../../../build/browser/ves-build-types';
import { ROM_HEADER_MAKERS } from '../ves-emulator-types';
import { VesEmulatorDebugSource, VesEmulatorPanel, EmulatorPanelType } from './ves-emulator-panel';
import { Plug } from '@phosphor-icons/react';

/**
 * The cartridge header, parsed once when the ROM is loaded.
 *
 * Unlike the other panels this reads nothing from the running simulation — the
 * header is pushed by the widget whenever a ROM (re)loads — so there is
 * nothing here that benefits from polling ten times a second. It still polls,
 * at a slow rate, purely as a safety net; opening the panel always shows the
 * current header regardless, since the base class refreshes immediately on
 * attach and on show.
 */
export class VesEmulatorRomInfoPanel extends VesEmulatorPanel {

    constructor(source: VesEmulatorDebugSource, instanceId: string) {
        super(EmulatorPanelType.ROM_INFO, source, instanceId);
        this.title.label = nls.localize('vuengine/emulator/panels/romInfo', 'ROM Info');
        this.title.caption = nls.localize('vuengine/emulator/panels/romInfoCaption', 'Cartridge header');
    }

    protected pollHz(): number {
        return 1;
    }

    protected refresh(): void {
        this.update();
    }

    protected render(): React.ReactNode {
        if (!this.source.sim) {
            return <EmptyContainer
                title={nls.localize('vuengine/emulator/panels/notRunning', 'The emulator is not running.')}
                icon={<Plug size={32} />}
            />;
        }

        const { romHeader, romSize, buildMode } = this.source;
        const maker = ROM_HEADER_MAKERS[romHeader.maker];
        // The build writes the mode in lower case; this is how it is spelled
        // everywhere else in the application, and it carries the description
        // the Build view shows for it.
        const mode = Object.values(BuildMode).find(known => known.toLowerCase() === buildMode);

        return <table className='ves-emulator-rom-info'>
            <tbody>
                <tr>
                    <th>{nls.localize('vuengine/emulator/panels/romInfo/name', 'Name')}</th>
                    <td><code>{romHeader.name.trim()}</code></td>
                </tr>
                <tr>
                    <th>{nls.localize('vuengine/emulator/panels/romInfo/code', 'Code')}</th>
                    <td><code>{romHeader.code}</code></td>
                </tr>
                <tr>
                    <th>{nls.localize('vuengine/emulator/panels/romInfo/maker', 'Maker')}</th>
                    <td><code>{romHeader.maker}</code>{maker && <> ({maker})</>}</td>
                </tr>
                <tr>
                    <th>{nls.localize('vuengine/emulator/panels/romInfo/version', 'Version')}</th>
                    <td>1.<code>{romHeader.version}</code></td>
                </tr>
                <tr>
                    <th>{nls.localize('vuengine/emulator/panels/romInfo/size', 'Size')}</th>
                    <td><code>{romSize}</code> MBit</td>
                </tr>
                <tr>
                    <th title={nls.localize(
                        'vuengine/emulator/panels/romInfo/buildModeHint',
                        'Read from the .map beside the ROM, which names the image the build produced. \
A ROM built elsewhere has none.'
                    )}>
                        {nls.localize('vuengine/emulator/panels/romInfo/buildMode', 'Build Mode')}
                    </th>
                    <td title={mode ? BUILD_MODE_DESCRIPTIONS[mode] : undefined}>
                        {mode ?? (buildMode
                            ? <code>{buildMode}</code>
                            : nls.localize('vuengine/emulator/panels/romInfo/buildModeUnknown', 'Unknown'))}
                    </td>
                </tr>
            </tbody>
        </table>;
    }
}
