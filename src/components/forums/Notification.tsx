import { ReactNode } from "react";

import { Close } from "../../assets";

export interface NotificationProps {
  content: string | ReactNode;
  hidden: boolean;
  onClose: () => void;
}

export const Notification = (props: NotificationProps) => {
  const { content, hidden, onClose } = props;

  /*  On the component using Notification use a timeout to hide it after some seconds
          useEffect(() => {
            if (!isNotificationHidden) {
              setTimeout(() => setIsNotificationHidden(true), 4000);
            }
          }, [isNotificationHidden]);
  */

  return (
    <div className={`notificationContainer ${hidden ? "isHidden" : undefined}`}>
      <div className="notificationText">{content}</div>
      <div className="closeContainer" onClick={() => onClose()}>
        <Close />
      </div>
    </div>
  );
};