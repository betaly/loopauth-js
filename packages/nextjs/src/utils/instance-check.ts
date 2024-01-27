let isUsingNamedExports = false;
let isUsingOwnInstance = false;

const instanceCheck = () => {
  if (isUsingNamedExports && isUsingOwnInstance) {
    throw new Error(
      'You cannot mix creating your own instance with `initAuth` and using named ' +
        "exports like `import { handleAuth } from '@loopauth/nextjs'`",
    );
  }
};

export const setIsUsingNamedExports = (): void => {
  isUsingNamedExports = true;
  instanceCheck();
};

export const setIsUsingOwnInstance = (): void => {
  isUsingOwnInstance = true;
  instanceCheck();
};
