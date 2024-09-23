import { nls } from '@theia/core';
import React from 'react';

export default function NoBuildInCollaboration(): React.JSX.Element {
    return <div className="theia-TreeContainer lightLabel" style={{ boxSizing: 'border-box' }}>
        <div className="theia-WelcomeView">
            <div>
                {
                    nls.localize(
                        'vuengine/build/currentlyInACollaborationSession',
                        'You are currently in a remote collaboration session. Building is not supported in a remote environment.'
                    )
                }
            </div>
        </div>
    </div>;
}
