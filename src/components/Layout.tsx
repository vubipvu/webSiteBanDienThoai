import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { useAppearance } from '../context/AppearanceContext'

export function Layout() {
  const { appearance } = useAppearance()

  return (
    <>
      <div className="announce" role="status">
        {appearance.announcement}
      </div>
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  )
}
