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

describe('Check speed on splicing small arrays', () => {
  test('With 200 actions', () => {
    const src = [];
    const items = 100;
    for (let i = 0; i < items; i += 1) {
      src.push({
        type: 'SOME_ACTION',
        payload: {
          number: i,
        },
      });
    }

    console.log(src.slice()[0]);

    const iterations = 10000;
    let start = Date.now();
    for (let i = 0; i < iterations; i += 1) {
      const copy = src.slice();
    }
    let span = Date.now() - start;
    console.log(`${span}ms total, ${span * 1000 / iterations}µs per iteration`);

    start = Date.now();
    for (let i = 0; i < iterations; i += 1) {
      const copy = src.slice();
      for (let j = 0; j < items; j += 1) {
        if (copy[0].type === 'SOME_ACTION' && j < 50) {
          copy.splice(0, 1);
        }
      }
    }
    span = Date.now() - start;
    console.log(`${span}ms total, ${span * 1000 / iterations}µs per iteration`);
  });

  test('Store creation and executing 200 actions', () => {
    const fn = (iter) => {
      const store = createStore(reducer, applyMiddleware(customMiddleware));
      for (let i = 0; i < 200; i += 1) {
        store.dispatch(actions[i % actions.length](iter));
      }
    };

    console.log(run(1000, fn));
  });
});
