interface ChevronProps {
  direction?: "up" | "right" | "down" | "left";
}

export function Chevron(props: ChevronProps) {
  let rotate = "";

  switch (props.direction) {
    case "up":
      rotate = "rotate(270)";
      break;
    case "down":
      rotate = "rotate(90)";
      break;
    case "left":
      rotate = "rotate(180)";
      break;
    case "right":
      rotate = "rotate(0)";
      break;
    default:
      break;
  }

  return (
    <svg
      width="4"
      height="8"
      viewBox="0 0 4 8"
      fill="none"
      transform={rotate}
      xmlns="http://www.w3.org/2000/svg">
      <path
        d="M0.5 7L3.5 4L0.5 1"
        stroke="#CAC9CB"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
