interface UploadImageLogoProps {
  className: string
};

export function UploadImageLogo({ className }: UploadImageLogoProps): JSX.Element {
  return(
    <svg width="28" height="28" viewBox="0 0 28 27" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <g clip-path="url(#clip0_3261_35985)">
      <path d="M23.5703 1.125H4.32031C2.80153 1.125 1.57031 2.35622 1.57031 3.875V23.125C1.57031 24.6438 2.80153 25.875 4.32031 25.875H23.5703C25.0891 25.875 26.3203 24.6438 26.3203 23.125V3.875C26.3203 2.35622 25.0891 1.125 23.5703 1.125Z" stroke="#2E008B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M8.88281 11.25C10.4361 11.25 11.6953 9.9908 11.6953 8.4375C11.6953 6.8842 10.4361 5.625 8.88281 5.625C7.32951 5.625 6.07031 6.8842 6.07031 8.4375C6.07031 9.9908 7.32951 11.25 8.88281 11.25Z" stroke="#2E008B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M26.3203 17.8977L19.2891 11.25L3.82031 25.875" stroke="#2E008B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
      <defs>
      <clipPath id="clip0_3261_35985">
      <rect width="27" height="27" fill="white" transform="translate(0.445312)"/>
      </clipPath>
      </defs>
    </svg>
  );
}
