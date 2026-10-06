import { Route, Routes } from 'react-router-dom'
import { SearchProvider } from './components/search'
import DocPage from './pages/DocPage'
import DocsIndex from './pages/DocsIndex'
import Explore from './pages/Explore'
import Home from './pages/Home'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <SearchProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/docs" element={<DocsIndex />} />
        <Route path="/docs/*" element={<DocPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </SearchProvider>
  )
}
