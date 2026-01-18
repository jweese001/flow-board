import { ReactFlowProvider } from '@xyflow/react';
import { LeftPanel } from '@/components/panels/LeftPanel';
import { Canvas } from '@/components/canvas/Canvas';
import { useAutoSave } from '@/hooks/useAutoSave';

function AppContent() {
  useAutoSave();

  return (
    <div
      className="h-screen w-screen flex overflow-hidden"
      style={{ background: 'var(--color-bg-base)' }}
    >
      {/* Left Panel - Combined Node Library & Properties */}
      <LeftPanel />

      {/* Canvas - Full remaining width */}
      <Canvas />
    </div>
  );
}

function App() {
  return (
    <ReactFlowProvider>
      <AppContent />
    </ReactFlowProvider>
  );
}

export default App;
