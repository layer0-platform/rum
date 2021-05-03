/* eslint-disable */
import Head from 'next/head'
import { useCallback, useState } from 'react'
import styles from '../styles/Home.module.css'

export default function Home() {
  const [elements, setElements] = useState([])

  const createLayoutShift = useCallback(() => {
    setTimeout(() => {
      setElements(elements => [...elements, <div key={elements.length}>shift</div>])
    }, 501)
  }, [])

  return (
    <div className={styles.container}>
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to <a href="https://nextjs.org">Next.js!</a>
        </h1>
        <button onClick={createLayoutShift}>Create Layout Shift</button>
        {elements}
      </main>
    </div>
  )
}
