import { useState } from "react";

export interface CollapsibleProps {
  content: any;
  header?: string;
}

export const Collapsible = (props: CollapsibleProps) => {
  const { header, content } = props;
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="collapsibleContainer">
      <div className="collapsibleHeaderContainer">
        <div className="collapsibleHeader">{header ?? ""}</div>
        <button className="visibilityButton" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? "hide" : "show"}
        </button>
      </div>
      <div className="collapsibleContent" hidden={!isOpen}>
        {content}
      </div>
    </div>
  );
};
