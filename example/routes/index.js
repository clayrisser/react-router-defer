import React, { Component } from 'react';
import * as reactRouterDefer from '../../src';

const { Switch, Route } = reactRouterDefer;

console.log('reactRouterDefer', reactRouterDefer);

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
