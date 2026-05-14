import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Capture from './pages/Capture.jsx'
import Analysis from './pages/Analysis.jsx'
import History from './pages/History.jsx'
import Guide from './pages/Guide.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/capture" element={<Capture />} />
      <Route path="/analysis" element={<Analysis />} />
      <Route path="/analysis/:id" element={<Analysis />} />
      <Route path="/history" element={<History />} />
      <Route path="/guide" element={<Guide />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
