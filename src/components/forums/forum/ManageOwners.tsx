import isNil from 'lodash/isNil';
import { useState, ReactNode } from 'react';
import Jdenticon from 'react-jdenticon';
import { PublicKey } from '@solana/web3.js';

import { Trash, Undo } from '../../../assets';
import {
  CollapsibleProps,
  MessageType,
  PermissionsGate,
  PopUpModal,
  TransactionLink,
} from '../../common';
import { Notification } from '..';
import { useForum } from '../../../contexts/DispatchProvider';

import { ForumData } from '../../../utils/hooks';
import { getIdentity } from '../../../utils/identity';
import { NOTIFICATION_BANNER_TIMEOUT } from '../../../utils/consts';
import { isSuccess } from '../../../utils/loading';
import { errorSummary } from '../../../utils/error';
import { newPublicKey } from '../../../utils/postbox/validateNewPublicKey';
import { SCOPES } from '../../../utils/permissions';

interface ManageOwnersProps {
  forumData: ForumData;
}

export function ManageOwners(props: ManageOwnersProps): JSX.Element | null {
  const { forumData } = props;
  const forumObject = useForum();
  const { permission } = forumObject;

  const [manageOwners, setManageOwners] = useState<{
    show: boolean;
    newOwner: string;
    currentOwners: Array<{ id: string; toRemove: boolean }>;
    saving: boolean;
  }>(() => {
    let owners: Array<{ id: string; toRemove }> = [];
    if (isSuccess(forumData.owners)) {
      owners = forumData.owners.map(pkey => ({
        id: pkey.toBase58(),
        toRemove: false,
      }));
    } else {
      // TODO(andrew) show error here for missing owners
    }

    return {
      show: false,
      newOwner: '',
      currentOwners: owners,
      saving: false,
    };
  });

  const resetInitialValues = (): void => {
    let owners: Array<{ id: string; toRemove: boolean }> = [];
    if (isSuccess(forumData.owners)) {
      owners = forumData.owners.map(pkey => ({
        id: pkey.toBase58(),
        toRemove: false,
      }));
    } else {
      // TODO(andrew) show error here for missing owners
    }

    setManageOwners({
      show: false,
      newOwner: '',
      currentOwners: owners,
      saving: false,
    });
  };

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

  // const isOwner = useMemo(async () => {
  //   return forumObject.isOwner(forumData.collectionId);
  // }, [forumObject]);

  const addToList = async (): Promise<void> => {
    if (manageOwners.newOwner.length > 0) {
      const ownerId = newPublicKey(manageOwners.newOwner);
      if (isSuccess(ownerId)) {
        const newOwnersList = manageOwners.currentOwners;
        newOwnersList.push({ id: manageOwners.newOwner, toRemove: false });
        setManageOwners({
          ...manageOwners,
          newOwner: '',
          currentOwners: newOwnersList,
        });
      } else {
        const error = ownerId;
        setModalInfo({
          title: 'Something went wrong!',
          type: MessageType.error,
          collapsible: { header: 'Error', content: errorSummary(error) },
        });
      }
    }
  };

  const saveChanges = async (): Promise<void> => {
    setManageOwners({ ...manageOwners, saving: true });
    const filtered = manageOwners.currentOwners.filter(o => !o.toRemove);
    const publicKeys = filtered.map(o => newPublicKey(o.id));

    const newOwnersList = publicKeys.filter(result =>
      isSuccess(result),
    ) as PublicKey[];

    const tx = await forumObject.addOwners(
      newOwnersList,
      forumData.collectionId,
    );

    if (isSuccess(tx)) {
      setManageOwners({
        currentOwners: filtered,
        show: false,
        newOwner: '',
        saving: false,
      });
      setNotificationContent({
        isHidden: false,
        content: (
          <>
            Owners list updated.
            <TransactionLink transaction={tx} />
          </>
        ),
        type: MessageType.success,
      });
      setTimeout(
        () => setNotificationContent({ isHidden: true }),
        NOTIFICATION_BANNER_TIMEOUT,
      );
    } else {
      const error = tx;
      resetInitialValues();
      setModalInfo({
        title: 'Something went wrong!',
        type: MessageType.error,
        body: 'The owners list could not be updated',
        collapsible: { header: 'Error', content: errorSummary(error) },
      });
    }
  };

  return (
    <div className="dsp- ">
      <div className="manageOwnersContainer">
        <Notification
          hidden={notificationContent.isHidden}
          content={notificationContent?.content}
          type={notificationContent?.type}
          onClose={() => setNotificationContent({ isHidden: true })}
        />
        {isNil(modalInfo) && manageOwners.show && (
          <PopUpModal
            id="add-owners"
            visible
            title={'Manage owners'}
            body={
              <div className="manageOwnersBody">
                <label className="manageOwnersLabel">Add new</label>
                <div className="addOwner">
                  <input
                    placeholder="Add owners's wallet ID here"
                    className="manageOwnersInput"
                    maxLength={800}
                    value={manageOwners.newOwner}
                    onChange={(e: { target: { value: any } }) =>
                      setManageOwners({
                        ...manageOwners,
                        newOwner: e.target.value,
                      })
                    }
                  />
                  <button
                    className="okButton add"
                    onClick={async () => addToList()}>
                    Add
                  </button>
                </div>
                <label className="manageOwnersLabel">Current owners</label>
                <ul>
                  {manageOwners.currentOwners.map((m, index) => {
                    const pkey = newPublicKey(m.id);
                    if (isSuccess(pkey)) {
                      const identity = getIdentity(pkey);
                      const displayName =
                        identity != null ? identity.displayName : m.id;

                      return (
                        <li
                          key={m.id}
                          className={`currentOwners ${
                            m.toRemove ? 'toRemove' : ''
                          }`}>
                          <div className="identity">
                            <div className="iconContainer">
                              {!isNil(identity) && (
                                <img
                                  src={identity.profilePicture.href}
                                  style={{ borderRadius: '50%' }}
                                />
                              )}
                              {isNil(identity) && (
                                <Jdenticon value={m.id} alt="ownerId" />
                              )}
                            </div>
                            <div className="displayName">{displayName}</div>
                          </div>
                          <button
                            className={`deleteIcon ${
                              forumObject.wallet.publicKey.toBase58() === m.id
                                ? 'hide'
                                : ''
                            }`}
                            onClick={() => {
                              const newList = manageOwners.currentOwners;
                              newList[index].toRemove =
                                !manageOwners.currentOwners[index].toRemove;

                              setManageOwners({
                                ...manageOwners,
                                currentOwners: newList,
                              });
                            }}>
                            {m.toRemove && <Undo />}
                            {!m.toRemove && (
                              <div className="trash">
                                <Trash />
                              </div>
                            )}
                          </button>
                        </li>
                      );
                    } else {
                      console.error(pkey);
                      return null;
                    }
                  })}
                </ul>
              </div>
            }
            loading={manageOwners.saving}
            okButton={
              <button className="okButton" onClick={async () => saveChanges()}>
                Save
              </button>
            }
            cancelButton={
              <button
                className="cancelButton"
                onClick={() => resetInitialValues()}>
                Cancel
              </button>
            }
            onClose={() => resetInitialValues()}
          />
        )}
        {!isNil(modalInfo) && (
          <PopUpModal
            id="manage-owners-info"
            visible
            title={modalInfo.title}
            messageType={modalInfo.type}
            body={modalInfo.body}
            collapsible={modalInfo.collapsible}
            okButton={
              <a className="okButton" onClick={() => setModalInfo(null)}>
                OK
              </a>
            }
          />
        )}
        <PermissionsGate scopes={[SCOPES.canAddOwner]}>
          <button
            className="manageOwnersButton"
            disabled={!permission.readAndWrite}
            onClick={() => setManageOwners({ ...manageOwners, show: true })}>
            Manage owners
          </button>
        </PermissionsGate>
      </div>
    </div>
  );
}
