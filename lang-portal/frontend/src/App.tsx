import { BrowserRouter as Router } from 'react-router-dom'
import Layout from './components/common/Layout'
import AppRoutes from './AppRoutes'

function App() {
  return (
    <Router>
      <Layout>
        <AppRoutes />
      </Layout>
    </Router>
  )
}

export default App
