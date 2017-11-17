import { registerUserAction, registerActionHook } from '../src';

let timer = null;

const stopTimer = () => (dispatch) => {
  if (timer === null) {
    throw new Error('No timer to stop');
  }

  clearTimeout(timer);
  timer = null;
  dispatch({
    type: 'STOP_TIMER',
    payload: {},
  });
};

const startTimer = (actionCreator, interval) => (dispatch) => {
  if (timer !== null) {
    throw new Error('Timer already running');
  }

  timer = setTimeout(() => {
    dispatch(stopTimer());
    return dispatch(actionCreator());
  }, interval);

  dispatch({
    type: 'START_TIMER',
    payload: {
      start: Date.now(),
      end: Date.now() + interval,
    },
  });
};

registerActionHook('START_TIMER', {
  sanitize: action => ({
    type: 'START_TIMER',
    payload: {
      start: 0,
      end: action.payload.start - action.payload.end,
    },
  }),
});

registerActionHook('STOP_TIMER', {
  preProcess: (action, actions) => {
    actions.removeOne(a => a.type === 'START_TIMER');
    // The stop timer doesn't need to be recorded
    return null;
  },
});

const startGame = () => (dispatch, getState) => {
  const { users } = getState();
  dispatch({
    type: 'START_GAME',
    payload: users.reduce((res, u) => ({
      ...res,
      [u.id]: `Game Data for ${u.name}`,
    }), {}),
    tag: 'game',
  });
};

registerActionHook('START_GAME', {
  preProcess: (action, actions) => {
    // Remove all existing game actions
    actions.remove(a => a.tag === 'game');
    return action;
  },

  sanitize: (action, session) => ({
    type: action.type,
    payload: {
      [session.id]: action.payload[session.id],
    },
  }),
});

const join = (session, name) => (dispatch, getState) => {
  dispatch({
    type: 'JOIN',
    payload: { id: session.id, name },
  });

  const state = getState();
  if (state.users.length === 2) {
    dispatch(startTimer(startGame, 1000));
  }
};

registerUserAction('join', join);

const move = session => (dispatch) => {
  dispatch({
    type: 'MOVE',
    payload: {
      id: session.id,
    },
  });
};

registerUserAction('move', move);

const leave = session => (dispatch, getState) => {
  dispatch({
    type: 'LEAVE',
    payload: {
      id: session.id,
    },
  });

  const state = getState();
  if (state.users.length === 1) {
    stopTimer();
  }
};

registerUserAction('leave', leave);
registerActionHook('LEAVE', {
  preProcess: (action, actions) => {
    // Remove the corresponding JOIN action
    actions.removeOne(a => a.type === 'JOIN' && a.payload.id === action.payload.id);
    return action;
  },
});

const initialState = { users: [], game: { running: false, moves: 0 }, timer: {} };

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case 'JOIN':
      return {
        ...state,
        users: state.users.concat(action.payload),
      };
    case 'LEAVE':
      return {
        ...state,
        users: state.users.filter(u => u.id !== action.payload.id),
      };
    case 'START_GAME':
      return {
        ...state,
        game: {
          running: true,
          moves: 0,
        },
      };
    case 'MOVE':
      return {
        ...state,
        game: {
          ...state.game,
          moves: state.game.moves + 1,
        },
      };

    case 'START_TIMER':
      return {
        ...state,
        timer: {
          ...action.payload,
          running: true,
        },
      };

    case 'STOP_TIMER':
      return {
        ...state,
        timer: {
          ...state.timer,
          running: false,
        },
      };

    default:
      return state;
  }
};

export default reducer;
