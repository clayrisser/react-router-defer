import React, { Component } from 'react';
import { Switch, Route, onHistoryPush, onRouteLoaded } from '../../src';

onHistoryPush(async router => {
  console.log('waiting 3 seconds');
  await new Promise(r => setTimeout(r, 3000));
  console.log('router', router);
});

onRouteLoaded(router => {
  console.log('route loaded', router);
});

export default class Routes extends Component {
  render() {
    return (
      <Switch loading="loading">
        <Route exact path="/" component={() => import('./Home')} />
        <Route
          component={() => import('./NotFound')}
          loading="not found loading"
        />
      </Switch>
    );
  }
}
