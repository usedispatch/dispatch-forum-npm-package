import { ReactNode, useState } from "react";

export interface TooltipProps {
  content: ReactNode | string;
  message: string;
}

export const Tooltip = (props: TooltipProps) => {
  const { message, content } = props;
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className={`tooltipContainer ${isVisible ? "visible" : ""}`}>
      <div
        className={"tooltipContent"}
        onMouseLeave={() => setIsVisible(false)}
        onMouseEnter={() => setIsVisible(true)}>
        {content}
      </div>
      <span className="tooltipMessage">{message}</span>
    </div>
  );
};
