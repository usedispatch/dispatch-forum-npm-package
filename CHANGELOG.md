# Changelog

## [Unreleased]

# [0.5.10] 2022-10-10

- forum: Interface Update ([#174](https://github.com/usedispatch/dispatch-forum-npm-package/pull/174))

To migrate to the new Solanart interface, you need to update your `dispatch-forum` dependency to `0.5.10` and update your `dispatch-forum` import to the new interface:

```js
import { ForumView } from '@usedispatch/forum';

...
<ForumView collectionId={collectionId as string} />
```

to 

```js
import { ForumView, SolanartID } from "@usedispatch/forum";
...
<ForumView collectionId={{solanartID: solanartID} as SolanartID} />
```

# [0.2.4] 2022-08-08

- forum: Performance improvements & Bug Fixes ([#66](https://github.com/usedispatch/dispatch-forum-npm-package/pull/66))([#71](https://github.com/usedispatch/dispatch-forum-npm-package/pull/71))
- forum: Add multiple Collections ([#70](https://github.com/usedispatch/dispatch-forum-npm-package/pull/70))
- forum: Update Create Forum Function as a single transaction ([#69](https://github.com/usedispatch/dispatch-forum-npm-package/pull/69))

# [0.2.3] 2022-08-05.1

- forum: Topic UI Changes ([#59](https://github.com/usedispatch/dispatch-forum-npm-package/pull/59))

# [0.2.2] 2022-08-05.0

- forum: Page Loading Improvements ([#58](https://github.com/usedispatch/dispatch-forum-npm-package/pull/58))
- forum: Add Page metadata tags ([#57](https://github.com/usedispatch/dispatch-forum-npm-package/pull/57))

# [0.2.1] 2022-08-04

- forum: Performance improvements ([#49](https://github.com/usedispatch/dispatch-forum-npm-package/pull/49))
- forum: Package downsizing ([#53](https://github.com/usedispatch/dispatch-forum-npm-package/pull/49))
- forum: NFT Gifting UI Update ([#54](https://github.com/usedispatch/dispatch-forum-npm-package/pull/54))

# [0.2.0] 2022-08-02

- forum: Add NFT and SOL gifting functionality ([#47](https://github.com/usedispatch/dispatch-forum-npm-package/pull/47)) ([#44](https://github.com/usedispatch/dispatch-forum-npm-package/pull/44))

# [0.1.4] 2022-07-29

- client: Update token check for gating

# [0.1.3] 2022-07-29

- forum: Performance enhancements on page navigation

## [0.1.2] 2022-07-27

- forum: Add Owners to a Forum ([#39](https://github.com/usedispatch/dispatch-forum-npm-package/pull/39))
- forum: Add token gating features ([#36](https://github.com/usedispatch/dispatch-forum-npm-package/pull/36))
  - Gate participation at the forum or topic levels
  - Gate voting
