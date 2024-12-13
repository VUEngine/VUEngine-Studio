import { URI, isWindows, nls } from '@theia/core';
import { ConfirmDialog, PreferenceService } from '@theia/core/lib/browser';
import { SelectComponent } from '@theia/core/lib/browser/widgets/select-component';
import { FileDialogService, OpenFileDialogProps } from '@theia/filesystem/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import React from 'react';
import ReactTextareaAutosize from 'react-textarea-autosize';
import IMAGE_FLASH_CART from '../../../../src/flash-cart/browser/images/flash-cart.png';
import { WINDOWS_EXECUTABLE_EXTENSIONS } from '../../../core/browser/ves-common-types';
import HContainer from '../../../editors/browser/components/Common/Base/HContainer';
import VContainer from '../../../editors/browser/components/Common/Base/VContainer';
import { VesFlashCartService } from '../ves-flash-cart-service';
import { FlashCartConfig, FlashCartDeviceCode } from '../ves-flash-cart-types';

interface FlashCartConfigProps {
    readOnly: boolean
    index: number
    flashCartConfig: FlashCartConfig
    setFlashCartConfig: (index: number, config: Partial<FlashCartConfig>, persist: boolean) => void,
    removeFlashCartConfig: (indexToDelete: number) => Promise<void>,
    fileDialogService: FileDialogService
    fileService: FileService
    preferenceService: PreferenceService
    vesFlashCartService: VesFlashCartService
}

export default function FlashCartConfigForm(props: FlashCartConfigProps): React.JSX.Element {
    const {
        readOnly,
        flashCartConfig,
        setFlashCartConfig,
        vesFlashCartService
    } = props;
    const flashCartSizes = [1, 2, 4, 8, 16, 32, 64, 128];

    const setName = (name: string, persist = true) => {
        setFlashCartConfig(props.index, { name }, persist);
    };

    const setSize = (size: number, persist = true) => {
        setFlashCartConfig(props.index, { size }, persist);
    };

    const setPadRom = (padRom: boolean) => {
        setFlashCartConfig(props.index, { padRom }, false);
    };

    const setPath = (path: string, persist = true) => {
        setFlashCartConfig(props.index, { path }, persist);
    };

    const setArgs = (args: string, persist = true) => {
        setFlashCartConfig(props.index, { args }, persist);
    };

    const selectFlasherPath = async (index: number): Promise<void> => {
        const openFileDialogProps: OpenFileDialogProps = {
            title: nls.localize('vuengine/flashCarts/configs/selectFlasherExecutable', 'Select flasher executable'),
            canSelectFolders: false,
            canSelectFiles: true,
            filters: {
                'Executables': isWindows
                    ? WINDOWS_EXECUTABLE_EXTENSIONS
                    : ['.']
            }
        };
        const currentPath = await props.fileService.exists(new URI(flashCartConfig.path).withScheme('file'))
            ? await props.fileService.resolve(new URI(flashCartConfig.path).withScheme('file'))
            : undefined;
        const flasherUri = await props.fileDialogService.showOpenDialog(openFileDialogProps, currentPath);
        if (flasherUri) {
            const flasher = await props.fileService.resolve(flasherUri);
            if (flasher.isFile) {
                setPath(flasher.resource.path.fsPath());
            }
        }
    };

    const removeDeviceCode = async (indexToDelete: number) => {
        const dialog = new ConfirmDialog({
            title: nls.localize('vuengine/flashCarts/configs/removeDeviceCode', 'Remove Device Code'),
            msg: nls.localize('vuengine/flashCarts/configs/areYouSureYouWantToRemoveDeviceCode', 'Are you sure you want to remove this device code?'),
        });
        const confirmed = await dialog.open();
        if (confirmed) {
            setFlashCartConfig(props.index, {
                deviceCodes: flashCartConfig.deviceCodes.filter((config, index) => index !== indexToDelete)
            }, true);
        }
    };

    const addDeviceCode = () =>
        setFlashCartConfig(props.index, {
            deviceCodes: [
                ...flashCartConfig.deviceCodes,
                {
                    vid: 0,
                    pid: 0,
                    manufacturer: '',
                    product: '',
                }
            ]
        }, true);

    const setDeviceCode = (index: number, config: Partial<FlashCartDeviceCode>, persist = true) => {
        const updatedFlashCartConfig = { ...flashCartConfig };
        const updatedDeviceCodes = [...updatedFlashCartConfig.deviceCodes];
        updatedDeviceCodes[index] = {
            ...updatedDeviceCodes[index],
            ...config
        };
        updatedFlashCartConfig.deviceCodes = updatedDeviceCodes;
        setFlashCartConfig(props.index, updatedFlashCartConfig, persist);
    };

    const setManufacturer = (index: number, manufacturer: string, persist = true) => {
        setDeviceCode(index, { manufacturer }, persist);
    };

    const setProduct = (index: number, product: string, persist = true) => {
        setDeviceCode(index, { product }, persist);
    };

    const setVid = (index: number, vid: number, persist = true) => {
        setDeviceCode(index, { vid }, persist);
    };

    const setPid = (index: number, pid: number, persist = true) => {
        setDeviceCode(index, { pid }, persist);
    };

    return <VContainer
        className='flashCartConfig'
        gap={10}
    >
        <VContainer>
            <img
                src={flashCartConfig.image ? vesFlashCartService.replaceImagePlaceholders(flashCartConfig.image) : IMAGE_FLASH_CART}
                width={75}
            />
        </VContainer>
        <VContainer grow={1}>
            <HContainer alignItems='end'>
                <VContainer grow={1}>
                    <label>
                        {nls.localize('vuengine/flashCarts/configs/name', 'Name')}
                    </label>
                    <input
                        type="text"
                        disabled={readOnly}
                        className="theia-input"
                        value={flashCartConfig.name}
                        onBlur={e => setName(e.target.value)}
                        onChange={e => setName(e.target.value, false)}
                    />
                </VContainer>
                {!readOnly && <button
                    className='theia-button secondary'
                    onClick={() => props.removeFlashCartConfig(props.index)}
                    title={nls.localize('vuengine/flashCarts/configs/removeFlashCartConfig', 'Remove Flash Cart Config')}
                >
                    <i className='codicon codicon-x' />
                </button>}
            </HContainer>
            <HContainer gap={20}>
                <VContainer grow={1}>
                    <label>
                        {nls.localize('vuengine/flashCarts/configs/size', 'Size')}
                    </label>
                    {readOnly ?
                        <input
                            type="text"
                            disabled={true}
                            className="theia-input"
                            value={flashCartConfig.size + ' MBit'}
                        /> : <SelectComponent
                            defaultValue={flashCartSizes.includes(flashCartConfig.size) ? flashCartConfig.size.toString() : '16'}
                            options={flashCartSizes.map(f => ({
                                label: f + ' MBit',
                                value: f.toString(),
                            }))}
                            onChange={option => setSize(parseInt(option.value!))}
                        />}
                </VContainer>
                <VContainer>
                    <label>
                        {nls.localize('vuengine/flashCarts/configs/padRom', 'Pad')}
                    </label>
                    <input
                        type="checkbox"
                        disabled={readOnly}
                        className="theia-input"
                        onChange={e => setPadRom(e.target.checked)}
                        checked={flashCartConfig.padRom}
                    />
                </VContainer>
            </HContainer>
        </VContainer>
        <HContainer alignItems='end'>
            <VContainer grow={1}>
                <label>
                    {nls.localize('vuengine/flashCarts/configs/flasherPath', 'Flasher Path')}
                </label>
                <input
                    type="text"
                    disabled={readOnly}
                    className="theia-input"
                    value={flashCartConfig.path}
                    onBlur={e => setPath(e.target.value)}
                    onChange={e => setPath(e.target.value, false)}
                />
            </VContainer>
            {!readOnly && <button
                className="theia-button secondary"
                onClick={() => selectFlasherPath(props.index)}
            >
                <i className="fa fa-ellipsis-h" />
            </button>}
        </HContainer>
        <VContainer>
            <label>
                {nls.localize('vuengine/flashCarts/configs/flasherArguments', 'Flasher Arguments')}
            </label>
            <ReactTextareaAutosize
                className="theia-input"
                disabled={readOnly}
                value={flashCartConfig.args}
                maxRows={4}
                onBlur={e => setArgs(e.target.value)}
                onChange={e => setArgs(e.target.value, false)}
            />
        </VContainer>
        <VContainer className='deviceCodes'>
            <label>
                {nls.localize('vuengine/flashCarts/configs/deviceCodes', 'DeviceCodes')}
            </label>
            <VContainer gap={15}>
                {flashCartConfig.deviceCodes && flashCartConfig.deviceCodes.map((dc, i) =>
                    <HContainer
                        alignItems='start'
                        gap={10}
                        key={`flashCart-${props.index}-deviceCodes-${i}`}
                    >
                        <div>#{i + 1}</div>
                        <VContainer grow={1}>
                            <HContainer>
                                <VContainer grow={1}>
                                    <label>VID</label>
                                    <input
                                        type="number"
                                        min={0}
                                        max={65535}
                                        disabled={readOnly}
                                        className="theia-input"
                                        value={dc.vid}
                                        onBlur={e => setVid(i, parseInt(e.target.value))}
                                        onChange={e => setVid(i, parseInt(e.target.value), false)}
                                    />
                                </VContainer>
                                <VContainer grow={1}>
                                    <label>PID</label>
                                    <input
                                        type="number"
                                        min={0}
                                        max={65535}
                                        disabled={readOnly}
                                        className="theia-input"
                                        value={dc.pid}
                                        onBlur={e => setPid(i, parseInt(e.target.value))}
                                        onChange={e => setPid(i, parseInt(e.target.value), false)}
                                    />
                                </VContainer>
                                {!readOnly && <VContainer>
                                    <label><br /></label>
                                    <button
                                        className='theia-button secondary'
                                        title={nls.localize('vuengine/flashCarts/configs/removeDeviceCode', 'Remove Device Code')}
                                        onClick={() => removeDeviceCode(i)}
                                    >
                                        <i className='codicon codicon-x' />
                                    </button>
                                </VContainer>}
                            </HContainer>
                            <HContainer>
                                <VContainer grow={1}>
                                    <label>
                                        {nls.localize('vuengine/flashCarts/configs/manufacturer', 'Manufacturer')}
                                    </label>
                                    <input
                                        type="text"
                                        disabled={readOnly}
                                        className="theia-input"
                                        value={dc.manufacturer}
                                        onBlur={e => setManufacturer(i, e.target.value)}
                                        onChange={e => setManufacturer(i, e.target.value, false)}
                                    />
                                </VContainer>
                            </HContainer>
                            <HContainer>
                                <VContainer grow={1}>
                                    <label>
                                        {nls.localize('vuengine/flashCarts/configs/product', 'Product')}
                                    </label>
                                    <input
                                        type="text"
                                        disabled={readOnly}
                                        className="theia-input"
                                        value={dc.product}
                                        onBlur={e => setProduct(i, e.target.value)}
                                        onChange={e => setProduct(i, e.target.value, false)}
                                    />
                                </VContainer>
                            </HContainer>
                        </VContainer>
                    </HContainer>
                )}
                {!readOnly && <button
                    className='theia-button secondary full-width'
                    onClick={addDeviceCode}
                >
                    <i className='codicon codicon-plus' />
                </button>}
            </VContainer>
        </VContainer>
    </VContainer>;
}
