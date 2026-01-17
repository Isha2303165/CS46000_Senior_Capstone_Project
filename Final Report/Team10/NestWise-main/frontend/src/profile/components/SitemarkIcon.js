import * as React from 'react';
import SvgIcon from '@mui/material/SvgIcon';

export default function NestWiseIcon(props) {
  return (
    <SvgIcon
      sx={{ height: 60, width: 360, ...props.sx }}
      {...props}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 360 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="Arial, sans-serif"
          fontSize="48"
          fontWeight="bold"
        >
          <tspan fill="#FFD700">Nest</tspan>
          <tspan fill="#c47c1eff">Wise</tspan>
        </text>
      </svg>
    </SvgIcon>
  );
}