import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { createSessionManager } from '../src';

import reducer from '../__mocks__/setup';

jest.useFakeTimers();

// eslint-disable-next-line no-underscore-dangle
global.__DEV__ = true;

describe('session middleware specification check', () => {
  test('', () => {
    const mockOnNewSession = jest.fn();
    const sessionManager = createSessionManager(mockOnNewSession);
    const store = createStore(reducer, applyMiddleware(thunk, sessionManager));

    const mockDispatch1 = jest.fn();
    const mockDispatch2 = jest.fn();
    const mockClose1 = jest.fn();
    const mockClose2 = jest.fn();

    const session1 = sessionManager.createSession(1, Date.now(), 0, {
      close: mockClose1,
      dispatch: mockDispatch1,
    });

    expect(mockOnNewSession.mock.calls.length).toBe(1);
    const session2 = sessionManager.createSession(2, Date.now(), 0, {
      close: mockClose2,
      dispatch: mockDispatch2,
    });
    expect(mockOnNewSession.mock.calls.length).toBe(2);

    session1.join('John Doe');
    expect(mockDispatch1.mock.calls.length).toBe(1);
    expect(mockDispatch2.mock.calls.length).toBe(1);

    session2.join('Jane Doe');
    expect(mockDispatch1.mock.calls.length).toBe(3); // Start timer is run
    expect(mockDispatch2.mock.calls.length).toBe(3); // Start timer is run

    jest.runAllTimers();

    // Check if sanitizer is working correctly or not (START_TIME)
    expect(mockDispatch1.mock.calls[2][0]).toMatchObject({
      type: 'START_TIMER',
      payload: {
        start: 0,
        end: -1000,
      },
    });

    expect(mockDispatch1.mock.calls[4][0]).toMatchObject({
      type: 'START_GAME',
      payload: { 1: 'Game Data for John Doe' },
    });
    expect(mockDispatch2.mock.calls[4][0]).toMatchObject({
      type: 'START_GAME',
      payload: { 2: 'Game Data for Jane Doe' },
    });

    expect(store.getState().game.running).toBe(true);

    // Lets check if the batching actions are working or not
    const mockClose3 = jest.fn();
    const mockDispatch3 = jest.fn();
    const session1t = sessionManager.createSession(2, Date.now(), 2, {
      close: mockClose3,
      dispatch: mockDispatch3,
    });

    expect(mockDispatch2.mock.calls[5][0].type).toBe('Error');
    expect(mockClose2.mock.calls).toHaveLength(1);
    // expect(mockClose1.mock.calls).toHaveLength(1);

    // JOIN, JOIN, START_GAME
    expect(mockDispatch3.mock.calls[0][0].payload).toHaveLength(1);


    // session1.join('John Doe');
    // console.log(store.getState());
  });
});
