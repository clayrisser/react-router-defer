import PropTypes from 'prop-types';
import React, { Component, createContext } from 'react';
import { Switch as ReactRouterSwitch } from 'react-router';

const LoadingContext = createContext();

const historyPushHandlers = [];

function onHistoryPush(handleHistoryPush) {
  const index = historyPushHandlers.length;
  historyPushHandlers.push(handleHistoryPush);
  return {
    remove: () => delete historyPushHandlers[index]
  };
}

export default class Switch extends Component {
  static defaultProps = {
    loading: null
  };

  static propTypes = {
    loading: PropTypes.node
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
          await handleHistoryPush(router);
        }
        history._push(...args);
      };
    }
  }

  render() {
    const props = { ...this.props };
    delete props.loading;
    return (
      <LoadingContext.Provider value={this.props.loading}>
        <ReactRouterSwitch {...props}>{this.props.children}</ReactRouterSwitch>
      </LoadingContext.Provider>
    );
  }
}

export { onHistoryPush, LoadingContext };
