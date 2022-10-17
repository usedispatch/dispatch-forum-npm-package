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


## Getting started with the SDK...



Install the package. Code can be found here https://github.com/usedispatch/dispatch-forum

``` yarn add @usedispatch/forums ```

Add the Dispatch Provider to allow your entire application to have access to the Dispatch components. 

First, create a DispatchApp component. Keep in mind the URL strings in the props, these will be used later.

```
import { ReactNode } from "react";
import { DispatchProvider, DispatchAppProps } from "@usedispatch/forum";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';

interface Props {
    baseURL: string;
    forumURL: string;
    topicURL: string;
    children?: ReactNode | ReactNode[];
}

const DispatchApp = ({ 
    baseURL,
    forumURL,
    topicURL,
    children, 
    ...props
}: Props) => {
    const { connection } = useConnection();
    const wallet = useWallet();

    function buildForumPath(collectionId: string) {
        return `${baseURL}${forumURL}/${collectionId}`;
    }
    
    function buildTopicPath(collectionId: string, topicId: number) {
        return `${baseURL}${forumURL}/${collectionId}${topicURL}/${topicId}`;
    }

    const dispatchProps : DispatchAppProps = {
        wallet: wallet,
        connection: connection,
        buildForumPath: buildForumPath,
        buildTopicPath: buildTopicPath,
        children: children
    }

    return (
        <DispatchProvider {...dispatchProps}>
            {children}
        </DispatchProvider>
    )
}

export default DispatchApp;
```

Wrap your application in the Dispatch component at the top level with the `<DispatchApp>` we just created, and within your wallet/connection providers. Make sure it's wrapped around any URL routers your application may have and define which routes the forum page and topic page will be. We strongly recommend you use these defaults. Forum view will exist on `/forum/:collectionId` and Topic view on `/forum/:collectionId/topic/:topicId`. 

```
const baseURL = "YOUR_APPLICATION_URL"
const forumURL = "/forum";
const topicURL = "/topic";
require('@usedispatch/forum/dist/main.css')

```
Make sure to include the last line above with the CSS file to ensure component styling works. This CSS is customizable, look below for an example. 


The DispatchApp router will take the following format.
```
    <ConnectionProvider>
        <WalletProvider>
            <DispatchApp baseURL={baseURL} forumURL={forumURL} topicURL={topicURL}>
                // Insert your router and application components here
            </DispatchApp>
        </WalletProvider>
    </ConnectionProvider>
```



Next, navigate to the routes in your application. Create two routes as defined above. Import `<ForumView>` and `<TopicView>` from the `@usedispatch/forum` package here, these are the components that will be used to render the forum and topic views in your application. Use these two components as the render element for the routes. The ForumView component takes a collection ID which is a public key, below an example key is provided. The collection ID is how forums are organized on-chain. The TopicView component takes a collection ID and a topic ID, the topic ID is the unique identifier for a topic within a forum. The example below shows sample keys for the forum and topic, but the `DispatchForum.tsx` and `DispatchTopic.tsx` components within this repo are an example of how to use the components for any givene keys. 

```

``` 

```
    <Routes>
        <Route path={`${forumURL}/:id`} element={<ForumView collectionId="5n6jccZ96FqFTxREsosRUnQ7MsQCy1CwcWHwUgWArij6"/>} />
        <Route path={`${forumURL}/:id${topicURL}/:id`} element={<TopicView collectionId="5n6jccZ96FqFTxREsosRUnQ7MsQCy1CwcWHwUgWArij6" topicId={0}/>} />
    </Routes>
```


Here's a full example of an application...

```
import DispatchApp from './components/DispatchApp';
import { TopicView, ForumView } from "@usedispatch/forum";

const baseURL = "http://localhost:3000"
const forumURL = "/forum";
const topicURL = "/topic";

...
    ...
        ...

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <DispatchApp baseURL={baseURL} forumURL={forumURL} topicURL={topicURL}>
          <WalletModalProvider>
              <div className="App">
                <header className="App-header">
                </header>
                  <div className='container'>
                    <div>
                      <WalletMultiButton/>
                      <WalletConnectButton />
                      <WalletDisconnectButton/>
                    </div>
                      <Router>
                        <Routes>
                          <Route path={`${forumURL}/:id`} element={<ForumView collectionId="5n6jccZ96FqFTxREsosRUnQ7MsQCy1CwcWHwUgWArij6"/>} />
                          <Route path={`${forumURL}/:id${topicURL}/:id`} element={<TopicView collectionId="5n6jccZ96FqFTxREsosRUnQ7MsQCy1CwcWHwUgWArij6" topicId={0}/>} />
                        </Routes>
                      </Router>
                  </div>
              </div>
          </WalletModalProvider>
        </DispatchApp>
      </WalletProvider>
    </ConnectionProvider>
  );
  ```

  You should now have a fully functioning forum application!

  To further customize the components to fit into your application, take a look at the styles folder in our package. This can be found in `./node_modules/@usedispatch/forum/styles` which has a full list of classes and styles. These can be overriden in your application by redefining the classname in CSS and updating it with your own styles.

  This demo provides two examples of performing this overwrite. Either defining the classname directly or creating another stylesheet and importing it in `index.css`. Using specifiers will ensure the style you declared is used. 

  ```
  /* OPTION 1: import the file with the overridden classes */
@import "./components/forums/ForumContent.css";

/* OPTION 2: override the class directly in this file*/
.forumContentHeader {
  background: lavender;
}
```

`ForumContent.css`
```css
.App .createTopicButton {
  background: crimson;
  border: 3px black solid;
}
```

The `.App` specifier helps ensure the override is enforced.