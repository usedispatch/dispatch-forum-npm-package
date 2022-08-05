import { ReactNode } from "react";

import { Close } from "../../assets";
import { MessageType, getMessageTypeIcon } from "../common";

export interface NotificationProps {
  content: string | ReactNode;
  hidden: boolean;
  type?: MessageType;
  onClose: () => void;
}

export const Notification = (props: NotificationProps) => {
  const { content, hidden, type, onClose } = props;

  /*  On the component using Notification use a timeout to hide it after some seconds
      setTimeout(() => setIsNotificationHidden(true), NOTIFICATION_BANNER_TIMEOUT);
  */

  const icon = getMessageTypeIcon(type);

  return (
    <div
      className={`notificationContainer ${hidden ? "isHidden" : ""} ${type}`}>
      <div className="notificationText">
        {icon}
        {content}
      </div>
      <div className="closeContainer" onClick={() => onClose()}>
        <Close />
      </div>
    </div>
  );
};
