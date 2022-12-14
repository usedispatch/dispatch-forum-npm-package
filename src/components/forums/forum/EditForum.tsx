import isNil from 'lodash/isNil';
import { useState, ReactNode, useMemo } from 'react';

import { Chevron } from '../../../assets';
import {
  CollapsibleProps,
  MessageType,
  PopUpModal,
  TransactionLink,
} from '../../common';
import { Notification } from '../../forums';
import { useForum } from '../../../contexts/DispatchProvider';

import { ForumData } from '../../../utils/hooks';
import { errorSummary } from '../../../utils/error';
import { isSuccess } from '../../../utils/loading';
import { NOTIFICATION_BANNER_TIMEOUT } from '../../../utils/consts';

interface EditForumProps {
  forumData: ForumData;
  update: () => Promise<void>;
}

export function EditForum(props: EditForumProps): JSX.Element | null {
  const { forumData, update } = props;
  const forumObject = useForum();
  const { permission } = forumObject;
  const [bodySize, setBodySize] = useState(
    Buffer.from(forumData.description.desc, 'utf-8').byteLength,
  );
  const [editForum, setEditForum] = useState<{
    show: boolean;
    title: string;
    description: string;
    loading?: boolean;
  }>({
    show: false,
    title: forumData.description.title,
    description: forumData.description.desc,
  });

  const [notificationContent, setNotificationContent] = useState<{
    isHidden: boolean;
    content?: string | ReactNode;
    type?: MessageType;
  }>({ isHidden: true });
  const [modalInfo, setModalInfo] = useState<{
    title: string | ReactNode;
    type: MessageType;
    body?: string | ReactNode;
    collapsible?: CollapsibleProps;
  } | null>(null);

  const isOwner = useMemo(async () => {
    return forumObject.isOwner(forumData.collectionId);
  }, [forumObject]);

  const editForumInfo = async (): Promise<void> => {
    setEditForum({ ...editForum, loading: true });
    const desc = { title: editForum.title, desc: editForum.description };

    const tx = await forumObject.setDescription(forumData.collectionId, desc);
    if (isSuccess(tx)) {
      await update();
      setBodySize(0);
      setEditForum({ show: false, title: desc.title, description: desc.desc });
      setNotificationContent({
        isHidden: false,
        type: MessageType.success,
        content: (
          <>
            The forum was edited.
            <TransactionLink transaction={tx} />
          </>
        ),
      });
      setTimeout(
        () => setNotificationContent({ isHidden: true }),
        NOTIFICATION_BANNER_TIMEOUT,
      );
    } else {
      const error = tx;
      setEditForum({ ...editForum, loading: false });
      setModalInfo({
        title: 'Something went wrong!',
        type: MessageType.error,
        body: 'The forum could not be edited',
        collapsible: { header: 'Error', content: errorSummary(error) },
      });
    }
  };

  if (!isOwner) {
    return null;
  }

  return (
    <div className="dsp- ">
      <div className="editForumContainer">
        <Notification
          hidden={notificationContent.isHidden}
          content={notificationContent?.content}
          type={notificationContent?.type}
          onClose={() => setNotificationContent({ isHidden: true })}
        />
        {editForum.show && isNil(modalInfo) && (
          <PopUpModal
            id="edit-forum"
            visible
            title="Edit community"
            body={
              <div className="editForumBody">
                <div>
                  <label className="editForumLabel">Community title</label>
                  <input
                    type="text"
                    placeholder="New forum title"
                    className="editForumInput"
                    value={editForum.title}
                    onChange={(e) =>
                      setEditForum({ ...editForum, title: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="editForumLabel">Community description</label>
                  <textarea
                    placeholder="New forum description"
                    className="editForumInput description"
                    value={editForum.description}
                    maxLength={800}
                    onChange={(e) => {
                      setEditForum({
                        ...editForum,
                        description: e.target.value,
                      });
                      setBodySize(
                        Buffer.from(e.target.value, 'utf-8').byteLength,
                      );
                    }}
                  />
                  <div className="textSize"> {bodySize}/800 </div>
                </div>
              </div>
            }
            loading={editForum.loading}
            onClose={() => {
              setEditForum({
                show: false,
                title: forumData.description.title,
                description: forumData.description.desc,
              });
              setBodySize(
                Buffer.from(forumData.description.desc, 'utf-8').byteLength,
              );
            }}
            okButton={
              <button
                className="okButton"
                disabled={
                  !(
                    editForum.description.length > 0 &&
                    editForum.title.length > 0
                  ) || bodySize > 800
                }
                onClick={async () => editForumInfo()}>
                Save
              </button>
            }
          />
        )}
        {!isNil(modalInfo) && (
          <PopUpModal
            id="edit-forum-info"
            visible
            title={modalInfo.title}
            messageType={modalInfo.type}
            body={modalInfo.body}
            collapsible={modalInfo.collapsible}
            onClose={() => setModalInfo(null)}
            okButton={
              <a className="okButton" onClick={() => setModalInfo(null)}>
                OK
              </a>
            }
          />
        )}
        <button
          className="editForumButton"
          disabled={!permission.readAndWrite}
          onClick={() => setEditForum({ ...editForum, show: true })}>
          <>Edit community</>
          <Chevron direction='right' />
        </button>
      </div>
    </div>
  );
}
