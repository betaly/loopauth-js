'use client';

type Props = {
  readonly isAuthenticated: boolean;
};

const Nav = ({isAuthenticated}: Props) => {
  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="mx-auto flex justify-between items-center">
        <div className="flex space-x-4">
          <div className="flex items-center">
            <a href="#" className="text-lg font-semibold">
              LoopAuth
            </a>
          </div>
          {/* 菜单项 */}
          <div className="flex space-x-4 items-center">
            {isAuthenticated ? (
              <button
                onClick={() => {
                  window.location.assign('/api/auth/sign-out');
                }}
              >
                Sign Out
              </button>
            ) : (
              <button
                onClick={() => {
                  window.location.assign('/api/auth/sign-in');
                }}
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Nav;
