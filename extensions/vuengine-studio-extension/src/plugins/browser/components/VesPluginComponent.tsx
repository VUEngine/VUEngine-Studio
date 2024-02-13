import { nls } from "@theia/core";
import React from "react";
import AbstractVesPluginComponent from "./AbstractVesPluginComponent";

export default class VesPluginComponent extends AbstractVesPluginComponent {
    render(): React.ReactNode {
        const { icon, displayName, description, tags } = this.props.plugin;
        return <div className='theia-vsx-extension ves-plugin'>
            {icon
                ? <img className='theia-vsx-extension-icon' src={icon} />
                : <div className='theia-vsx-extension-icon vesPlaceholder'>
                    <i className="codicon codicon-plug" />
                </div>}
            <div className='theia-vsx-extension-content'>
                <div className='title'>
                    <div className='noWrapInfo'>
                        <span className='name'>{displayName}</span> <span className='version'></span>
                    </div>
                    <div className='stat'>
                    </div>
                </div>
                <div className='noWrapInfo theia-vsx-extension-description'>{description}</div>
                <div className='theia-vsx-extension-action-bar'>
                    <span className='noWrapInfo vesPluginTags'>
                        {tags && Object.keys(tags).length
                            // @ts-ignore
                            ? Object.keys(tags).map(key => <span key={key} className="vesTag">{tags[key]}</span>)
                            : <span style={{ opacity: .3 }}>
                                {nls.localize('vuengine/plugins/noTags', 'No Tags')}
                            </span>
                        }
                    </span>
                    {/* <span className='noWrapInfo theia-vsx-extension-publisher'>{author}</span> */}
                    {this.renderAction()}
                </div>
            </div>
        </div>;
    }
}
