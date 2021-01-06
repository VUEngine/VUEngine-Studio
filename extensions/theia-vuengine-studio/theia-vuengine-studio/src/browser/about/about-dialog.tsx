import { injectable } from 'inversify';
import * as React from 'react';
import { join as joinPath } from 'path';
import { AboutDialog, ABOUT_CONTENT_CLASS } from '@theia/core/lib/browser/about-dialog';
import { FrontendApplicationConfigProvider } from '@theia/core/lib/browser/frontend-application-config-provider';
import { getResourcesPath, openUrl } from '../common/functions';
import { VesUrls } from '../common/urls';

@injectable()
export class VesAboutDialog extends AboutDialog {

    constructor() {
        super({
            title: FrontendApplicationConfigProvider.get().applicationName,
        });

        const updateButton = this.createButton("Check for Updates");
        // TODO: link respective command
        updateButton.onclick = () => { };
        this.controlPanel.appendChild(updateButton);
        updateButton.classList.add('secondary');

        this.acceptButton = this.createButton("OK");
        this.controlPanel.appendChild(this.acceptButton);
        this.acceptButton.classList.add('main');
    }

    protected appendAcceptButton(text: string): HTMLButtonElement {
        // prevent append of parent's button
        return this.createButton(text);
    }

    protected render(): React.ReactNode {
        const iconPath = joinPath(getResourcesPath(), "resources", "splash", "logo.png");
        const applicationInfo = this.applicationInfo;
        const applicationName = FrontendApplicationConfigProvider.get().applicationName;

        return <div className={ABOUT_CONTENT_CLASS}>
            <div className="ves-about-paragraph ves-about-flex-grid">
                <div className="ves-about-flex-grid-column">
                    {/* TODO: Make image file available in packaged app */}
                    <img src={iconPath} height="128" />
                </div>
                <div className="ves-about-flex-grid-column">
                    <h1>
                        {applicationName}
                        <span className="ves-about-sub-header">
                            {applicationInfo ? ` ${applicationInfo.version}` : ""}
                        </span>
                    </h1>
                    <div className="ves-about-paragraph">
                        © 2021 <a href={`mailto:${VesUrls.MAIL_CHRIS}`}>Christian Radke</a> and <a href={`mailto:${VesUrls.MAIL_JORGE}`}>Jorge Andres Eremiev</a>
                    </div>
                    <div className="ves-about-paragraph">
                        <div>
                            <i className="fa fa-link" /> <a href="#" onClick={() => this.openUrl(VesUrls.VUENGINE)}>{VesUrls.VUENGINE}</a>
                        </div>
                        <div>
                            <i className="fa fa-link" /> <a href="#" onClick={() => this.openUrl(VesUrls.VES_GITHUB)}>{VesUrls.VES_GITHUB}</a>
                        </div>
                    </div>
                </div>
            </div>
            <hr className="ves-about-hr" />
            <div className="ves-about-paragraph">
                <div>
                    Built with <a href="#" onClick={() => this.openUrl(VesUrls.THEIA_WEBSITE)}>Eclipse Theia</a> – <a href="#" onClick={() => this.openUrl(VesUrls.LICENSE)}>Eclipse Public License 2.0</a> or
                </div>
                <div>
                    <a href="#" onClick={() => this.openUrl(VesUrls.LICENSE)}>(Secondary) GNU General Public License, version 2 with the GNU Classpath Exception</a>
                </div>
            </div>
            <hr className="ves-about-hr" />
            <div className="ves-about-paragraph">
                <div>
                    Includes the following third party binaries:
                </div>
                <ul>
                    <li>GCC 4.7 <i>– The GNU Project, with patches for V810 by ElmerPCFX</i></li>
                    <li>Grit 0.8.6 <i>– Jasper Vijn, with patches for Virtual Boy by dasi</i></li>
                    <li>hf-cli 1.0.0.0 <i>– thunderstruck</i></li>
                    <li>Mednafen <i>– The Mednafen team</i></li>
                    <li>MSYS <i>– The MinGW Project</i></li>
                    <li>prog-vb 0.10.0 <i>– William D. Jones</i></li>
                </ul>
            </div>
            <hr className="ves-about-hr" />
            <div className="ves-about-paragraph">
                Thank you to our supporters on Patreon! <a href="#" onClick={() => this.openUrl(VesUrls.PATREON)}>{VesUrls.PATREON}</a>
            </div>
            <div className="ves-about-paragraph">

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

                et al... <a href="#" onClick={() => this.openUrl(VesUrls.SUPPORTERS)}>View full list</a>
            </div>
        </div >;
    }

    protected openUrl = (url: string) => openUrl(url);
}
