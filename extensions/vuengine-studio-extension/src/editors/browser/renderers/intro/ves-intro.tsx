import React from 'react';

interface VesIntroProps {
    label: string;
}

export const VesIntro: React.FC<VesIntroProps> = ({ label }) => (
    <div className='control intro-renderer'>
        <i className='fa fa-info-circle'></i>
        <label>{label}</label>
    </div >
);
