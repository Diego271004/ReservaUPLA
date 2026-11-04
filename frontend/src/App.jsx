import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import InicioPage from './pages/InicioPage'
import PendientePage from './pages/PendientePage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<InicioPage />} />
        <Route path="*" element={<PendientePage />} />
      </Route>
    </Routes>
  )
}
