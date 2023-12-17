import { URI } from '@theia/core';
import React from 'react';
import { ImageConfig } from '../../../../images/browser/ves-images-types';
import { EditorsDockInterface, EditorsServices } from '../../ves-editors-widget';
import ImageConvEditorDock from './ImageConvEditorDock';

interface ImageConvProps {
    data: ImageConfig
    updateData: (data: ImageConfig) => void
    fileUri: URI
    dock: EditorsDockInterface
    services: EditorsServices
}

export default class ImageConvEditor extends React.Component<ImageConvProps> {
    constructor(props: ImageConvProps) {
        super(props);
    }

    async componentDidMount(): Promise<void> {
        this.props.dock.restoreLayout();
    }

    render(): React.JSX.Element {
        return (
            <ImageConvEditorDock
                data={this.props.data}
                updateData={this.props.updateData}
                fileUri={this.props.fileUri}
                dock={this.props.dock}
                services={this.props.services}
            />
        );
    }
}
