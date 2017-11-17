import { createStore, applyMiddleware } from 'redux';

const reducer = (state, action) => {
  switch (action.type) {
    case 'ACTION_1':
      return {
        ...state,
        one: action.payload,
      };
    case 'ACTION_2':
      return {
        ...state,
        two: action.payload,
      };
    default:
      return state;
  }
};

const customMiddleware = store => next => action => next(action);
const actions = [
  idx => ({
    type: 'ACTION_1',
    payload: idx,
  }),
  idx => ({
    type: 'ACTION_2',
    payload: idx,
  }),
];

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

const fn = (iter) => {
  const store = createStore(reducer, applyMiddleware(customMiddleware));
  const storeActions = [];
  for (let i = 0; i < 200; i += 1) {
    const action = actions[i % actions.length](iter);
    storeActions.push(action);
    store.dispatch(action);
  }
};

console.log(run(process.argv[2] || 1000, fn));
