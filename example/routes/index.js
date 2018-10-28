import React, { Component } from 'react';
import * as reactRouterDefer from '../../src';

const { Switch, Route, onHistoryPush, onRouteLoaded } = reactRouterDefer;

console.log('reactRouterDefer', reactRouterDefer);

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
      <Switch>
        <Route exact path="/" componentDefer={() => import('./Home')} />
        <Route componentDefer={() => import('./NotFound')} />
      </Switch>
    );
  }
}
