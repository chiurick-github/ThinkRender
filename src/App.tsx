import TitleBar from './components/TitleBar/TitleBar'
import Toolbar from './components/Toolbar/Toolbar'
import CanvasEditor from './components/Canvas/CanvasEditor'
import PropertyPanel from './components/PropertyPanel/PropertyPanel'
import LayersPanel from './components/LayersPanel/LayersPanel'
import AssetPanel from './components/Toolbar/AssetPanel'
import PageTabs from './components/PageTabs/PageTabs'
import StatusBar from './components/StatusBar/StatusBar'
import { useEditorStore } from './stores/editor-store'

export default function App() {
  const { showPropertyPanel } = useEditorStore()

  return (
    <div className="app-layout">
      <TitleBar />
      <div className="app-body">
        <Toolbar />
        <AssetPanel />
        <LayersPanel />
        <div className="app-center">
          <PageTabs />
          <CanvasEditor />
        </div>
        {showPropertyPanel && <PropertyPanel />}
      </div>
      <StatusBar />
    </div>
  )
}
