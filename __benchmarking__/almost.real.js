import { createStore, applyMiddleware } from "redux";
import thunk from 'redux-thunk';

import reducer from '../__mocks__/setup';
import { createSessionManager } from '../src';

const fullTest = () => {
  const sessionManager = createSessionManager(() => {});
  const store = createStore(reducer, applyMiddleware(thunk, sessionManager));

  const sessions = [];
  // Start five sessions
  for (let i = 0; i < 5; i += 1) {
    const s = sessionManager.createSession(i + 1, Date.now(), 0, {
      close: () => {},
      dispatch: (action, serialId) => serialId,
    });
    s.join(`User ${i}`);
    sessions.push(s);
  }

  // Make a move for 20 times
  for (let i = 0; i < 20; i += 1) {
    sessions.forEach(session => session.move());
  }

  return store;
};

function run(iterations, fn) {
  const start = Date.now();
  for (let i = 0; i < iterations; i += 1) {
    fn(i);
  }

  const span = Date.now() - start;
  return {
    span: `${span}ms`,
    perIter: `${(span * 1000) / iterations}µs`,
  };
}

console.log(run(process.argv[2] || 1000, fullTest));
console.log(fullTest().getState());
