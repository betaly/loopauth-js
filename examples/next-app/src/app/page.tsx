import isPlainObject from 'tily/is/plainObject';

import {getProtectedResource} from '@/app/api/auth/protected-resource/get-protected-resource';

import {getUser} from './api/auth/user/get-user';
import Nav from './nav';

const Page = async () => {
  const {isAuthenticated, user} = await getUser();
  const {data: protectedResource} = await getProtectedResource();

  return (
    <>
      <Nav isAuthenticated={isAuthenticated} />
      {!isAuthenticated && (
        <div className="mt-4 p-4 shadow-lg rounded bg-white">
          <h2 className="text-xl font-semibold mb-2">Next app directory</h2>
        </div>
      )}
      {isAuthenticated && user && (
        <div className="mt-4 p-4 shadow-lg rounded bg-white">
          <h2 className="text-xl font-semibold mb-2">Current User</h2>
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="border px-4 py-2 text-left">Name</th>
                <th className="border px-4 py-2 text-left">Value</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(user).map(([key, value]) => (
                <tr key={key} className="even:bg-gray-100">
                  <td className="border px-4 py-2">{key}</td>
                  <td className="border px-4 py-2">{isPlainObject(value) ? JSON.stringify(value) : value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {protectedResource && (
        <div className="mt-4 p-4 shadow-lg rounded bg-white">
          <h2 className="text-xl font-semibold mb-2">Protected Resource</h2>
          <div>{protectedResource}</div>
        </div>
      )}
    </>
  );
};

export default Page;
