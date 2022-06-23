import "./../../style.css";
import * as _ from "lodash";
import {
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useMemo,
  useContext,
} from "react";
import { ForumInfo } from "@usedispatch/client";
import * as web3 from "@solana/web3.js";

import { HomeLogo, Plus } from "../../assets";
import { MessageType, PopUpModal, Spinner } from "../../components/common";
import { CardsContainer, PoweredByDispatch } from "../../components/forums";

import { userRole, UserRoleType } from "../../utils/postbox/userRole";
import { ForumContext } from "../../contexts/DispatchProvider";

interface HomeViewProps {
  collectionId?: string;
}

export const HomeView = (props: HomeViewProps) => {
  const Forum = useContext(ForumContext);
  const wallet = Forum.wallet;
  const { publicKey } = Forum.wallet;
  const connected = Forum.isNotEmpty;

  const [forum, setForum] = useState<ForumInfo>();
  const [showNewForumModal, setShowNewForumModal] = useState(false);
  const [role, setRole] = useState<UserRoleType | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [newModerators, setNewModerators] = useState<string[]>([]);
  const [modalInfo, setModalInfo] = useState<{
    title: string | ReactNode;
    type: MessageType;
    body?: string;
  } | null>(null);

  const urlPath = window.location.toString();
  // const params = new URLSearchParams(this.props.match.params.id);

  return (
    <div className="homeViewContainer">
      {!_.isNil(modalInfo) && (
        <PopUpModal
          id="create-forum-info"
          visible
          title={modalInfo?.title}
          messageType={modalInfo?.type}
          body={modalInfo?.body}
          okButton={
            <a className="okInfoButton" onClick={() => setModalInfo(null)}>
              OK
            </a>
          }
        />
      )}
      {showNewForumModal && (
        <PopUpModal
          id="create-forum"
          visible
          title={"Create new Forum"}
          body={
            <div className="createForumBody">
              <>
                <span className="createForumLabel">Forum Title</span>
                <input
                  type="text"
                  placeholder="Title"
                  className="createForumTitle"
                  name="name"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </>
              <>
                <span className="createForumLabel">Forum Description</span>
                <textarea
                  placeholder="Description"
                  className="createForumTitle createForumDescription"
                  maxLength={800}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </>
              <>
                <span className="createForumLabel">Moderators</span>
                <input
                  placeholder="Add moderators' wallet ID here, separated by commas"
                  className="createForumTitle createForumTextArea"
                  maxLength={800}
                  value={newModerators}
                  onChange={(e) => setNewModerators(e.target.value.split(","))}
                />
              </>
            </div>
          }
          okButton={
            <button
              type="submit"
              className="acceptCreateForumButton"
              onClick={() => {
                setShowNewForumModal(false);
              }}>
              Create
            </button>
          }
          cancelButton={
            <div
              className="cancelCreateForumButton"
              onClick={() => setShowNewForumModal(false)}>
              Cancel
            </div>
          }
        />
      )}
      <div className="homeContent">
        <div className="homeHeader">
          <div className="info">
            <div className="title">Hello! This is dispatch</div>
            <div className="subtitle">
              Volutpat lorem est quam turpis amet sed turpis convallis
              scelerisque scelerisque sit arcu amet nibh tellus tincidunt
              elementum senectus purus
            </div>
            <div className="createContainer">
              <button>Create your own</button>
            </div>
          </div>
          <div className="logo">
            <HomeLogo />
          </div>
        </div>
        <CardsContainer />
      </div>
      <PoweredByDispatch />
    </div>
  );
};
