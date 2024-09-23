import { nls } from '@theia/core';
import { ConfirmDialog, PreferenceService } from '@theia/core/lib/browser';
import { FileDialogService } from '@theia/filesystem/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import React from 'react';
import { VesFlashCartPreferenceIds } from '../ves-flash-cart-preferences';
import { VesFlashCartService } from '../ves-flash-cart-service';
import { BUILT_IN_FLASH_CART_CONFIGS, FlashCartConfig } from '../ves-flash-cart-types';
import FlashCartConfigForm from './FlashCartConfig';

interface FlashCartConfigsProps {
    fileDialogService: FileDialogService
    fileService: FileService
    preferenceService: PreferenceService
    vesFlashCartService: VesFlashCartService
}

export default function FlashCartConfigs(props: FlashCartConfigsProps): React.JSX.Element {
    const [configsExpanded, setConfigsExpanded] = React.useState<boolean>(false);
    const [flashCartConfigs, setFlashCartConfigs] = React.useState<FlashCartConfig[]>(props.preferenceService.get(VesFlashCartPreferenceIds.FLASH_CARTS, []));

    React.useEffect(() => {
        const preflistener = props.preferenceService.onPreferenceChanged(change => {
            if (change.preferenceName === VesFlashCartPreferenceIds.FLASH_CARTS) {
                setFlashCartConfigs(change.newValue || []);
            }
        });
        return () => preflistener.dispose();
    }, [props.preferenceService]);

    const removeFlashCartConfig = async (indexToDelete: number) => {
        const dialog = new ConfirmDialog({
            title: nls.localize('vuengine/flashCarts/configs/removeFlashCartConfig', 'Remove Flash Cart Config'),
            msg: nls.localize('vuengine/flashCarts/configs/areYouSureYouWantToRemoveFlashCart', 'Are you sure you want to remove this configuration?'),
        });
        const confirmed = await dialog.open();
        if (confirmed) {
            props.preferenceService.updateValue(
                VesFlashCartPreferenceIds.FLASH_CARTS,
                flashCartConfigs.filter((config, index) => index !== indexToDelete)
            );
        }
    };

    const addFlashCartConfig = () => props.preferenceService.updateValue(
        VesFlashCartPreferenceIds.FLASH_CARTS,
        [
            ...(flashCartConfigs || []),
            {
                name: nls.localizeByDefault('New'),
                size: 16,
                padRom: false,
                path: '',
                args: '%ROM%',
                deviceCodes: [{
                    pid: 0,
                    vid: 0,
                    manufacturer: '',
                    product: '',
                }]
            }
        ]
    );

    const setFlashCartConfig = (index: number, config: Partial<FlashCartConfig>, persist = true) => {
        const updatedConfigs = [...flashCartConfigs];
        updatedConfigs[index] = {
            ...updatedConfigs[index],
            ...config
        };
        if (persist) {
            props.preferenceService.updateValue(VesFlashCartPreferenceIds.FLASH_CARTS, updatedConfigs);
        } else {
            setFlashCartConfigs(updatedConfigs);
        }
    };

    return <div className='flashCartConfigsWrapper'>
        <div className='flashCartConfigsOverview' onClick={() => setConfigsExpanded(!configsExpanded)}>
            <i className={`fa fa-chevron-${configsExpanded ? 'down' : 'left'}`} />
            <div>
                {nls.localize('vuengine/flashCarts/configs/builtInConfigurations', 'Built-in Configurations')}: {BUILT_IN_FLASH_CART_CONFIGS.length}
            </div>
            <div>
                {nls.localize('vuengine/flashCarts/configs/customConfigurations', 'Custom Configurations')}: {flashCartConfigs.length}
            </div>
        </div>
        {configsExpanded && <div className='flashCartConfigs'>
            {BUILT_IN_FLASH_CART_CONFIGS.map((config, index) =>
                <FlashCartConfigForm
                    key={`flashCartConfig-builtin-${index}`}
                    readOnly={true}
                    index={index}
                    flashCartConfig={config}
                    setFlashCartConfig={setFlashCartConfig}
                    removeFlashCartConfig={removeFlashCartConfig}
                    fileDialogService={props.fileDialogService}
                    fileService={props.fileService}
                    preferenceService={props.preferenceService}
                    vesFlashCartService={props.vesFlashCartService}
                />
            )}
            {flashCartConfigs && flashCartConfigs.map((config, index) =>
                <FlashCartConfigForm
                    key={`flashCartConfig-custom-${index}`}
                    readOnly={false}
                    index={index}
                    flashCartConfig={config}
                    setFlashCartConfig={setFlashCartConfig}
                    removeFlashCartConfig={removeFlashCartConfig}
                    fileDialogService={props.fileDialogService}
                    fileService={props.fileService}
                    preferenceService={props.preferenceService}
                    vesFlashCartService={props.vesFlashCartService}
                />
            )}
            <div className='flashCartConfigsActions'>
                <button
                    className='theia-button secondary full-width'
                    onClick={addFlashCartConfig}
                >
                    <i className='codicon codicon-plus' />
                </button>
            </div>
        </div>}
    </div>;
}
