import {Error} from './Error';
import {Loading} from './Loading';
import {useApi} from './use-api';
import React from 'react';

export function Me() {
  const {loading, error, data = {}} = useApi(`${process.env.REACT_APP_DOMAIN}/auth/me`);

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <Error message={error.message} />;
  }

  return (
    <div style={{margin: '10px 20px 0px'}}>
      <h1>{data?.username}</h1>
      <table className="table">
        <thead>
          <tr>
            <th scope="col">Key</th>
            <th scope="col">Value</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(data).map(([key, value], i: number) => (
            <tr key={i}>
              <td>{key}</td>
              <td>{JSON.stringify(value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
