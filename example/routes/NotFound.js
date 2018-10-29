import React, { Component } from 'react';
import { Link } from 'react-router-dom';

export default class NotFound extends Component {
  render() {
    console.log('rendered not found');
    return (
      <div>
        <h1>Not Found</h1>
        <Link to="/">Home</Link>
        <Link to="/not-found">Not Found</Link>
      </div>
    );
  }
}
