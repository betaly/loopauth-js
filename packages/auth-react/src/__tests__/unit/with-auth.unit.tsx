import '@testing-library/jest-dom';
import {render, screen} from '@testing-library/react';
import React, {Component} from 'react';

import {ILoopAuthContext, InitialContext} from '../../auth-context';
import withLoopAuth, {WithLoopAuthProps} from '../../with-auth';

describe('withLoopAuth', () => {
  it('should wrap a class component', () => {
    class MyComponent extends Component<WithLoopAuthProps> {
      render(): React.JSX.Element {
        return <>hasAuth: {`${!!this.props.loopauth}`}</>;
      }
    }

    const WrappedComponent = withLoopAuth(MyComponent);
    render(<WrappedComponent />);
    expect(screen.getByText('hasAuth: true')).toBeInTheDocument();
  });

  it('should wrap a class component and provide context', () => {
    const context = React.createContext<ILoopAuthContext>(InitialContext);

    class MyComponent extends Component<WithLoopAuthProps> {
      render(): React.JSX.Element {
        return <>hasAuth: {`${!!this.props.loopauth}`}</>;
      }
    }

    const WrappedComponent = withLoopAuth(MyComponent, context);
    render(<WrappedComponent />);
    expect(screen.getByText('hasAuth: true')).toBeInTheDocument();
  });
});
