import React, { Component } from "react";

class Home extends Component {
  render() {
    const { getAccessToken } = this.props.auth;
    const { isAuthenticated, login } = this.props.auth;
    return (
      <div className="container">
        {isAuthenticated() && <h4>You are logged in!</h4>}
        {!isAuthenticated() && (
          <h4>
            You are not logged in! Please{" "}
            <a style={{ cursor: "pointer" }} onClick={login.bind(this)}>
              Log In
            </a>{" "}
            to continue.
          </h4>
        )}
        {isAuthenticated() && (
          <img
            src={`http://localhost:3001/wms?token=${getAccessToken()}`}
            alt="sssss"
          />
        )}
      </div>
    );
  }
}

export default Home;
