import { Redirect, Route, Switch } from 'react-router'
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react'
import { IonReactRouter } from '@ionic/react-router'
import { AuthProvider, useAuth } from './services/AuthContext'
import Login from './pages/Login'
import Tabs from './pages/Tabs'

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css'

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css'
import '@ionic/react/css/structure.css'
import '@ionic/react/css/typography.css'

/* Optional CSS utils */
import '@ionic/react/css/padding.css'
import '@ionic/react/css/float-elements.css'
import '@ionic/react/css/text-alignment.css'
import '@ionic/react/css/text-transformation.css'
import '@ionic/react/css/flex-utils.css'
import '@ionic/react/css/display.css'

import '@ionic/react/css/palettes/dark.system.css'

/* Theme variables */
import './theme/variables.css'

setupIonicReact()

function AppRoutes() {
  const { isAuthenticated, isInitializing } = useAuth()

  if (isInitializing) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          color: '#999',
        }}
      >
        Loading...
      </div>
    )
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <>
          <Route exact path="/login" component={Login} />
          <Redirect to="/login" />
        </>
      ) : (
        <>
          <Route path="/" component={Tabs} />
          <Redirect to="/tasks" />
        </>
      )}
    </Switch>
  )
}

const App: React.FC = () => (
  <IonApp>
    <AuthProvider>
      <IonReactRouter>
        <IonRouterOutlet>
          <AppRoutes />
        </IonRouterOutlet>
      </IonReactRouter>
    </AuthProvider>
  </IonApp>
)

export default App
