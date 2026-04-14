import { useId } from 'react';

export const PlayIcon = ({ size = 24, className = "" }: { size?: number; className?: string }) => {
    const grad1 = useId();
    const grad2 = useId();

    return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" className={className}>
        <linearGradient id={grad1} x1="2.952" x2="15.664" y1="5.644" y2="18.356" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="currentColor" stopOpacity=".6"></stop><stop offset="1" stopColor="currentColor" stopOpacity=".3"></stop></linearGradient><path fill={`url(#${grad1})`} d="M19.904,9.952L8.827,2.567C8.415,2.293,7.939,2.154,7.461,2.154	c-0.398,0-0.797,0.096-1.161,0.291C5.5,2.873,5,3.708,5,4.615v14.769c0,0.908,0.5,1.742,1.3,2.17	c0.364,0.195,0.763,0.291,1.161,0.291c0.478,0,0.954-0.139,1.366-0.413l11.077-7.385C20.589,13.592,21,12.823,21,12	S20.589,10.408,19.904,9.952z"/><linearGradient id={grad2} x1="2.952" x2="15.664" y1="5.644" y2="18.356" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="currentColor" stopOpacity=".6"></stop><stop offset=".493" stopColor="currentColor" stopOpacity="0"></stop><stop offset=".997" stopColor="currentColor" stopOpacity=".3"></stop></linearGradient><path fill={`url(#${grad2})`} d="M7.461,2.654c0.389,0,0.765,0.114,1.088,0.329l11.077,7.385	C20.173,10.732,20.5,11.343,20.5,12c0,0.657-0.327,1.267-0.873,1.632L8.55,21.017c-0.323,0.216-0.7,0.329-1.088,0.329	c-0.322,0-0.642-0.08-0.925-0.232C5.897,20.772,5.5,20.109,5.5,19.385V4.615c0-0.725,0.397-1.387,1.036-1.729	C6.82,2.734,7.14,2.654,7.461,2.654 M7.461,2.154c-0.398,0-0.797,0.096-1.161,0.291C5.5,2.873,5,3.708,5,4.615v14.769	c0,0.908,0.5,1.742,1.3,2.17c0.364,0.195,0.763,0.291,1.161,0.291c0.478,0,0.954-0.139,1.366-0.413l11.077-7.385	C20.589,13.592,21,12.823,21,12s-0.411-1.592-1.096-2.048L8.827,2.567C8.415,2.293,7.939,2.154,7.461,2.154L7.461,2.154z"/>
    </svg>);
};
