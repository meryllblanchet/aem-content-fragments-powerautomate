import 'core-js/stable'
import 'regenerator-runtime/runtime'
import './typekit'

import React from 'react'
import ReactDOM from 'react-dom'

import Runtime, { init } from '@adobe/exc-app'

import App from './App'

/* Here you can bootstrap your application and configure the integration with the Adobe Experience Cloud Shell */
try {
  // attempt to load the Experience Cloud Runtime
  require('./exc-runtime')
  // if there are no errors, bootstrap the app in the Experience Cloud Shell
  init(bootstrapInExcShell)
} catch (e) {
  console.log('application not running in Adobe Experience Cloud Shell')
  // fallback mode, run the application without the Experience Cloud Runtime
  bootstrapRaw()
}

function bootstrapRaw () {
  /* **here you can mock the exc runtime and ims objects** */
  const mockRuntime = { on: () => {} }
  const mockIms = {}
  
  // Render the actual react application and pass along the runtime object to make it available to the App
  ReactDOM.render(
    <React.StrictMode>
      <App runtime={ mockRuntime } ims={ mockIms } />
    </React.StrictMode>,
    document.getElementById('root')
  );
}

function bootstrapInExcShell () {
  // get the Experience Cloud Runtime object
  const runtime = Runtime()

  // set the app name to the Shell header
  runtime.customEnvLabel = 'AEMp13766e30006'

  // use this to set a favicon
  // runtime.favicon = 'url-to-favicon'

  // use this to respond to clicks on the app-bar title
  // runtime.heroClick = () => window.alert('Did I ever tell you you\'re my hero?')

  // ready event brings in authentication/user info
  runtime.on('ready', ({ imsOrg, imsToken, imsProfile, locale }) => {
    // tell the exc-runtime object we are done
    runtime.done()
    const ims = {
      profile: imsProfile,
      org: imsOrg,
      token: imsToken
    }
  
    // Render the actual react application and pass along the runtime and ims objects to make it available to the App
    ReactDOM.render(
      <React.StrictMode>
        <App runtime={ runtime } ims={ ims } />
      </React.StrictMode>
      ,
      document.getElementById('root')
    );
  })

  // set solution info, shortTitle is used when window is too small to display full title
  runtime.solution = {
    icon: 'AdobeExperienceCloud',
    title: 'AEMp13766e30006',
    shortTitle: 'AEM'
  }
  runtime.title = 'AEMp13766e30006'
}
