import React from "react";

const Image = ({ src, ...props }) => {
  try {
    return React.createElement(require.resolve("next/image").default, {
      src: typeof src === "string" ? src : src.src,
      ...props
    });
  } catch {
    console.log("Not using Next.js");
    return React.createElement("img", { src, ...props });
  }
};

export default Image;
