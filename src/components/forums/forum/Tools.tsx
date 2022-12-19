import { useState } from 'react';

import { Chevron, Gear } from '../../../assets';

import { PermissionsGate } from '../../common';

import { useForum } from '../../../contexts/DispatchProvider';
import { ForumData, ForumIdentity, useForumIdentity } from '../../../utils/hooks';
import { SCOPES } from '../../../utils/permissions';

import { EditForum, ManageModerators, ManageOwners, UploadForumBanner } from '..';

interface ToolsProps {
  forumData: ForumData;
  onUpdateBanner: (url: string) => Promise<void>;
  onShowManageAccess: (show: boolean) => void;
  update: () => Promise<void>;
}

export function Tools(props: ToolsProps): JSX.Element {
  const { forumData, onUpdateBanner, onShowManageAccess, update } = props;

  const forumObject = useForum();
  const { permission } = forumObject;
  const forumIdentity = useForumIdentity(forumData.collectionId);

  const [visible, setIsVisible] = useState(false);

  return (
    <div className="dsp- ">
      <div className='toolsWrapper' onMouseLeave={() => setIsVisible(false)}>
        <button
          className='gearToolButton'
          onClick={() => setIsVisible(!visible)}
        >
          <Gear />
        </button>
        <div className='toolsContent' >
          <div
            className={`toolItemsContainer ${visible ? '' : 'hide'}`}
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
          >
            <div className='toolItem' onClick={() => setIsVisible(false)}>
              <ManageOwners forumData={forumData} />
            </div>
            <div className='toolItem' onClick={() => setIsVisible(false)}>
              <ManageModerators forumData={forumData} />
            </div>
            <div className='toolItem' onClick={() => setIsVisible(false)}>
              { // The manage users UI should be hidden for DAA
                forumIdentity !==
                  ForumIdentity.DegenerateApeAcademy && (
                  <PermissionsGate
                    scopes={[SCOPES.canAddForumRestriction]}>
                    <button
                      className="moderatorTool"
                      disabled={!permission.readAndWrite}
                      onClick={() => {
                        setIsVisible(false);
                        onShowManageAccess(true);
                      }}>
                      <>Manage access</>
                      <Chevron direction='right' />
                    </button>
                  </PermissionsGate>
                )
              }
            </div>
            <div className='toolItem' onClick={() => setIsVisible(false)}>
              <EditForum forumData={forumData} update={update} />
            </div>
            <div className='toolItem' onClick={() => setIsVisible(false)}>
              <UploadForumBanner
                onSetImageURL={onUpdateBanner}
                collectionId={forumData.collectionId}
                currentBannerURL={forumData.images?.background ?? ''}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
