import '../styles/globals.css'
// Used to link to other pages
import Link from 'next/link'

function MyApp({ Component, pageProps }) {
  return (
    <div>
      {/* We will style with classNames from tailwind */}
      <nav className="border-b p-6">
        <p className="text-4xl font-bold">Metaverse Marketplace</p>
        {/* Div to hold our links */}
        <div className="flex mt-4">
          {/* Root link to go home */}
          <Link href="/">
            <a className="mr-6 text-purple-500">
              Home
            </a>
          </Link>
          {/* Link to create a new item */}
          <Link href="/create-item"> 
            <a className="mr-6 text-purple-500">
              Sell Digital Asset 
            </a>
          </Link>
          {/* Link to view our own assets */}
          <Link href="/my-assets">
            <a className="mr-6 text-purple-500">
              My Digital Assets 
            </a>
          </Link>
          {/* Creator Dashboard (Shows items you have created & sold) */}
          <Link href="/creator-dashboard">
            <a className="mr-6 text-purple-500">
              Creator Dashboard 
            </a>
          </Link>
        </div>
      </nav>
     <Component {...pageProps} />
    </div>
  )
}

export default MyApp
