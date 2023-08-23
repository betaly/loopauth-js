import {ILoopAuthContext, LoopAuthContext} from './auth-context';
import React, {ComponentType} from 'react';

/**
 * Components wrapped in `withLoopAuth` will have an additional `loopauth` prop
 */
export interface WithLoopAuthProps {
  loopauth: ILoopAuthContext;
}

/**
 * ```jsx
 * class MyComponent extends Component {
 *   render() {
 *     // Access the auth context from the `loopauth` prop
 *     const { user } = this.props.loopauth;
 *     return <div>Hello {user.name}!</div>
 *   }
 * }
 * // Wrap your class component in withLoopAuth
 * export default withLoopAuth(MyComponent);
 * ```
 *
 * Wrap your class components in this Higher Order Component to give them access to the LoopAuthContext.
 *
 * Providing a context as the second argument allows you to configure the LoopAuthProvider the LoopAuthContext
 * should come from f you have multiple within your application.
 */
const withLoopAuth = <P extends WithLoopAuthProps>(
  Component: ComponentType<P>,
  context = LoopAuthContext,
): ComponentType<Omit<P, keyof WithLoopAuthProps>> => {
  return function WithAuth(props): React.JSX.Element {
    return (
      <context.Consumer>
        {(auth: ILoopAuthContext): React.JSX.Element => <Component {...(props as P)} loopauth={auth} />}
      </context.Consumer>
    );
  };
};

export default withLoopAuth;
