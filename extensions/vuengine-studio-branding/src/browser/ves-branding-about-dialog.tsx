import * as React from '@theia/core/shared/react';
import { CommandService } from '@theia/core';
import { injectable, inject } from '@theia/core/shared/inversify';
import { AboutDialog, AboutDialogProps, ABOUT_CONTENT_CLASS } from '@theia/core/lib/browser/about-dialog';
import { FrontendApplicationConfigProvider } from '@theia/core/lib/browser/frontend-application-config-provider';
import { WindowService } from '@theia/core/lib/browser/window/window-service';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import { VSCODE_DEFAULT_API_VERSION } from '@theia/plugin-ext-vscode/lib/common/plugin-vscode-types';

import { VesUpdaterCommands } from 'vuengine-studio-updater/lib/electron-browser/ves-updater-commands';

@injectable()
export class VesAboutDialog extends AboutDialog {
    @inject(CommandService)
    protected readonly commandService: CommandService;
    @inject(EnvVariablesServer)
    protected readonly environment: EnvVariablesServer;
    @inject(WindowService)
    protected readonly windowService: WindowService;

    constructor(
        @inject(AboutDialogProps)
        protected readonly props: AboutDialogProps
    ) {
        super(props);

        this.titleNode.textContent = `About ${FrontendApplicationConfigProvider.get().applicationName}`;

        const updateButton = this.createButton('Check for Updates');
        updateButton.onclick = () => {
            this.commandService.executeCommand(VesUpdaterCommands.CHECK_FOR_UPDATES.id);
        };
        this.controlPanel.appendChild(updateButton);
        updateButton.classList.add('secondary');

        this.acceptButton = this.createButton('OK');
        this.controlPanel.appendChild(this.acceptButton);
        this.acceptButton.classList.add('main');
    }

    protected appendAcceptButton(text: string): HTMLButtonElement {
        // prevent append of parent's button
        return this.createButton(text);
    }

    protected openUrl = (url: string) => this.windowService.openNewWindow(url, { external: true });

    protected render(): React.ReactNode {
        return <div className={ABOUT_CONTENT_CLASS}>
            {this.renderContent()}
        </div>;
    }

    protected renderContent(): React.ReactNode {
        return <div className={ABOUT_CONTENT_CLASS}>
            {this.renderHeader()}
            <hr className="ves-about-hr" />
            {this.renderVersions()}
            <hr className="ves-about-hr" />
            {this.renderBuiltWith()}
            <hr className="ves-about-hr" />
            {this.renderPatreon()}
        </div >;
    }

    protected renderHeader(): React.ReactNode {
        const applicationInfo = this.applicationInfo;
        const applicationName = FrontendApplicationConfigProvider.get().applicationName;

        return <div className="ves-about-paragraph ves-about-flex-grid">
            <div className="ves-about-flex-grid-column">
                <div className="ves-about-logo"></div>
            </div>
            <div className="ves-about-flex-grid-column">
                <h1>
                    {applicationName}
                    <span className="ves-about-sub-header">
                        {applicationInfo && ` ${applicationInfo.version}`}
                    </span>
                </h1>
                {this.renderCopyright()}
            </div>
        </div>;
    }

    protected renderCopyright(): React.ReactNode {
        return <>
            <div className="ves-about-paragraph">
                © 2021 <a href={'mailto:c.radke@posteo.de'}>Christian Radke</a> and <a href={'mailto:jorgech3@gmail.com'}>Jorge Andres Eremiev</a>
            </div>
            <div className="ves-about-paragraph">
                <div>
                    <i className="fa fa-link" /> <a href="#" onClick={() => this.openUrl('https://www.vuengine.dev/')}>
                        {'https://www.vuengine.dev/'}
                    </a>
                </div>
                <div>
                    <i className="fa fa-link" /> <a href="#" onClick={() => this.openUrl('https://github.com/VUEngine/VUEngine-Studio')}>
                        {'https://github.com/VUEngine/VUEngine-Studio'}
                    </a>
                </div>
            </div>
        </>;
    }

    protected renderVersions(): React.ReactNode {
        return <div className="ves-about-paragraph">
            <div>Version: {this.applicationInfo && this.applicationInfo.version}</div>
            <div>VSCode API version: {VSCODE_DEFAULT_API_VERSION}</div>
        </div>;
    }

    protected renderBuiltWith(): React.ReactNode {
        return <div className="ves-about-paragraph">
            <div>
                Built with <a href="#" onClick={() => this.openUrl('https://theia-ide.org/')}>Eclipse Theia</a>. Includes the following third party binaries:
            </div>
            <ul>
                <li>GCC <i>– The GNU Project, with patches for V810 by ElmerPCFX</i></li>
                <li>Grit <i>– Jasper Vijn, with patches for Virtual Boy by dasi</i></li>
                <li>hf-cli <i>– thunderstruck</i></li>
                <li>MSYS <i>– The MinGW Project</i></li>
                <li>prog-vb <i>– William D. Jones</i></li>
                <li>RetroArch Web w/ Beetle VB core <i>– RetroArch and Mednafen teams</i></li>
            </ul>
        </div>;
    }

    protected renderPatreon(): React.ReactNode {
        return <>
            <div className="ves-about-paragraph">
                Thank you to our supporters on Patreon! <a href="#" onClick={() => this.openUrl('https://www.patreon.com/VUEngine')}>{'https://www.patreon.com/VUEngine'}</a>
            </div>
            {this.renderPatrons()}
        </>;
    }

    protected renderPatrons(): React.ReactNode {
        return <div className="ves-about-paragraph">
            {/* 30 patrons with highest lifetime support */}
            Adam Wannamaker,
            Alec Kafka,
            Amos Bieler,
            Benjamin Stevens,
            Bernardo Compagnoni,
            Cesar Henzelin,
            Christopher Garland,
            Daniel Lhota,
            David Baisley,
            Domenic Umberto Raso,
            Eric Freeman,
            IanelGreenleaf,
            Jon Zrostlik,
            Jose Zagal,
            Kevin L Mellott,
            Luke Gerhardt,
            Marc Andre Sigle,
            Marten Reiß,
            Massih Naisan,
            Michael Ortega,
            Mike Boodle,
            NeGiZON,
            Patrick Fenton,
            Patrick-VB,
            Randy Jeffery,
            Sean Machan,
            Steven Hagelgans,
            Tony,
            Troy Bonneau,
            tydyedsyko

            et al... <a href="#" onClick={() => this.openUrl('https://github.com/VUEngine/VUEngine-Studio/blob/master/SUPPORTERS')}>View full list</a>
        </div>;
    }
}
