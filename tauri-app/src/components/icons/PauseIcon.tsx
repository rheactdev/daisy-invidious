import { useId } from 'react';

export const PauseIcon = ({ size = 24, className = "" }: { size?: number; className?: string }) => {
    const grad1 = useId();
    const grad2 = useId();
    const grad3 = useId();
    const grad4 = useId();

    return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" className={className}>
        <linearGradient id={grad1} x1="5" x2="10" y1="12" y2="12" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="currentColor" stopOpacity=".6"></stop><stop offset="1" stopColor="currentColor" stopOpacity=".3"></stop></linearGradient><path fill={`url(#${grad1})`} d="M7,21h1c1.105,0,2-0.895,2-2V5c0-1.105-0.895-2-2-2H7C5.895,3,5,3.895,5,5v14	C5,20.105,5.895,21,7,21z"/><linearGradient id={grad2} x1="5" x2="10" y1="12" y2="12" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="currentColor" stopOpacity=".6"></stop><stop offset=".493" stopColor="currentColor" stopOpacity="0"></stop><stop offset=".997" stopColor="currentColor" stopOpacity=".3"></stop></linearGradient><path fill={`url(#${grad2})`} d="M8,3.5c0.827,0,1.5,0.673,1.5,1.5v14c0,0.827-0.673,1.5-1.5,1.5H7c-0.827,0-1.5-0.673-1.5-1.5	V5c0-0.827,0.673-1.5,1.5-1.5H8 M8,3H7C5.895,3,5,3.895,5,5v14c0,1.105,0.895,2,2,2h1c1.105,0,2-0.895,2-2V5C10,3.895,9.105,3,8,3	L8,3z"/><linearGradient id={grad3} x1="14" x2="19" y1="12" y2="12" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="currentColor" stopOpacity=".6"></stop><stop offset="1" stopColor="currentColor" stopOpacity=".3"></stop></linearGradient><path fill={`url(#${grad3})`} d="M16,21h1c1.105,0,2-0.895,2-2V5c0-1.105-0.895-2-2-2h-1c-1.105,0-2,0.895-2,2v14	C14,20.105,14.895,21,16,21z"/><linearGradient id={grad4} x1="14" x2="19" y1="12" y2="12" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="currentColor" stopOpacity=".6"></stop><stop offset=".493" stopColor="currentColor" stopOpacity="0"></stop><stop offset=".997" stopColor="currentColor" stopOpacity=".3"></stop></linearGradient><path fill={`url(#${grad4})`} d="M17,3.5c0.827,0,1.5,0.673,1.5,1.5v14c0,0.827-0.673,1.5-1.5,1.5h-1	c-0.827,0-1.5-0.673-1.5-1.5V5c0-0.827,0.673-1.5,1.5-1.5H17 M17,3h-1c-1.105,0-2,0.895-2,2v14c0,1.105,0.895,2,2,2h1	c1.105,0,2-0.895,2-2V5C19,3.895,18.105,3,17,3L17,3z"/>
    </svg>);
};
