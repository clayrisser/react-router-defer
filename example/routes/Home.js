import React, { Component } from 'react';
import { Link } from 'react-router-dom';

export default class Home extends Component {
  render() {
    console.log('rendered home');
    return (
      <div>
        <h1>Hello, world!</h1>
        <Link to="/">Home</Link>
        <Link to="/not-found">Not Found</Link>
      </div>
    );
  }
}
