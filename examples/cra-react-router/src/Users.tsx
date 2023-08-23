import {Error} from './Error';
import {Loading} from './Loading';
import {useApi} from './use-api';
import React from 'react';

export function Users() {
  const {
    loading,
    error,
    data: users = [],
  } = useApi(`${process.env.REACT_APP_DOMAIN}/users`, {
    scope: 'profile email read:users',
  });

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <Error message={error.message} />;
  }

  return (
    <table className="table">
      <thead>
        <tr>
          <th scope="col">Name</th>
          <th scope="col">Email</th>
        </tr>
      </thead>
      <tbody>
        {users!.map(({name, email}: {name: string; email: string}, i: number) => (
          <tr key={i}>
            <td>{name}</td>
            <td>{email}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
