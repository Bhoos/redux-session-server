import Actions from '../src/Actions';

describe('Check if the opaque Actions collection', () => {
  test('pushing', () => {
    const actions = new Actions();
    actions.push({ type: 'T1' });
    actions.push({ type: 'T2' });
    expect(actions.length).toBe(2);
  });

  test('fetching', () => {
    const actions = new Actions();
    actions.push({ type: 'T1' });
    actions.push({ type: 'T2' });
    const all = actions.fetchAfter(0, a => a);
    expect(all.length).toBe(2);
    expect(actions.fetchAfter(1, a => a).length).toBe(1);
    expect(actions.fetchAfter(1, a => a)[0]).toMatchObject({
      type: 'T2',
      _serial: 2,
    });
    expect(actions.fetchAfter(2, a => a).length).toBe(0);
  });

  test('remove', () => {
    const actions = new Actions();
    actions.push({ type: 'T1' });
    actions.push({ type: 'T2' });
    actions.push({ type: 'T3', tag: 'r' });
    actions.push({ type: 'T4', tag: 'r' });
    expect(actions.length).toBe(4);
    expect(actions.removeOne(a => a.type === 'T2')).toMatchObject({ type: 'T2' });
    expect(actions.length).toBe(3);
    expect(actions.removeOneForward(a => a.type === 'T1')).toMatchObject({ type: 'T1' });
    expect(actions.length).toBe(2);
    actions.push({ type: 'T5', tag: 'n' });
    actions.push({ type: 'T6', tag: 'n' });
    actions.push({ type: 'T7', tag: 'n' });
    expect(actions.length).toBe(5);
    expect(actions.remove(a => a.tag === 'r')).toBe(2);
    expect(actions.length).toBe(3);
    expect(actions.removeOne(a => a.tag === 'n')).toMatchObject({ type: 'T7' });
    expect(actions.removeOneForward(a => a.tag === 'n')).toMatchObject({ type: 'T5' });
    expect(actions.length).toBe(1);

    expect(actions.fetchAfter(1, a => a)[0]).toMatchObject({ type: 'T6' });
  });
});
