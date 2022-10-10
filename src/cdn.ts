import Metrics from './Metrics'
import Router from './Router'

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
  const Edgio = ((window as any).Edgio = {
    Metrics,
    Router,
  })

  // for XDN backwards compatibility
  ;(window as any).XDN = Edgio

  // for Layer0 backwards compatibility
  ;(window as any).Layer0 = Edgio
}
