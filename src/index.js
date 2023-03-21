import React from 'react';

import { createRoot } from 'react-dom/client';

import App from './jsx/App.jsx';

const appName = '2019_digimankeli';
const getContainer = () => document.getElementById(`app-root-${appName}`);

const startApp = () => {
  if (!getContainer()) {
    console.log('no root found');
    return;
  }

  const root = createRoot(getContainer());
  root.render(<App />);
};

const eventHandlers = {
  onMount: (name, element, services = {}) => {
    if (name !== appName) {
      return;
    }
    const parameters = services.getParameters() || {};/*  */
    startApp(parameters);
  }
};

const plusAppMethods = {
  embedYlePlayer(elem, id, options) {
    window.ylePlayer.render({
      element: elem,
      props: {
        id,
        playFullScreen: !!options.playFullScreen,
      },
    });
  },
  login() {
    // eslint-disable-next-line
    window.console && console.log('login not supported');
  },
  getParameters() {
    return {};
  },
};

if (process.env.NODE_ENV === 'production' && window.yleVisualisation) {
  window.yleVisualisationEmbeds = window.yleVisualisationEmbeds || {};
  window.yleVisualisationEmbeds[appName] = eventHandlers;
} else if (process.env.NODE_ENV === 'production' && !window.yleVisualisation) {
  // ARTICLE RENDERER OR STATIC HOSTING
  eventHandlers.onMount(appName, document.body, plusAppMethods);
  window.plusApp = window.plusApp || {};
} else if (process.env.NODE_ENV === 'development') {
  const parameters = {};
  const searchParameters = new URLSearchParams(window.location.search);
  // eslint-disable-next-line
  for (const [key, value] of searchParameters) {
    parameters[key] = value;
  }
  startApp(parameters);
} else {
  console.log('no env');
}
