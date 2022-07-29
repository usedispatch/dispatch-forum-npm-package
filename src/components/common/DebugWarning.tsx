export const DebugWarning = () => {
  if (process.env.REACT_APP_DEBUG_MODE === "true") {
    return <div>DEBUG MODE</div>;
  } else {
    return <></>;
  }
};
