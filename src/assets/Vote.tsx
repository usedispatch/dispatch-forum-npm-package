interface VoteProps {
  isUpVote?: boolean;
  disabled?: boolean;
}

export function Vote({ isUpVote = false }: VoteProps): JSX.Element {
  if (isUpVote) {
    return (
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 9.5V2.5" stroke="#85838E" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2.5 6L6 2.5L9.5 6" stroke="#85838E" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }

  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 2.5V9.5" stroke="#85838E" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9.5 6L6 9.5L2.5 6" stroke="#85838E" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
