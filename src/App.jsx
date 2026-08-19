import { StudioProvider } from './StudioContext'
import { brand } from './brand'
import SplashScreen from './components/SplashScreen'
import AlertToast from './components/AlertToast'
import HomeStep from './components/HomeStep'
import AppHub from './components/AppHub'
import AppFrame from './components/AppFrame'
import SelectStep from './components/SelectStep'
import CameraStep from './components/CameraStep'
import ResultStep from './components/ResultStep'
import BatchStep from './components/BatchStep'
import GenerateSoonStep from './components/GenerateSoonStep'
import SettingsStep from './components/SettingsStep'
import TaskBoardStep from './components/TaskBoardStep'
import VideoStudioStep from './components/VideoStudioStep'
import ClientRoomStep from './components/ClientRoomStep'
import MemoryStep from './components/MemoryStep'
import NotesStep from './components/NotesStep'
import SpecsModal from './components/SpecsModal'
import OverlayUploadModal from './components/OverlayUploadModal'
import QrModal from './components/QrModal'

function Studio() {
  return (
    <div className="mobile-fill flex flex-col app-bg text-ink relative overflow-hidden">
      <SplashScreen />
      <div className="ambient-bg ambient-1" />
      <div className="ambient-bg ambient-2" />
      <AlertToast />

      {/* All steps stay mounted; visibility is toggled so imperative
          DOM (camera feed, draggable tag, reveal canvas) persists. */}
      {brand.suite?.enabled && <AppHub />}
      {brand.demoMode && !brand.suite?.enabled && <HomeStep />}
      <SelectStep />
      <CameraStep />
      <ResultStep />
      <BatchStep />
      <NotesStep />
      <MemoryStep />
      <GenerateSoonStep />
      <SettingsStep />
      <ClientRoomStep />
      <TaskBoardStep />
      <VideoStudioStep />

      <SpecsModal />
      <OverlayUploadModal />
      <QrModal />
      <AppFrame />
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
