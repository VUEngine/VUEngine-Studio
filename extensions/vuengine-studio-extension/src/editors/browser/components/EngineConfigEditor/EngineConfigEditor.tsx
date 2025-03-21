import { nls } from '@theia/core';
import React, { useState } from 'react';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import {
    EngineConfigData
} from './EngineConfigEditorTypes';
import EngineConfigAffine from './tabs/EngineConfigAffine';
import EngineConfigAnimation from './tabs/EngineConfigAnimation';
import EngineConfigBrightness from './tabs/EngineConfigBrightness';
import EngineConfigDebug from './tabs/EngineConfigDebug';
import EngineConfigExceptions from './tabs/EngineConfigExceptions';
import EngineConfigFrameRate from './tabs/EngineConfigFrameRate';
import EngineConfigMacros from './tabs/EngineConfigGameMacros';
import EngineConfigMath from './tabs/EngineConfigMath';
import EngineConfigMemoryPools from './tabs/EngineConfigMemoryPools';
import EngineConfigOptics from './tabs/EngineConfigOptics';
import EngineConfigPalettes from './tabs/EngineConfigPalettes';
import EngineConfigPhysics from './tabs/EngineConfigPhysics';
import EngineConfigSound from './tabs/EngineConfigSound';
import EngineConfigSprite from './tabs/EngineConfigSprite';
import EngineConfigSram from './tabs/EngineConfigSram';
import EngineConfigTexture from './tabs/EngineConfigTexture';
import EngineConfigTiles from './tabs/EngineConfigTiles';
import EngineConfigWireframe from './tabs/EngineConfigWireframe';

interface EngineConfigEditorProps {
    data: EngineConfigData
    updateData: (data: EngineConfigData) => void
}

export default function EngineConfigEditor(props: EngineConfigEditorProps): React.JSX.Element {
    const { data, updateData } = props;
    const [sidebarTab, setSidebarTab] = useState<number>(0);

    return (
        <Tabs
            className="vertical"
            selectedIndex={sidebarTab}
            onSelect={index => setSidebarTab(index)}
            style={{
                flexDirection: 'row',
                gap: 20,
            }}
        >
            <TabList
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <Tab>{nls.localize('vuengine/editors/engineConfig/affine', 'Affine')}</Tab>
                <Tab>{nls.localize('vuengine/editors/engineConfig/animation', 'Animation')}</Tab>
                <Tab>{nls.localize('vuengine/editors/engineConfig/brightness', 'Brightness')}</Tab>
                <Tab>{nls.localize('vuengine/editors/engineConfig/debug', 'Debug')}</Tab>
                <Tab>{nls.localize('vuengine/editors/engineConfig/exceptions', 'Exceptions')}</Tab>
                <Tab>{nls.localize('vuengine/editors/engineConfig/frameRate', 'Frame Rate')}</Tab>
                <Tab>{nls.localize('vuengine/editors/engineConfig/macros', 'Macros')}</Tab>
                <Tab>{nls.localize('vuengine/editors/engineConfig/math', 'Math')}</Tab>
                <Tab>{nls.localize('vuengine/editors/engineConfig/memoryPools', 'Memory Pools')}</Tab>
                <Tab>{nls.localize('vuengine/editors/engineConfig/optics', 'Optics')}</Tab>
                <Tab>{nls.localize('vuengine/editors/engineConfig/palettes', 'Palettes')}</Tab>
                <Tab>{nls.localize('vuengine/editors/engineConfig/physics', 'Physics')}</Tab>
                <Tab>{nls.localize('vuengine/editors/engineConfig/sound', 'Sound')}</Tab>
                <Tab>{nls.localize('vuengine/editors/engineConfig/sprite', 'Sprite')}</Tab>
                <Tab>{nls.localize('vuengine/editors/engineConfig/sram', 'SRAM')}</Tab>
                <Tab>{nls.localize('vuengine/editors/engineConfig/texture', 'Texture')}</Tab>
                <Tab>{nls.localize('vuengine/editors/engineConfig/tiles', 'Tiles')}</Tab>
                <Tab>{nls.localize('vuengine/editors/engineConfig/wireframe', 'Wireframe')}</Tab>
            </TabList>
            <div
                style={{
                    display: 'flex',
                    flexGrow: 1
                }}
            >
                <TabPanel><EngineConfigAffine data={data} updateData={updateData} /></TabPanel>
                <TabPanel><EngineConfigAnimation data={data} updateData={updateData} /></TabPanel>
                <TabPanel><EngineConfigBrightness data={data} updateData={updateData} /></TabPanel>
                <TabPanel><EngineConfigDebug data={data} updateData={updateData} /></TabPanel>
                <TabPanel><EngineConfigExceptions data={data} updateData={updateData} /></TabPanel>
                <TabPanel><EngineConfigFrameRate data={data} updateData={updateData} /></TabPanel>
                <TabPanel><EngineConfigMacros data={data} updateData={updateData} /></TabPanel>
                <TabPanel><EngineConfigMath data={data} updateData={updateData} /></TabPanel>
                <TabPanel><EngineConfigMemoryPools data={data} updateData={updateData} /></TabPanel>
                <TabPanel><EngineConfigOptics data={data} updateData={updateData} /></TabPanel>
                <TabPanel><EngineConfigPalettes data={data} updateData={updateData} /></TabPanel>
                <TabPanel><EngineConfigPhysics data={data} updateData={updateData} /></TabPanel>
                <TabPanel><EngineConfigSound data={data} updateData={updateData} /></TabPanel>
                <TabPanel><EngineConfigSprite data={data} updateData={updateData} /></TabPanel>
                <TabPanel><EngineConfigSram data={data} updateData={updateData} /></TabPanel>
                <TabPanel><EngineConfigTexture data={data} updateData={updateData} /></TabPanel>
                <TabPanel><EngineConfigTiles data={data} updateData={updateData} /></TabPanel>
                <TabPanel><EngineConfigWireframe data={data} updateData={updateData} /></TabPanel>
            </div>
        </Tabs>
    );
}
