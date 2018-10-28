import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Route as ReactRouterRoute } from 'react-router';

const historyPushHandlers = [];
const routeLoadedHandlers = [];

function onHistoryPush(handleHistoryPush) {
  historyPushHandlers.push(handleHistoryPush);
}
function onRouteLoaded(handleRouteLoaded) {
  routeLoadedHandlers.push(handleRouteLoaded);
}

class Route extends Component {
  static propTypes = {
    componentDefer: PropTypes.func,
    renderDefer: PropTypes.func
  };

  static defaultProps = {
    componentDefer: null,
    renderDefer: null
  };

  static contextTypes = {
    router: PropTypes.shape({
      history: PropTypes.shape({
        push: PropTypes.func.isRequired
      }).isRequired
    }).isRequired
  };

  state = {
    rendered: 'loading',
    component: () => 'loading'
  };

  isRendering = false;

  componentWillMount() {
    const { router } = this.context;
    const { history } = router;
    if (!history._push) {
      history._push = history.push;
      history.push = async (...args) => {
        for (const handleHistoryPush of historyPushHandlers) {
          await handleHistoryPush(router);
        }
        history._push(...args);
      };
    }
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
    let component = await this.props.componentDefer(this.props);
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
    let rendered = await this.props.renderDefer(this.props);
    if (rendered.__esModule) rendered = rendered.default;
    this.setState({ rendered });
    this.isRendering = false;
    this.routeLoaded();
  }

  render() {
    let props = { ...this.props };
    delete props.componentDefer;
    delete props.renderDefer;
    if (this.props.componentDefer) {
      props = {
        ...props,
        component: this.getComponentDefer()
      };
    } else if (this.props.renderDefer) {
      props = {
        ...props,
        render: this.getRenderDefer()
      };
    } else {
      this.routeLoaded();
    }
    return <ReactRouterRoute {...props} />;
  }
}

export * from 'react-router';
export { Route, onHistoryPush, onRouteLoaded };
