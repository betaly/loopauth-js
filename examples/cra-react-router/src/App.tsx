import './App.css';
import {Error} from './Error';
import {Loading} from './Loading';
import {Me} from './Me';
import {Nav} from './Nav';
import {Users} from './Users';
import {useLoopAuth, withAuthenticationRequired} from '@loopauth/auth-react';
import React from 'react';
import {Route, Routes} from 'react-router-dom';

const ProtectedMe = withAuthenticationRequired(Me);
const ProtectedUsers = withAuthenticationRequired(Users);

function App() {
  const {isLoading, error} = useLoopAuth();

  if (isLoading) {
    return <Loading />;
  }

  return (
    <>
      <Nav />
      {error && <Error message={error.message} />}
      <Routes>
        <Route path="/" />
        <Route path="/me" element={<ProtectedMe />} />
        <Route path="/users" element={<ProtectedUsers />} />
      </Routes>
    </>
  );
}

export default App;
