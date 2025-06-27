import { CanvasEditor } from './components/CanvasEditor';

function App() {
  return (
    <div className="w-screen h-screen overflow-hidden bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="h-16 flex items-center justify-center bg-white shadow">
        <h1 className="text-xl font-bold">Purikura EVO</h1>
      </header>

      {/* Canvas */}
      <main className="flex-1">
        <CanvasEditor />
      </main>
    </div>
  );
}

export default App;