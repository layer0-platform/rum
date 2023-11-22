import Link from 'next/link'

export default function Help() {
  return (
    <div>
      <h1>Help</h1>
      <p>
        <a href="/">Home (reload)</a>
      </p>
      <p>
        <Link href="/">Home</Link>
      </p>
    </div>
  )
}
