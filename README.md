# Dispatch Protocol Forums React SDK
## `DispatchProvider`
DispatchProvider is the main component that is used to provide access to the Dispatch components. Your application should be wrapped in a DispatchProvider, but has access to the wallet and connection. DispatchProps should be passed in with desired path URLs, wallet, and connection. Please use the following paths for forum and topic.
```
export interface DispatchAppProps {
    wallet: WalletInterface;
    connection: web3.Connection;
    children: ReactNode | ReactNode[];
    baseURL: string;
    forumURL: string; // "/forum"
    topicURL: string; // "/topic"
}
```
```
    <DispatchProvider {...dispatchProps}>
        {children}
    </DispatchProvider>
```

## `ForumView`

This component is used to display the forum, it uses the URL path to determine which forum to display in the format of `/forum/:collectionId`. Attach it to this route in your application.

## `TopicView`

This main component is used to display the forum, it uses the URL path to determine which forum to display in the format of `/forum/:collectionId/topic/:topicId`. Attach it to this route in your application.