import { APIForum } from '@usedispatch/client';
import { create } from '@dispatch-services/store';
export const useForumStore = create(() => ({
  name: 'forumStore',
  state: {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    APIForumObject: {} as APIForum,
  },
  // computed: {
  // },
  // getters: {
  //     },
  actions: {
    async getConnection() {
      return this.state.APIForumObject.connection;
    },
  },
}));
