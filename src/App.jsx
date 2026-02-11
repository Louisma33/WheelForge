import ErrorBoundary from './components/ErrorBoundary'
import WheelForgeApp from './WheelForgeApp'

function App() {
  return (
    <ErrorBoundary>
      <WheelForgeApp />
    </ErrorBoundary>
  )
}

export default App
