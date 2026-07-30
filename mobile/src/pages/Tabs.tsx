import { IonIcon, IonLabel, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs } from '@ionic/react'
import { Redirect, Route, Switch } from 'react-router'
import { IonReactRouter } from '@ionic/react-router'
import { checkmarkCircle, notifications, person } from 'ionicons/icons'
import Tasks from './Tasks'
import TaskDetail from './TaskDetail'
import Notifications from './Notifications'
import Profile from './Profile'

function Tabs() {
  return (
    <IonTabs>
      <IonRouterOutlet>
        <Switch>
          <Route exact path="/tasks" component={Tasks} />
          <Route exact path="/tasks/:id" component={TaskDetail} />
          <Route exact path="/notifications" component={Notifications} />
          <Route exact path="/profile" component={Profile} />
          <Redirect exact from="/" to="/tasks" />
        </Switch>
      </IonRouterOutlet>

      <IonTabBar slot="bottom" style={{ borderTop: '1px solid #e5e5e5', padding: '4px 0' }}>
        <IonTabButton tab="tasks" href="/tasks">
          <IonIcon icon={checkmarkCircle} />
          <IonLabel>Tasks</IonLabel>
        </IonTabButton>
        <IonTabButton tab="notifications" href="/notifications">
          <IonIcon icon={notifications} />
          <IonLabel>Alerts</IonLabel>
        </IonTabButton>
        <IonTabButton tab="profile" href="/profile">
          <IonIcon icon={person} />
          <IonLabel>Profile</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  )
}

export default Tabs
