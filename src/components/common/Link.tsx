export function Link({ className, href, children }) {
  const pageNav = (event) => {
    if (event.metaKey || event.ctrlKey) {
      return;
    }
    if (event.metaKey || event.ctrlKey) {
      return;
    }
    event.preventDefault();
    window.history.pushState({}, "", href);

    const navEvent = new PopStateEvent("popstate");
    window.dispatchEvent(navEvent);
  };

  return (
    <a className={className} href={href} onClick={pageNav}>
      {children}
    </a>
  );
}
