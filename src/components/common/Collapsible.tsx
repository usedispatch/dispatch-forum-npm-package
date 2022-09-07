import { useState } from "react";
import { Chevron } from "../../assets";

export interface CollapsibleProps {
  content: any;
  header?: string;
}

export const Collapsible = (props: CollapsibleProps) => {
  const { header, content } = props;
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="collapsibleContainer">
      <div
        className="collapsibleHeaderContainer"
        onClick={() => setIsOpen(!isOpen)}>
        <div className="collapsibleHeader">{header ?? ""}</div>
        <button className="visibilityButton">
          <Chevron direction={isOpen ? "up" : "down"} />
        </button>
      </div>
      <div className="collapsibleContent" hidden={!isOpen}>
        {content}
      </div>
    </div>
  );
};
