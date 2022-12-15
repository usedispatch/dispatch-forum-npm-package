interface VoteProps {
  isUpVote?: boolean;
  disabled?: boolean;
}

export function Vote({ isUpVote = false, disabled = false }: VoteProps): JSX.Element {
  if (isUpVote) {
    const color = disabled ? '#86878E' : '#4A279C';
    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
        xmlns="http://www.w3.org/2000/svg">
          <path d="M3 9L4.0575 10.0575L8.25 5.8725L8.25 15L9.75 15L9.75 5.8725L13.9425 10.0575L15 9L9 3L3 9Z" fill={color}/>
      </svg>

    );
  }

  const color = disabled ? '#86878E' : '#4A279C';
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 6L10.9425 4.9425L6.75 9.1275L6.75 -2.29485e-07L5.25 -2.95052e-07L5.25 9.1275L1.0575 4.9425L6.91406e-07 6L6 12L12 6Z" fill={color}/>
    </svg>
  );
}
