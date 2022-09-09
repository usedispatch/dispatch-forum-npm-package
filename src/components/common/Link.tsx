export function Link({ className, href, children }) {
  const pageNav = (event) => {
    if (event.metaKey || event.ctrlKey) {
      return;
    }
    if (event.metaKey || event.ctrlKey) {
      return;
    }
    event.preventDefault();
    window.history.pushState({}, "", href + window.location.search);

    const navEvent = new PopStateEvent("popstate");
    window.dispatchEvent(navEvent);

    const search = window.location.search;
    const params = new URLSearchParams(search).toString();
    const path = href + (params ? `?${params}` : "");
  };

  return (
    <a className={className} href={href + window.location.search} onClick={pageNav}>
      {children}
    </a>
  );
}
