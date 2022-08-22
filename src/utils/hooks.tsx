import { useMemo, useState, ReactNode } from "react";
import { PublicKey, clusterApiUrl } from "@solana/web3.js";
import { ForumInfo, ForumPost, PostRestriction } from "@usedispatch/client";
import { WebBundlr } from '@bundlr-network/client';
import { Loading, LoadingResult } from "../types/loading";
import {
  CollapsibleProps,
  MessageType,
  PopUpModal,
} from "../components/common";
import {
  isResolved,
  isNotFound,
  initial,
  pending,
  onChainAccountNotFound,
  dispatchClientError,
  isSuccess,
  isDispatchClientError,
} from "../utils/loading";
import { DispatchForum } from "./postbox/postboxWrapper";
import { useForum } from '../contexts/DispatchProvider';

// TODO(andrew) move this to DispatchForum.getDescription()
// so that function can be properly typed
export interface Description {
  title: string;
  desc: string;
}

export interface ForumData {
  collectionId: PublicKey;
  owners: LoadingResult<PublicKey[]>;
  moderators: LoadingResult<PublicKey[]>;
  description: Description;
  posts: ForumPost[];
  restriction: LoadingResult<PostRestriction>;
  images: any;
}

// This hook returns all the necessary forum data and a function
// to refresh it
export function useForumData(
  collectionId: PublicKey | null,
  forum: DispatchForum
): {
  forumData: Loading<ForumData>;
  update: () => Promise<void>;
} {
  const [forumData, setForumData] = useState<Loading<ForumData>>(initial());

  // TODO(andrew) make this more generic
  async function fetchOwners(): Promise<LoadingResult<PublicKey[]>> {
    if (collectionId) {
      try {
        const fetchData = await forum.getOwners(collectionId, true);
        if (fetchData) {
          return fetchData;
        } else {
          return onChainAccountNotFound();
        }
      } catch (error) {
        return dispatchClientError(error);
      }
    } else {
      return onChainAccountNotFound();
    }
  }
  async function fetchModerators(): Promise<LoadingResult<PublicKey[]>> {
    if (collectionId) {
      try {
        const fetchData = await forum.getModerators(collectionId, true);
        if (fetchData) {
          return fetchData;
        } else {
          return onChainAccountNotFound();
        }
      } catch (error) {
        return dispatchClientError(error);
      }
    } else {
      return onChainAccountNotFound();
    }
  }
  async function fetchDescription(): Promise<LoadingResult<Description>> {
    if (collectionId) {
      try {
        const fetchData = await forum.getDescription(collectionId, true);
        if (fetchData) {
          return fetchData;
        } else {
          return onChainAccountNotFound();
        }
      } catch (error) {
        return dispatchClientError(error);
      }
    } else {
      return onChainAccountNotFound();
    }
  }
  async function fetchPosts(): Promise<LoadingResult<ForumPost[]>> {
    if (collectionId) {
      try {
        const fetchData = await forum.getPostsForForum(collectionId, true);
        if (fetchData) {
          return fetchData;
        } else {
          return onChainAccountNotFound();
        }
      } catch (error) {
        return dispatchClientError(error);
      }
    } else {
      return onChainAccountNotFound();
    }
  }

  async function fetchForumPostRestriction(): Promise<
    LoadingResult<PostRestriction>
  > {
    if (collectionId) {
      try {
        const restriction = await forum.getForumPostRestriction(collectionId);
        if (restriction) {
          return restriction;
        } else {
          return onChainAccountNotFound();
        }
      } catch (error) {
        return dispatchClientError(error);
      }
    } else {
      return onChainAccountNotFound();
    }
  }

  async function fetchForumImage(): Promise<any> {
    if (collectionId) {
      try {
        const imgs = await forum.getImageUrls(collectionId);
        console.log("image", imgs);
        if (imgs) {
          return imgs;
        } else {
          return onChainAccountNotFound();
        }
      } catch (error: any) {
        console.log(error);
      }
    }
  }

  async function update() {
    if (collectionId) {
      // Wait for the forum to exist first...
      if (await forum.exists(collectionId)) {
        // Now fetch all related data
        const [owners, moderators, description, posts, restriction, images] =
          await Promise.all([
            fetchOwners(),
            fetchModerators(),
            fetchDescription(),
            fetchPosts(),
            fetchForumPostRestriction(),
            fetchForumImage(),
          ]);

        if (isSuccess(description) && isSuccess(posts)) {
          // If owners and moderators were successfully fetched, then
          // just set them and go
          setForumData({
            collectionId,
            owners,
            moderators,
            description,
            posts,
            restriction,
            images,
          });
        } else {
          // We already confirmed the forum existed, so assume
          // there was a failure in loading
          setForumData(dispatchClientError());
        }
      } else {
        setForumData(onChainAccountNotFound());
      }
    } else {
      // TODO(andrew) make collectionId nonnull
      setForumData(onChainAccountNotFound());
    }
  }
  return { forumData, update };
}

export interface ModalInfo {
  title: string | ReactNode;
  type: MessageType;
  body?: string | ReactNode;
  collapsible?: CollapsibleProps;
}

export function useModal() {
  const [modalInfoList, setModalInfoList] = useState<ModalInfo[]>([]);

  // Enqueue one or more modals to show. Modals are shown in FIFO
  // order
  function showModals(modalsToAdd: ModalInfo[]) {
    setModalInfoList(modalInfoList.concat(modalsToAdd));
  }

  function showModal(modalToAdd: ModalInfo) {
    showModals([modalToAdd]);
  }

  // Close the current modal
  function close() {
    // Pop the first element of the array
    setModalInfoList(modalInfoList.slice(1));
  }

  const modal = useMemo(() => {
    if (modalInfoList.length > 0) {
      const modalInfo = modalInfoList[0];
      return (
        <PopUpModal
          id="create-forum-info"
          visible
          title={modalInfo.title}
          messageType={modalInfo.type}
          body={modalInfo.body}
          collapsible={modalInfo.collapsible}
          okButton={
            <a className="okInfoButton" onClick={close}>
              OK
            </a>
          }
        />
      );
    } else {
      return null;
    }
  }, [modalInfoList]);

  return {
    // The component which can be rendered in react
    modal,
    // a function to close the current modal
    close,
    // functions to show a current modal or modals
    showModal,
    showModals,
    setModals: setModalInfoList,
  };
}

export function useBundlr(): WebBundlr | null {
  const forum = useForum();

  return useMemo(() => {

    // Assume that if we're using devnet, it will be the standard
    // public Solana devnet endpoint. If so, use the bundlr
    // devnet endpoint, if so use the bundlr mainnet
    const bundlrEndpoint =
      forum.connection.rpcEndpoint === clusterApiUrl('devnet') ?
      'https://devnet.bundlr.network' :
      'http://node1.bundlr.network';

    if (forum.wallet.wallet) {
      const bundlr = new WebBundlr(
        bundlrEndpoint,
        'solana',
        forum.wallet.wallet.adapter,
        { providerUrl: forum.connection.rpcEndpoint }
      );

      return bundlr;
    } else {
      return null;
    }
  }, [forum.connection.rpcEndpoint, forum.wallet.wallet?.adapter]);
}
