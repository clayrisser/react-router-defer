import React, { Component } from 'react';
import { Link } from 'react-router-dom';

export default class Home extends Component {
  render() {
    return (
      <div>
        <h1>Hello, world!</h1>
        <Link to="/not-found">Not Found</Link>
      </div>
    );
  }
}
