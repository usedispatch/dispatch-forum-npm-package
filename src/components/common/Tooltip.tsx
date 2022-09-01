import { ReactNode, useState } from "react";
import { Chevron } from "../../assets";

export interface TooltipProps {
  content: ReactNode | string;
  message: string;
}

export const Tooltip = (props: TooltipProps) => {
  const { message, content } = props;

  return (
    <div className="tooltipContainer">
      <div className="tooltipContent">
        {content}
        <span className="tooltipMessage">{message}</span>
      </div>
    </div>
  );
};
