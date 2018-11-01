import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Route as ReactRouterRoute } from 'react-router';
import { SwitchContext } from './Switch';

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
    loadingAll: PropTypes.bool,
    onLoadingFinish: PropTypes.func,
    onLoadingStart: PropTypes.func,
    renderDefer: PropTypes.func
  };

  static defaultProps = {
    componentDefer: null,
    loading: null,
    loadingAll: false,
    onLoadingFinish: null,
    onLoadingStart: null,
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
    isLoading: false,
    rendered: null
  };

  isLoading = true;

  initialRouteLoaded = false;

  previousHistoryLocation = null;

  getRenderDefer() {
    if (this.isLoading && !this.state.isLoading) this.triggerRenderDefer();
    const { rendered } = this.state;
    return () => rendered;
  }

  getComponentDefer() {
    if (this.isLoading && !this.state.isLoading) this.triggerComponentDefer();
    const { component } = this.state;
    return component;
  }

  async triggerComponentDefer() {
    this.startedLoading();
    let component = await this.componentDefer(this.props);
    if (component.__esModule) component = component.default;
    this.finishedLoading({ component });
  }

  async triggerRenderDefer() {
    this.startedLoading();
    let rendered = await this.renderDefer(this.props);
    if (rendered.__esModule) rendered = rendered.default;
    this.finishedLoading({ rendered });
  }

  startedLoading() {
    if (this.componentDefer || this.renderDefer) {
      this.state.isLoading = true;
      setTimeout(() => this.forceUpdate(), 0);
    }
    const { router } = this.context;
    this.onLoadingStart(router);
  }

  async finishedLoading({ rendered, component }) {
    const { router } = this.context;
    if (!this.initialRouteLoaded) this.initialRouteLoaded = true;
    this.onLoadingFinish(router);
    for (const handleRouteLoaded of routeLoadedHandlers) {
      if (typeof handleRouteLoaded === 'function') {
        await handleRouteLoaded(router);
      }
    }
    this.isLoading = false;
    if (this.componentDefer || this.renderDefer) {
      this.setState({
        isLoading: false,
        ...(rendered ? { rendered } : {}),
        ...(component ? { component } : {})
      });
    }
  }

  renderContext(context) {
    const { isLoading } = this.state;
    const { onLoadingStart, onLoadingFinish } = context;
    if (!this.onLoadingStart) {
      this.onLoadingStart = this.props.onLoadingStart || onLoadingStart;
    }
    if (!this.onLoadingFinish) {
      this.onLoadingFinish = this.props.onLoadingFinish || onLoadingFinish;
    }
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
    if (!this.componentDefer && !this.renderDefer) this.startedLoading();
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
      this.finishedLoading({});
    }
    if (isLoading) this.renderLoading(context, props);
    return <ReactRouterRoute {...props} />;
  }

  renderLoading({ loading, loadingAll }, props) {
    if (!this.initialRouteLoaded || this.props.loadingAll || loadingAll) {
      delete props.component;
      delete props.render;
      props.component = () => this.props.loading || loading;
    }
    return <ReactRouterRoute {...props} />;
  }

  render() {
    const { location } = this.context.router.history;
    if (location !== this.previousHistoryLocation) this.isLoading = true;
    this.previousHistoryLocation = location;
    return (
      <SwitchContext.Consumer>
        {context => this.renderContext(context)}
      </SwitchContext.Consumer>
    );
  }
}

function isPromise(promise) {
  const { name } = promise?.constructor || {};
  if (name === 'Promise' || name === 'LazyPromise') return true;
  if (typeof promise === 'function') {
    try {
      const { name } = promise()?.constructor || {};
      if (name === 'Promise' || name === 'LazyPromise') return true;
    } catch (err) {}
  }
  return false;
}

export { onRouteLoaded };
