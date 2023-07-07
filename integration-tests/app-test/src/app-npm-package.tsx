import { useState } from 'preact/hooks'
import preactLogo from './assets/preact.svg'
import viteLogo from '/vite.svg'
import './app.css'
import { Metrics, trackConversion } from '@edgio/rum'
import Routes from './views/routes'

 const RUM_TOKEN = "cea882df-d1bb-4547-8dce-5d0fc9a89d2b"
 const metrics = new Metrics({
   token: RUM_TOKEN,
   pageLabel: "my-label-page",
   appVersion: 'v1.0.0',
   cacheHit: true,
   country: 'US'
})
metrics.collect()

export function App() {
  const [count, setCount] = useState(0)
  
  const handleClick = () => {
    setCount((count) => count + 1)
    trackConversion({
      token: RUM_TOKEN,
      event: 'my-event',
      payload: {
        email: "test@test.com"
      }
    })
  }

  return (
    <>
    <Routes/>
    <button>MY button</button>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} class="logo" alt="Vite logo" />
        </a>
        <a href="https://preactjs.com" target="_blank">
          <img src={preactLogo} class="logo preact" alt="Preact logo" />
        </a>
      </div>
      <h1>Vite + Preact</h1>
      <div class="card">
        <button id="counterButton" onClick={handleClick}>
          count is {count}
        </button>
        <p>
          Edit <code>src/app.tsx</code> and save to test HMR
        </p>
      </div>
      <p class="read-the-docs">
        Click on the Vite and Preact logos to learn more
      </p>
    </>
  )
}
