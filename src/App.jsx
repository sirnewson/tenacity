import { StudioProvider, useStudio } from './StudioContext'
import SplashScreen from './components/SplashScreen'
import AlertToast from './components/AlertToast'
import SelectStep from './components/SelectStep'
import CameraStep from './components/CameraStep'
import ResultStep from './components/ResultStep'
import SpecsModal from './components/SpecsModal'

function Studio() {
  return (
    <div className="mobile-fill flex flex-col bg-dark-950 text-white relative overflow-hidden">
      <SplashScreen />
      <div className="ambient-bg ambient-1" />
      <div className="ambient-bg ambient-2" />
      <AlertToast />

      {/* All steps stay mounted; visibility is toggled so imperative
          DOM (camera feed, draggable tag, reveal canvas) persists. */}
      <SelectStep />
      <CameraStep />
      <ResultStep />

      <SpecsModal />
    </div>
  )
}

export default function App() {
  return (
    <StudioProvider>
      <Studio />
    </StudioProvider>
  )
}
