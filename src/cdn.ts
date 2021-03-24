import Metrics from './Metrics'
import Router from './Router'

/*
 * Example:
 *
 * ```html
 *  <script defer>
 *    function initLayer0Rum() {
 *      new Layer0.Metrics({
 *        token: 'abc-123',
 *        router: new Layer0.Router()
 *          .match('/', ({ setPageLabel }) => setPageLabel('home'))
 *          .match('/p/:id', ({ setPageLabel }) => setPageLabel('product'))
 *          .match('/c/:id', ({ setPageLabel }) => setPageLabel('category'))
 *      }).collect()
 *    }
 *  </script>
 *  <script src="https://rum.layer0.co/v1.0.0.js" defer onload="initLayer0Rum()"></script>
 * ```
 */

/* istanbul ignore else */
if (typeof window !== 'undefined') {
  const Layer0 = ((window as any).Layer0 = {
    Metrics,
    Router,
  })

  // for backwards compatibility
  ;(window as any).XDN = Layer0
}
