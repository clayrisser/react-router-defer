import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Route as ReactRouterRoute } from 'react-router';
import { SwitchContext, onHistoryPush } from './Switch';

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
    loading: true,
    rendered: null
  };

  isLoading = false;

  initialRouteLoaded = false;

  isStated = false;

  componentWillMount() {
    onHistoryPush((router, location) => {
      const { pathname, search, hash } = router.history.location;
      if (`${pathname}${search}${hash}` !== location) {
        this.current = this.componentDefer || this.renderDefer;
        this.setState({ loading: true });
      }
    });
  }

  getRenderDefer() {
    if (!this.isLoading) this.triggerRenderDefer();
    const { rendered } = this.state;
    return () => rendered;
  }

  getComponentDefer() {
    if (!this.isLoading) this.triggerComponentDefer();
    const { component } = this.state;
    return component;
  }

  async triggerComponentDefer() {
    this.isLoading = true;
    let component = await this.componentDefer(this.props);
    if (component.__esModule) component = component.default;
    if (this.current !== this.componentDefer) {
      this.setState({ component, loading: false });
      this.finished();
    }
    this.isLoading = false;
    this.routeLoaded();
  }

  async routeLoaded() {
    if (!this.initialRouteLoaded) this.initialRouteLoaded = true;
    const { router } = this.context;
    for (const handleRouteLoaded of routeLoadedHandlers) {
      if (typeof handleRouteLoaded === 'function') {
        await handleRouteLoaded(router);
      }
    }
  }

  async triggerRenderDefer() {
    this.isLoading = true;
    let rendered = await this.renderDefer(this.props);
    if (rendered.__esModule) rendered = rendered.default;
    if (this.current !== this.componentDefer) {
      this.setState({ rendered, loading: false });
      this.finished();
    }
    this.isLoading = false;
    this.routeLoaded();
  }

  started() {
    if (!this.isStarted) {
      const { router } = this.context;
      this.isStarted = true;
      this.onLoadingStart(router);
    }
  }

  finished() {
    const { router } = this.context;
    this.isStarted = false;
    this.onLoadingFinish(router);
  }

  renderSwitchContext(context) {
    const { onLoadingStart, onLoadingFinish } = context;
    if (!this.onLoadingStart) {
      this.onLoadingStart = this.props.onLoadingStart || onLoadingStart;
    }
    if (!this.onLoadingFinish) {
      this.onLoadingFinish = this.props.onLoadingFinish || onLoadingFinish;
    }
    this.started();
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
    if (this.state.loading) return this.renderLoading(context, props);
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
    return (
      <SwitchContext.Consumer>
        {context => this.renderSwitchContext(context)}
      </SwitchContext.Consumer>
    );
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
