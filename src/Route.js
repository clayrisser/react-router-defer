import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Route as ReactRouterRoute } from 'react-router';

const routeLoadedHandlers = [];

function onRouteLoaded(handleRouteLoaded) {
  const index = routeLoadedHandlers.length;
  routeLoadedHandlers.push(handleRouteLoaded);
  return {
    remove: () => delete routeLoadedHandlers[index]
  };
}

export default class Route extends Component {
  static propTypes = {
    componentDefer: PropTypes.func,
    renderDefer: PropTypes.func
  };

  static defaultProps = {
    componentDefer: null,
    renderDefer: null
  };

  componentDefer = null;

  renderDefer = null;

  state = {
    component: () => 'loading',
    rendered: 'loading'
  };

  isRendering = false;

  componentDidMount() {
    this.routeLoaded();
  }

  getRenderDefer() {
    if (!this.isRendering) this.renderDefer();
    const { rendered } = this.state;
    return () => rendered;
  }

  getComponentDefer() {
    if (!this.isRendering) this.componentDefer();
    const { component } = this.state;
    return component;
  }

  async componentDefer() {
    this.isRendering = true;
    let component = await this.componentDefer(this.props);
    if (component.__esModule) component = component.default;
    this.setState({ component });
    this.isRendering = false;
    this.routeLoaded();
  }

  async routeLoaded() {
    const { router } = this.context;
    for (const handleRouteLoaded of routeLoadedHandlers) {
      await handleRouteLoaded(router);
    }
  }

  async renderDefer() {
    this.isRendering = true;
    let rendered = await this.renderDefer(this.props);
    if (rendered.__esModule) rendered = rendered.default;
    this.setState({ rendered });
    this.isRendering = false;
    this.routeLoaded();
  }

  render() {
    const { component, render, componentDefer, renderDefer } = this.props;
    let props = { ...this.props };
    delete props.componentDefer;
    delete props.renderDefer;
    if (component) {
      if (Promise.resolve(component) === component) {
        this.componentDefer = component;
      }
    } else if (render) {
      if (Promise.resolve(render) === render) {
        this.renderDefer = render;
      }
    } else if (componentDefer) {
      this.componentDefer = componentDefer;
    } else if (renderDefer) {
      this.renderDefer = renderDefer;
    }
    if (this.componentDefer) {
      props = {
        ...props,
        component: this.getComponentDefer()
      };
    } else if (this.renderDefer) {
      props = {
        ...props,
        render: this.getRenderDefer()
      };
    }
    return <ReactRouterRoute {...props} />;
  }
}

export { onRouteLoaded };
