import React from 'react';

interface MediaPreviewVideoProps {
    src: string
}

export default function MediaPreviewVideo(props: MediaPreviewVideoProps): React.JSX.Element {
    const { src } = props;

    return <video
        src={src}
        playsInline
        controls
    />;
}

