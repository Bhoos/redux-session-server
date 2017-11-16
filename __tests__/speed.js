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
});
