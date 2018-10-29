import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Route as ReactRouterRoute } from 'react-router';
import { LoadingContext } from './Switch';

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
    loading: PropTypes.node,
    renderDefer: PropTypes.func
  };

  static defaultProps = {
    componentDefer: null,
    loading: null,
    renderDefer: null
  };

  static contextTypes = {
    router: PropTypes.shape({
      history: PropTypes.shape({
        push: PropTypes.func.isRequired
      }).isRequired
    }).isRequired
  };

  componentDefer = null;

  renderDefer = null;

  state = {
    component: () => null,
    loading: true,
    rendered: null
  };

  isRendering = false;

  getRenderDefer() {
    if (!this.isRendering) this.triggerRenderDefer();
    const { rendered } = this.state;
    return () => rendered;
  }

  getComponentDefer() {
    if (!this.isRendering) this.triggerComponentDefer();
    const { component } = this.state;
    return component;
  }

  async triggerComponentDefer() {
    this.isRendering = true;
    let component = await this.componentDefer(this.props);
    if (component.__esModule) component = component.default;
    this.setState({ component, loading: false });
    this.isRendering = false;
    this.routeLoaded();
  }

  async routeLoaded() {
    const { router } = this.context;
    for (const handleRouteLoaded of routeLoadedHandlers) {
      await handleRouteLoaded(router);
    }
  }

  async triggerRenderDefer() {
    this.isRendering = true;
    let rendered = await this.renderDefer(this.props);
    if (rendered.__esModule) rendered = rendered.default;
    this.setState({ rendered });
    this.isRendering = false;
    this.routeLoaded();
  }

  renderLoading(props) {
    delete props.component;
    delete props.render;
    return (
      <ReactRouterRoute {...props}>
        <LoadingContext.Consumer>
          {loading => this.props.loading || loading}
        </LoadingContext.Consumer>
      </ReactRouterRoute>
    );
  }

  render() {
    const { component, render, componentDefer, renderDefer } = this.props;
    if (component) {
      if (isPromise(component)) {
        this.componentDefer = component;
      }
    } else if (render) {
      if (isPromise(render)) {
        this.renderDefer = render;
      }
    } else if (componentDefer) {
      this.componentDefer = componentDefer;
    } else if (renderDefer) {
      this.renderDefer = renderDefer;
    }
    let props = { ...this.props };
    delete props.componentDefer;
    delete props.renderDefer;
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
    } else {
      this.routeLoaded();
    }
    if (this.state.loading) return this.renderLoading(props);
    return <ReactRouterRoute {...props} />;
  }
}

function isPromise(promise) {
  const { name } = promise?.constructor || {};
  if (name === 'Promise' || name === 'LazyPromise') return true;
  if (typeof promise === 'function') {
    const { name } = promise()?.constructor || {};
    if (name === 'Promise' || name === 'LazyPromise') return true;
  }
  return false;
}

export { onRouteLoaded };
