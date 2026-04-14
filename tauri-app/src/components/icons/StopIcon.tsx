import { useId } from 'react';

export const StopIcon = ({ size = 24, className = "" }: { size?: number; className?: string }) => {
    const grad1 = useId();
    const grad2 = useId();

    return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" className={className}>
        <linearGradient id={grad1} x1="3.879" x2="20.121" y1="3.879" y2="20.121" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="currentColor" stopOpacity=".6"></stop><stop offset="1" stopColor="currentColor" stopOpacity=".3"></stop></linearGradient><path fill={`url(#${grad1})`} d="M6,3h12c1.657,0,3,1.343,3,3v12c0,1.657-1.343,3-3,3H6c-1.657,0-3-1.343-3-3V6	C3,4.343,4.343,3,6,3z"/><linearGradient id={grad2} x1="3.879" x2="20.121" y1="3.879" y2="20.121" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="currentColor" stopOpacity=".6"></stop><stop offset=".493" stopColor="currentColor" stopOpacity="0"></stop><stop offset=".997" stopColor="currentColor" stopOpacity=".3"></stop></linearGradient><path fill={`url(#${grad2})`} d="M18,3.5c1.378,0,2.5,1.122,2.5,2.5v12c0,1.378-1.122,2.5-2.5,2.5H6	c-1.378,0-2.5-1.122-2.5-2.5V6c0-1.378,1.122-2.5,2.5-2.5H18 M18,3H6C4.343,3,3,4.343,3,6v12c0,1.657,1.343,3,3,3h12	c1.657,0,3-1.343,3-3V6C21,4.343,19.657,3,18,3L18,3z"/>
    </svg>);
};
