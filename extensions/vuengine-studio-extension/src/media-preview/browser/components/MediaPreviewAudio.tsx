import React from 'react';

interface MediaPreviewAudioProps {
    src: string
}

export default function MediaPreviewAudio(props: MediaPreviewAudioProps): React.JSX.Element {
    const { src } = props;

    return <audio
        preload="auto"
        controls
        src={src}
    />;
}

