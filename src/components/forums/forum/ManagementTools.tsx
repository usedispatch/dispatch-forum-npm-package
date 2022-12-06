import { useState } from 'react';

import { Gear } from '../../../assets';

import { PermissionsGate } from '../../common';

import { useForum } from '../../../contexts/DispatchProvider';
import { ForumData, ForumIdentity, useForumIdentity } from '../../../utils/hooks';
import { SCOPES } from '../../../utils/permissions';
import { useMediaQuery } from '../../../utils/useMediaQuery';

import { EditForum, ManageModerators, ManageOwners, UploadForumBanner } from '..';

interface ManagementToolsProps {
  forumData: ForumData;
  onUpdateBanner: (url: string) => Promise<void>;
  onShowManageAccess: (show: boolean) => void;
  update: () => Promise<void>;
}

export function ManagementTools(props: ManagementToolsProps): JSX.Element {
  const { forumData, onUpdateBanner, onShowManageAccess, update } = props;
  const isMobile = useMediaQuery('(max-width: 768px)');

  const forumObject = useForum();
  const { permission } = forumObject;
  const forumIdentity = useForumIdentity(forumData.collectionId);

  const [visible, setIsVisible] = useState(false);

  return (
    <div className="dsp- ">
      { isMobile
        ? <>
            <button
              className='gearToolButton'
              onClick={() => setIsVisible(!visible)}
            >
              <Gear />
            </button>
            {visible &&
              <div className='toolItemsContainer'>
                <div className='toolItem'>
                  <ManageOwners forumData={forumData} buttonText='Manage owners'/>
                </div>
                <div className='toolItem'>
                  <ManageModerators forumData={forumData} buttonText='Manage moderators'/>
                </div>
                <div className='toolItem'>
                  { // The manage users UI should be hidden for DAA
                    forumIdentity !==
                      ForumIdentity.DegenerateApeAcademy && (
                      <PermissionsGate
                        scopes={[SCOPES.canAddForumRestriction]}>
                        <button
                          className="moderatorTool"
                          disabled={!permission.readAndWrite}
                          onClick={() => onShowManageAccess(true)}>
                          Manage access
                        </button>
                      </PermissionsGate>
                    )
                  }
                </div>
                <div className='toolItem'>
                  <EditForum forumData={forumData} update={update} buttonText='Edit community' />
                </div>
                {/* <div className='toolItem'>
                  <UploadForumBanner
                    onSetImageURL={onUpdateBanner}
                    collectionId={forumData.collectionId}
                    currentBannerURL={forumData.images?.background ?? ''}
                  />
                </div> */}
              </div>
            }
          </>
        : (
          <div className="toolsWrapper">
            <PermissionsGate scopes={[SCOPES.canEditForum]}>
              <div className="moderatorToolsContainer">
                <div className="tools">
                  <div>Manage tools: </div>
                  <ManageOwners forumData={forumData} />
                  <ManageModerators forumData={forumData} />
                  {
                    // The manage users UI should be hidden for DAA
                    forumIdentity !==
                      ForumIdentity.DegenerateApeAcademy && (
                      <PermissionsGate
                        scopes={[SCOPES.canAddForumRestriction]}>
                        <button
                          className="moderatorTool"
                          disabled={!permission.readAndWrite}
                          onClick={() => onShowManageAccess(true)}>
                          Forum access
                        </button>
                      </PermissionsGate>
                    )
                  }
                  <EditForum forumData={forumData} update={update} />
                  <UploadForumBanner
                    onSetImageURL={onUpdateBanner}
                    collectionId={forumData.collectionId}
                    currentBannerURL={forumData.images?.background ?? ''}
                  />
                </div>
              </div>
            </PermissionsGate>
          </div>
        )}
    </div>
  );
}
