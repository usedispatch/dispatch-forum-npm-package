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
      <div className='toolsWrapper'>
        <button
          className='gearToolButton'
          onClick={() => setIsVisible(!visible)}
        >
          <Gear />
        </button>
        <div className={`toolItemsContainer ${visible ? '' : 'hide'}`}>
          <div className='toolItem'>
            <ManageOwners forumData={forumData} />
          </div>
          <div className='toolItem'>
            <ManageModerators forumData={forumData} />
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
                    <>Manage access</>
                    <Chevron direction='right' />
                  </button>
                </PermissionsGate>
              )
            }
          </div>
          <div className='toolItem'>
            <EditForum forumData={forumData} update={update} />
          </div>
          <div className='toolItem'>
            <UploadForumBanner
              onSetImageURL={onUpdateBanner}
              collectionId={forumData.collectionId}
              currentBannerURL={forumData.images?.background ?? ''}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
