/* eslint-disable */
import '../styles/globals.css'
import { Metrics } from '@edgio/rum'
import { useEffect } from 'react'

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    new Metrics({
      token: '1f46b1a9-bd73-40c2-83fe-c545fd992b59',
    }).collect()
  }, [])

  return <Component {...pageProps} />
}

export default MyApp
