import Metrics from './Metrics'
import Router from './Router'

/*
 * Example:
 *
 * ```html
 *  <script defer>
 *    function initXdnRum() {
 *      new XDN.Metrics({
 *        token: 'abc-123',
 *        router: new XDN.Router()
 *          .match('/', ({ setPageLabel }) => setPageLabel('home'))
 *          .match('/p/:id', ({ setPageLabel }) => setPageLabel('product'))
 *          .match('/c/:id', ({ setPageLabel }) => setPageLabel('category'))
 *      }).collect()
 *    }
 *  </script>
 *  <script src="https://rum.moovweb.app/v1.0.0.js" defer onload="initXdnRum()"></script>
 * ```
 */

/* istanbul ignore else */
if (typeof window !== 'undefined') {
  ;(window as any).XDN = {
    Metrics,
    Router,
  }
}
