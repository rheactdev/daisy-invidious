import { useId } from 'react';

export const PictureInPictureIcon = ({ size = 24, className = "" }: { size?: number; className?: string }) => {
    const grad1 = useId();
    const grad2 = useId();
    const grad3 = useId();

    return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" className={className}>
        <linearGradient id={grad1} x1="3.879" x2="20.121" y1="3.879" y2="20.121" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="currentColor" stopOpacity=".6"></stop><stop offset="1" stopColor="currentColor" stopOpacity=".3"></stop></linearGradient><path fill={`url(#${grad1})`} d="M5,4h14c1.657,0,3,1.343,3,3v10c0,1.657-1.343,3-3,3H5c-1.657,0-3-1.343-3-3V7 C2,5.343,3.343,4,5,4z"/><linearGradient id={grad2} x1="3.879" x2="20.121" y1="3.879" y2="20.121" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="currentColor" stopOpacity=".6"></stop><stop offset=".493" stopColor="currentColor" stopOpacity="0"></stop><stop offset=".997" stopColor="currentColor" stopOpacity=".3"></stop></linearGradient><path fill={`url(#${grad2})`} d="M19,4.5c1.379,0,2.5,1.122,2.5,2.5v10c0,1.378-1.121,2.5-2.5,2.5H5 c-1.379,0-2.5-1.122-2.5-2.5V7c0-1.378,1.121-2.5,2.5-2.5H19 M19,4H5C3.343,4,2,5.343,2,7v10c0,1.657,1.343,3,3,3h14 c1.657,0,3-1.343,3-3V7C22,5.343,20.657,4,19,4L19,4z"/><linearGradient id={grad3} x1="11.793" x2="18.207" y1="6.793" y2="13.207" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="currentColor" stopOpacity=".7"></stop><stop offset=".519" stopColor="currentColor" stopOpacity=".45"></stop><stop offset="1" stopColor="currentColor" stopOpacity=".55"></stop></linearGradient><path fill={`url(#${grad3})`} d="M12,13h6c0.552,0,1-0.448,1-1V8c0-0.552-0.448-1-1-1h-6c-0.552,0-1,0.448-1,1v4	C11,12.552,11.448,13,12,13z"/>
    </svg>);
};
