import {useLoopAuth} from '@loopauth/auth-react';
import React from 'react';
import {Link, useLocation} from 'react-router-dom';

export function Nav() {
  const {isAuthenticated, user, loginWithRedirect, logout} = useLoopAuth<{
    name: string;
    username: string;
  }>();
  const {pathname} = useLocation();

  async function handleLogout() {
    try {
      await logout({logoutParams: {returnTo: window.location.origin}});
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light">
      <div className="container-fluid">
        <span className="navbar-brand">@loopauth/auth-react</span>
        <div className="collapse navbar-collapse">
          <div className="navbar-nav">
            <Link to="/" className={`nav-item nav-link${pathname === '/' ? ' active' : ''}`}>
              Home
            </Link>
            <Link to="/me" className={`nav-item nav-link${pathname === '/me' ? ' active' : ''}`}>
              Me
            </Link>
            {/*<Link to="/users" className={`nav-item nav-link${pathname === '/users' ? ' active' : ''}`}>*/}
            {/*  Users*/}
            {/*</Link>*/}
          </div>
        </div>

        {isAuthenticated ? (
          <div>
            <span id="hello">Hello, {user?.username}!</span>{' '}
            <button className="btn btn-outline-secondary" id="logout" onClick={() => handleLogout()}>
              logout
            </button>
          </div>
        ) : (
          <button className="btn btn-outline-success" id="login" onClick={() => loginWithRedirect()}>
            login
          </button>
        )}
      </div>
    </nav>
  );
}
