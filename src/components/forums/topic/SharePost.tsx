import { useState } from 'react';

import { Chain } from '../../../assets';
import { MessageType } from './../../common';
import { Notification } from '../../../components/forums';
import { NOTIFICATION_BANNER_TIMEOUT } from '../../../utils/consts';

interface SharePostProps {
  postAddress: string;
}

export function SharePost({ postAddress }: SharePostProps): JSX.Element {
  const [notification, setNotification] = useState<{
    isHidden: boolean;
    content?: string;
    type?: MessageType;
  }>({ isHidden: true });

  const handleClick = async (): Promise<any> => {
    window.location.replace(`#${postAddress}`);
    await navigator.clipboard.writeText(window.location.href);
    setNotification({
      isHidden: false,
      content: 'Link copied successfully',
      type: MessageType.info,
    });
    setTimeout(
      () => setNotification({ isHidden: true }),
      NOTIFICATION_BANNER_TIMEOUT,
    );
  };

  return (
    <>
      <Notification
        hidden={notification.isHidden}
        content={notification?.content}
        type={notification?.type}
        onClose={() => setNotification({ isHidden: true })}
      />
      <button type="button" onClick={handleClick}>
      <Chain />
    </button>
    </>
  );
};
