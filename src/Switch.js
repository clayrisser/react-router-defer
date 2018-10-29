import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Switch as ReactRouterSwitch } from 'react-router';

const historyPushHandlers = [];

function onHistoryPush(handleHistoryPush) {
  const index = historyPushHandlers.length;
  historyPushHandlers.push(handleHistoryPush);
  return {
    remove: () => delete historyPushHandlers[index]
  };
}

export default class Switch extends Component {
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
    return <ReactRouterSwitch {...this.props} />;
  }
}

export { onHistoryPush };
