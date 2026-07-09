// Same-origin, same-directory guard for ?catalog=/?diff=/?cat= query params.
// UMD: works as browser <script src> (exposes window.resolveCatalogParam) and as Node require().
// No DOM (besides URL, which is global in both environments), no deps.
//
// This is deliberately an allowlist built on URL resolution, not a denylist
// built on string pattern-matching. A denylist has to predict every way a
// browser's URL parser might normalize a string (backslash-as-slash for
// special schemes, leading whitespace/tab stripping, percent-decoding, ...)
// and loses that game permanently. Instead: let the same WHATWG URL parser
// the browser uses do the normalization, then check the *resolved* origin
// and path — properties, not string shapes.
//
// Returns the resolved pathname+search (a same-origin, same-directory,
// .json path) to fetch, or null if the raw value is absent or resolves
// outside catalogs/. Callers must fall back to a known default catalog path
// when this returns null — never fetch the raw value.
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { resolveCatalogParam: factory() };
  } else {
    root.resolveCatalogParam = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {

  return function resolveCatalogParam(raw, opts) {
    if (!raw || typeof raw !== 'string') return null;
    opts = opts || {};
    var baseHref = opts.baseHref || (typeof document !== 'undefined' ? document.baseURI : null);
    var originHref = opts.originHref || (typeof location !== 'undefined' ? location.origin : null);
    if (!baseHref || !originHref) return null;

    var candidate = raw.indexOf('/') !== -1 ? raw : 'catalogs/' + raw;

    var url;
    try {
      url = new URL(candidate, baseHref);
    } catch (e) {
      return null;
    }

    // 1. same origin, after the parser's own normalization (backslashes,
    //    leading whitespace, percent-encoding, etc. are already resolved here)
    if (url.origin !== originHref) return null;

    // 2. confined to the catalogs/ directory of this app (blocks root-relative
    //    escapes like "/other-dir/x.json" and normalized ".." traversal)
    var root = new URL('catalogs/', baseHref);
    if (url.pathname.indexOf(root.pathname) !== 0) return null;

    // 3. shape check
    if (!/\.json$/i.test(url.pathname)) return null;

    return url.pathname + url.search;
  };

});
