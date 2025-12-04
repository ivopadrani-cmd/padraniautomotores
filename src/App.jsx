import './App.css'
import Pages from "@/pages/index.jsx"
import { Toaster } from "@/components/ui/toaster"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"

function App() {
  return (
    <>
      <ProtectedRoute>
        <Pages />
      </ProtectedRoute>
      <Toaster />
    </>
  )
}

export default App 