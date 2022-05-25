import React from 'react';

interface VesImagesProps {
    label: string;
}

export const VesImages: React.FC<VesImagesProps> = ({ label }) => (
    <div className='control images-renderer'>
        <label>{label}</label>
        <div>
            <img src="" />
        </div>
    </div>
);
