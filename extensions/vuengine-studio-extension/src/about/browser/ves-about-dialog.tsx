import { CommandService, nls } from '@theia/core';
import { AboutDialog, AboutDialogProps, ABOUT_CONTENT_CLASS } from '@theia/core/lib/browser/about-dialog';
import { FrontendApplicationConfigProvider } from '@theia/core/lib/browser/frontend-application-config-provider';
import { WindowService } from '@theia/core/lib/browser/window/window-service';
import { inject, injectable } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { VSCODE_DEFAULT_API_VERSION } from '@theia/plugin-ext-vscode/lib/common/plugin-vscode-types';

@injectable()
export class VesAboutDialog extends AboutDialog {
    @inject(CommandService)
    protected readonly commandService: CommandService;
    @inject(WindowService)
    protected readonly windowService: WindowService;

    constructor(
        @inject(AboutDialogProps)
        protected readonly props: AboutDialogProps
    ) {
        super(props);

        this.titleNode.textContent = nls.localize('vuengine/about/title', 'About VUEngine Studio');

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
            {this.renderPatreon()}
        </div>;
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
                © 2022-2025 <a href={'mailto:c.radke@posteo.de'}>
                    Christian Radke
                </a> & <a href={'mailto:jorgech3@gmail.com'}>
                    Jorge Andres Eremiev
                </a>
            </div>
            <div className="ves-about-paragraph">
                <div>
                    <i className="fa fa-link" /> <a href="#" onClick={() => this.openUrl('https://www.vuengine.dev')}>
                        {'https://www.vuengine.dev'}
                    </a>
                </div>
                <div>
                    <i className="fa fa-github" /> <a href="#" onClick={() => this.openUrl('https://github.com/VUEngine')}>
                        {'https://github.com/VUEngine'}
                    </a>
                </div>
            </div>
        </>;
    }

    protected renderVersions(): React.ReactNode {
        return <div className="ves-about-paragraph">
            <div>{nls.localize('vuengine/about/vsCodeApiVersion', 'VSCode API Version')}: {VSCODE_DEFAULT_API_VERSION}</div>
        </div>;
    }

    protected renderPatreon(): React.ReactNode {
        return <>
            <div className="ves-about-paragraph">
                {nls.localize('vuengine/about/thankYouToOurSupporters', 'Thank you to our supporters on Patreon!')}<br />
                <a href="#" onClick={() => this.openUrl('https://www.patreon.com/VUEngine')}>{'https://www.patreon.com/VUEngine'}</a>
            </div>
            {this.renderPatrons()}
        </>;
    }

    protected renderPatrons(): React.ReactNode {
        return <div className="ves-about-paragraph">
            {/* 30 patrons with highest lifetime support */}
            RetroOnyx,
            Patrick Fenton,
            Randy Jeffery,
            Alec Kafka,
            David Baisley,
            Christopher Garland,
            NeGiZON,
            Sean Machan,
            Patrick-VB,
            Eric Freeman,
            Cameron Hollaway,
            Adam Wannamaker,
            Benjamin Stevens,
            Gregory VanNostrand,
            Simon Gellis,
            Jose Zagal,
            Michael Ortega,
            tydyedsyko,
            Richard Corlett,
            Bnjmn Mrph,
            Studio Kerga,
            chairodactyl,
            Luke Gerhardt,
            norty,
            IanelGreenleaf,
            Steven Hagelgans,
            Jonathan Kade,
            Tony,
            Tomaydo,
            Griffin Robinson
            et al.
        </div>;
    }
}
