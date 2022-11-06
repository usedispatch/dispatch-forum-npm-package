import isNil from 'lodash/isNil';
import isNull from 'lodash/isNull';
import { PublicKey } from '@solana/web3.js';
import { useEffect, useMemo } from 'react';
import { ForumPost } from '@usedispatch/client';
import { Helmet } from 'react-helmet';

import {
  useForumData,
  useModal,
  useParticipatingModerators,
  isForumPost,
  isEditedPost,
  EditedPost,
} from '../../../utils/hooks';

import { MessageType, Spinner } from '../../../components/common';
import {
  ConnectionAlert,
  PoweredByDispatch,
} from '../../../components/forums';
import { Loading } from '../../../types/loading';
import { DispatchError } from '../../../types/error';
import {
  notFoundError,
  isError,
  isUncategorizedError,
  errorSummary,
} from '../../../utils/error';
import {
  isSuccess,
  isInitial,
  isPending,
  pending,
} from '../../../utils/loading';
import {
  useForum,
  useRole,
  useTheme,
} from './../../../contexts/DispatchProvider';
import { getUserRole } from './../../../utils/postbox/userRole';
import { getCustomStyles } from '../../../utils/getCustomStyles';
import { NewsPagePosts } from './NewsPagePosts';

export interface NewsPost {
  post_id: string;
  content: string;
  created_at: string;
  source_type: string;
  author_id: string;
  author_username: string;
  author_avatar: string;
  src_msg_id: string;
  src_guild_id: string;
  src_channel_id: string;
  on_chain: boolean;
  score: number;
}

export interface NewsFeed {
  posts: NewsPost[];
}

interface NewsPageContentProps {
  NewsfeedPosts: NewsFeed;
}

export function NewsPageContent(props: NewsPageContentProps): JSX.Element {
  const { NewsfeedPosts } = props;
  const { modal, setModals } = useModal();
  const role = useRole();
  const forum = useForum();
  const { permission } = forum;
  const theme = useTheme();

  // TODO: move to consts
  const forumId = '6ThcrupJDDxxKKsDdGy1xjEkZdrZGsjt33B6iyK8VhP9';
  const topicId = 20;
  const collectionPublicKey = new PublicKey(forumId);

  const { forumData, update, addPost, editPost, deletePost } = useForumData(
    collectionPublicKey,
    forum,
  );

  const participatingModerators = useParticipatingModerators(forumData, forum);
  const topic: Loading<ForumPost | EditedPost> = useMemo(() => {
    if (isSuccess(forumData)) {
      const post = forumData.posts.find(post => {
        // This conditional only evaluates to true if `post` is a
        // ForumPost and not a LocalPost-- that is, if it exists
        // on-chain
        if ('postId' in post) {
          return (
            (isForumPost(post) || isEditedPost(post)) &&
            post.isTopic &&
            post.postId === topicId
          );
        } else {
          return false;
        }
        // The above function only returns true if the post in
        // question is a ForumPost or an EditedPost. But the
        // TypeScript checker can't recognize that, so we cast
        // here
      }) as ForumPost | EditedPost;
      if (post !== null && post !== undefined) {
        return post;
      } else {
        return notFoundError('Post not found');
      }
    } else {
      if (isPending(forumData)) {
        return pending();
      } else {
        return forumData;
      }
    }
  }, [forumData, topicId]);

  useEffect(() => {
    // When forumData is updated, find all errors associated with
    // it and show them in the modal
    if (isSuccess(forumData)) {
      // Filter out all loading components that failed
      const errors = [forumData.owners].filter(loading =>
        isError(loading),
      ) as DispatchError[];

      setModals(
        errors.map(error => {
          if (isUncategorizedError(error)) {
            return {
              type: MessageType.error,
              title: 'Error loading',
              collapsible: {
                header: 'Error',
                content: JSON.stringify(error.error),
              },
            };
          }
          // TODO better error display here
          return {
            type: MessageType.error,
            title: `Error loading ${error.errorKind}`,
            collapsible: { header: 'Error', content: errorSummary(error) },
          };
        }),
      );
    }
  }, [forumData]);

  const updateVotes = (upVoted: boolean): void => {
    if (isSuccess(topic)) {
      if (upVoted) {
        topic.upVotes += 1;
      } else {
        topic.downVotes += 1;
      }
    } else {
      // If necessary, handle behavior if topic isn't loaded here
    }
  };

  useEffect(() => {
    void update();
    // Update every time the cluster is changed
  }, [forum.cluster]);

  useEffect(() => {
    console.log(collectionPublicKey, topic, forum.wallet.publicKey);
    if (
      !isNil(collectionPublicKey) &&
      !isNil(topic) &&
      forum.wallet.publicKey != null &&
      isSuccess(topic)
    ) {
      void getUserRole(forum, collectionPublicKey, role, topic);
    }
  }, [topic]);

  const invalidPublicKeyView = (
    <div className="disconnectedTopicView">
      {`${forumId} is not a valid Collection ID`}
    </div>
  );

  const disconnectedView = (
    <div className="disconnectedTopicView">
      {`The topic with id ${topicId} does not exist`}
    </div>
  );

  const customStyle = getCustomStyles(forumId);

  return (
    <div className="dsp- ">

    <div className={theme.mode}>
    <div className={customStyle}>
      <Helmet>
        <meta charSet="utf-8" />
        {isSuccess(topic) && <title>{topic.data.subj} -- Topic </title>}
      </Helmet>
      <div className="topicView">
        {modal}
        <div className="topicViewContainer">
          <div className="topicViewContent">
            {!permission.readAndWrite && <ConnectionAlert />}
            <main>
              <div>
                {(() => {
                  if (
                    (collectionPublicKey != null && isInitial(topic)) ||
                    isPending(topic)
                  ) {
                    return (
                      <div className="topicViewLoading">
                        <Spinner />
                      </div>
                    );
                  } else if (
                    collectionPublicKey != null &&
                    isSuccess(forumData) &&
                    isSuccess(topic)
                  ) {
                    return (
                      <>
                        <NewsPagePosts
                          forumData={forumData}
                          participatingModerators={participatingModerators}
                          forum={forum}
                          topic={topic}
                          userRoles={role.roles}
                          update={update}
                          addPost={addPost}
                          editPost={editPost}
                          deletePost={deletePost}
                          updateVotes={upVoted => updateVotes(upVoted)}
                          newsposts={NewsfeedPosts}
                        />
                      </>
                    );
                  } else if (isNull(collectionPublicKey)) {
                    return invalidPublicKeyView;
                  } else {
                    // TODO(andrew) more sophisticated error
                    // handling here
                    return disconnectedView;
                  }
                })()}
              </div>
            </main>
          </div>
        <PoweredByDispatch customStyle={customStyle} />
        </div>
      </div>
    </div>
    </div>
    </div>
  );
}
