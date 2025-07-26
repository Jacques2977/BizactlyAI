import React from 'react';

interface CustomIconProps {
  size?: number;
}

const CustomIcon: React.FC<CustomIconProps> = ({ size = 32 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 1024 1024"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Paste your SVG <path> or <g> elements here */}
    <path
      d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64z"
      fill="#3B82F6"
    />
    <path
      d="M512 300a212 212 0 100 424 212 212 0 000-424zm0 372a160 160 0 110-320 160 160 0 010 320z"
      fill="#FFFFFF"
    />
    {/* This is just placeholder content. Use your real SVG paths here. */}
  </svg>
);

export { CustomIcon };
export default CustomIcon;