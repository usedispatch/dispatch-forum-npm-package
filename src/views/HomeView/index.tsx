import "./../../style.css";
import * as _ from "lodash";
import { useState } from "react";

import { HomeLogo } from "../../assets";
import { PopUpModal } from "../../components/common";
import { CardsContainer, PoweredByDispatch } from "../../components/forums";
import { usePath } from "../../contexts/DispatchProvider";

interface HomeViewProps {}

export const HomeView = (props: HomeViewProps) => {
  const { forumURL } = usePath();

  const [collectionId, setCollectionId] = useState("");
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="homeViewContainer">
      {showModal && (
        <PopUpModal
          id="create-your-own"
          visible
          title={"Please introduce your collection id"}
          body={
            <input
              type="text"
              placeholder="Collection id"
              className="createYourOwnModal"
              value={collectionId}
              onChange={(e) => setCollectionId(e.target.value)}
            />
          }
          onClose={() => setShowModal(false)}
          okButton={
            <button
              type="button"
              className="goToForumButton"
              disabled={collectionId.length === 0}
              onClick={() => {
                window.open(`${forumURL}/${collectionId}`, "_self");
                setShowModal(false);
              }}>
              Go
            </button>
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
              <button onClick={() => setShowModal(true)}>
                Create your own
              </button>
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
