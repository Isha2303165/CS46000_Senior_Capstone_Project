import * as React from 'react';
import SvgIcon from '@mui/material/SvgIcon';

export default function NestWiseIcon() {
  return (
    <SvgIcon sx={{ height: 29, width: 180, mr: 2 }}>
      <svg
        width={120}
        height={25}
        viewBox="0 0 120 25"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* "Nest" in Gold */}
        <text
          x="-10"
          y="20"
          fill="#FFD700"
          fontFamily="Arial, sans-serif"
          fontSize="25"
          fontWeight="bold"
        >
          Nest
        </text>

        {/* "Wise" in Light Brown */}
        <text
          x="45"
          y="20"
          fill="#c47c1eff"  // light brown / tan
          fontFamily="Arial, sans-serif"
          fontSize="25"
          fontWeight="bold"
        >
          Wise
        </text>
      </svg>
    </SvgIcon>
  );
}