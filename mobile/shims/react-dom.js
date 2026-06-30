/**
 * shims/react-dom.js
 *
 * Shim thay thế "react-dom" trong môi trường React Native.
 *
 * @react-aria/utils import một số API từ react-dom (flushSync, findDOMNode, ...),
 * nhưng chúng không được dùng trên native. Shim này export no-op functions
 * để tránh lỗi "Unable to resolve react-dom" khi Metro bundle.
 */

'use strict';

const noop = () => {};
const noopReturn = (val) => val;

module.exports = {
  // ReactDOM core — không dùng trên native
  render:           noop,
  unmountComponentAtNode: noop,
  findDOMNode:      () => null,
  createPortal:     (children) => children,
  flushSync:        (fn) => fn?.(),
  unstable_batchedUpdates: (fn) => fn?.(),

  // React DOM client (React 18+)
  createRoot:       () => ({ render: noop, unmount: noop }),
  hydrateRoot:      () => ({ render: noop, unmount: noop }),

  // react-dom/server (không dùng)
  renderToString:   () => '',
  renderToStaticMarkup: () => '',

  // Default export
  default: {
    render:    noop,
    findDOMNode: () => null,
    createPortal: (children) => children,
    flushSync: (fn) => fn?.(),
  },
};
