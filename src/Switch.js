import PropTypes from 'prop-types';
import React, { Component, createContext } from 'react';
import { Switch as ReactRouterSwitch } from 'react-router';

const SwitchContext = createContext();

const historyPushHandlers = [];

function onHistoryPush(handleHistoryPush) {
  const index = historyPushHandlers.length;
  historyPushHandlers.push(handleHistoryPush);
  return {
    remove: () => delete historyPushHandlers[index]
  };
}

export default class Switch extends Component {
  static propTypes = {
    loading: PropTypes.node,
    loadingAll: PropTypes.bool,
    onLoadingFinish: PropTypes.func,
    onLoadingStart: PropTypes.func
  };

  static defaultProps = {
    loading: null,
    loadingAll: false,
    onLoadingFinish: f => f,
    onLoadingStart: f => f
  };

  static contextTypes = {
    router: PropTypes.shape({
      history: PropTypes.shape({
        push: PropTypes.func.isRequired
      }).isRequired
    }).isRequired
  };

  componentWillMount() {
    const { router } = this.context;
    const { history } = router;
    if (!history._push) {
      history._push = history.push;
      history.push = async (...args) => {
        for (const handleHistoryPush of historyPushHandlers) {
          if (typeof handleHistoryPush === 'function') {
            await handleHistoryPush(router, ...args);
          }
        }
        history._push(...args);
      };
    }
  }

  render() {
    const props = { ...this.props };
    delete props.loading;
    delete props.loadingAll;
    return (
      <SwitchContext.Provider
        value={{
          loading: this.props.loading,
          loadingAll: this.props.loadingAll,
          onLoadingFinish: this.props.onLoadingFinish,
          onLoadingStart: this.props.onLoadingStart
        }}
      >
        <ReactRouterSwitch {...props}>{this.props.children}</ReactRouterSwitch>
      </SwitchContext.Provider>
    );
  }
}

export { onHistoryPush, SwitchContext };
