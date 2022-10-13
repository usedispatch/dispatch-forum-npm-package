import React from "react";

const Image = ({ src, ...props }) => {
  // try {
  //   console.log('dsp', src.default)
  //   const str = src.default;
  //   return React.createElement(require.resolve("next/image").default, {
  //     src: typeof src === "string" ? src : src.src,
  //     ...props
  //   });
  // } catch {
  //   console.log('dsp', "Not using Next.js");
  //   return React.createElement("img", { src, ...props });
  // }
  const img = src.default;
  return React.createElement("img", { img , ...props });
};

export default Image;
