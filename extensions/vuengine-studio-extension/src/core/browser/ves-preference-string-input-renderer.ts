import { nls } from '@theia/core';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable } from '@theia/core/shared/inversify';
import { FileDialogService, OpenFileDialogProps } from '@theia/filesystem/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { PreferenceStringInputRenderer } from '@theia/preferences/lib/browser/views/components/preference-string-input';

@injectable()
export class VesPreferenceStringInputRenderer extends PreferenceStringInputRenderer {
    @inject(FileService)
    protected fileService: FileService;
    @inject(FileDialogService)
    protected fileDialogService: FileDialogService;

    protected createInteractable(parent: HTMLElement): void {
        const additionalProperties = this.preferenceNode.preference.data.additionalProperties?.valueOf();
        // @ts-ignore
        if (typeof additionalProperties === 'object' && additionalProperties.isDirectory) {

            const wrapper = document.createElement('div');
            wrapper.classList.add('ves-pref-input-wrapper');
            super.createInteractable(wrapper);

            const button = document.createElement('button');
            button.classList.add('theia-button');
            button.classList.add('secondary');
            button.style.minWidth = '40px';
            button.onclick = this.selectDirectory;
            button.onblur = this.handleBlur;
            const buttonIcon = document.createElement('i');
            buttonIcon.style.fontSize = '16px';
            buttonIcon.style.verticalAlign = 'middle';
            buttonIcon.classList.add('fa');
            buttonIcon.classList.add('fa-ellipsis-h');
            button.appendChild(buttonIcon);
            wrapper.appendChild(button);

            parent.appendChild(wrapper);

        } else {
            super.createInteractable(parent);
        }
    }

    protected selectDirectory = async (): Promise<void> => {
        const props: OpenFileDialogProps = {
            title: nls.localize('vuengine/general/selectDirectory', 'Select directory'),
            canSelectFolders: true,
            canSelectFiles: false
        };
        const currentValue = this.getValue();
        const currentPath = (currentValue && await this.fileService.exists(new URI(currentValue).withScheme('file')))
            ? await this.fileService.resolve(new URI(currentValue).withScheme('file'))
            : undefined;
        const dirUri = await this.fileDialogService.showOpenDialog(props, currentPath);
        if (dirUri) {
            const destinationFolder = await this.fileService.resolve(dirUri);
            if (destinationFolder.isDirectory) {
                this.setPreferenceWithDebounce(destinationFolder.resource.path.fsPath());
            }
        }
    };

    protected handleBlur = async (): Promise<void> => {
        await super.handleBlur();
    };
}
