import { nls } from '@theia/core';
import React, { useContext } from 'react';
import styled from 'styled-components';
import { EditorsContext, EditorsContextType } from '../../ves-editors-types';

const StyledWarningContainer = styled.div`
    align-items: center;
    border-bottom: 1px solid var(--theia-editorGroup-border);
    display: flex;
    flex-direction: row;
    gap: var(--theia-ui-padding);
    justify-content: center;
    padding: calc(2 * var(--theia-ui-padding));
    position: relative;
    z-index: 10;
`;

interface MissingPluginProps {
    plugin: string
}

export default function MissingPlugin(props: MissingPluginProps): React.JSX.Element {
    const { plugin } = props;
    const { services } = useContext(EditorsContext) as EditorsContextType;

    const installedPlugins = services.vesPluginsService.getInstalledPlugins();
    const hasI18nPlugin = installedPlugins.includes(plugin);

    const installPlugin = async () => {
        await services.vesPluginsService.installPlugin(plugin);
    };

    return hasI18nPlugin ? <></> : (
        <StyledWarningContainer>
            <i className="codicon codicon-warning invalid" />
            {nls.localize(
                'vuengine/editors/translations/pluginMissing',
                "The {0} plugin is required in order to use this editor's output.",
                plugin
            )}
            <button
                className="theia-button secondary"
                onClick={installPlugin}
            >
                {nls.localizeByDefault('Install')}
            </button>
        </StyledWarningContainer>
    );
}
