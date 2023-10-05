import Metrics from './Metrics'
import Router from './Router'
import trackConversion from './trackConversion';

/*
 * Example:
 *
 * ```html
 *  <script defer>
 *    function initEdgioRum() {
 *      new Edgio.Metrics({
 *        token: 'abc-123',
 *        router: new Edgio.Router()
 *          .match('/', ({ setPageLabel }) => setPageLabel('home'))
 *          .match('/p/:id', ({ setPageLabel }) => setPageLabel('product'))
 *          .match('/c/:id', ({ setPageLabel }) => setPageLabel('category'))
 *      }).collect()
 *    }
 *  </script>
 *  <script src="https://rum.layer0.co/v1.0.0.js" defer onload="initEdgioRum()"></script>
 * ```
 */

/* istanbul ignore else */
if (typeof window !== 'undefined') {
  const rumExports = {
    Metrics,
    Router,
    trackConversion,
  }

  // for Edgio
  ;(window as any).Edgio = {
    // Add existing properties from @edgio/prefetch for example.
    // See xdn/packages/prefetch/src/cdn/install.ts
    ...((window as any)?.Edgio ?? {}),
    ...rumExports,
  }

  // for XDN backwards compatibility
  ;(window as any).XDN = rumExports

  // for Layer0 backwards compatibility
  ;(window as any).Layer0 = rumExports
}
