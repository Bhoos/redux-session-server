import { batchActions } from 'redux-batched-actions';

import Session from './Session';

export default function createSessionMiddleware({
  getUserAction, getUserActionNames, consume, sanitize,
}) {
  return function createSessionManager(onNewSession) {
    const sessions = [];
    const actions = [];

    // a serially incrementing identifier for actions
    let gSerialId = 0;

    return function sessionMiddleware(store) {
      // Create an array of userAction dispatchers, these need to be bound
      // to the specific session while creating the sessions
      const userActionNames = getUserActionNames();
      const userActionsDispatchers = userActionNames.map(name => (session, ...args) => {
        try {
          store.dispatch(getUserAction(name)(session, ...args));
        } catch (err) {
          session.dispatchError(err.message);
        }
      });

      /**
       * Create a server side session for client
       *
       * @param {*} id User ID, that identifies the session uniquely
       * @param {*} timestamp The client side timestamp to manage the time
       *                      difference between client and server
       * @param {*} serialId The client side progress
       * @param {*} client The client interface
       */
      createSessionManager.createSession = (id, timestamp, serialId, client) => {
        const idx = sessions.findIndex(s => s.id === id);
        if (idx >= 0) {
          const s = sessions.splice(idx, 1)[0];
          // Close the session forcefully
          s.dispatchError('Logged in from another client');
          s.close();
        }

        const session = new Session(id, timestamp, serialId, client);

        // Get some validation from the application for every new session
        try {
          onNewSession(store.getState, store.dispatch);
        } catch (err) {
          session.dispatchError(err.message);
          session.close();
          return null;
        }

        // Everything is ok, register the new session
        sessions.push(session);

        // Send all the actions collected so far in a batch
        const batch = [];
        for (let i = actions.length - 1; i >= 0; i -= 1) {
          const action = actions[i];
          if (action.serialId > serialId) {
            batch.unshift(sanitize(action.action, session));
          } else {
            break;
          }
        }

        if (batch.length > 0) {
          session.dispatch(batchActions(batch));
        }

        return userActionsDispatchers.map(d => d.bind(null, session));
      };

      return next => (action) => {
        const res = next(action);

        // Pre process the action
        if (consume(action, actions)) {
          // The pre process mechanism need to return a action
          // Some actions might not need to be recorded, like
          // when the player leaves, the preProcess mechanism
          // removes the join action, and the leave doesn't need
          // to be stored at all
          gSerialId += 1;
          actions.push({
            serialId: gSerialId,
            action,
          });
        }

        // Send action to each and every client after sanitization
        sessions.forEach((session) => {
          const a = sanitize(action, session);
          if (a) {
            session.dispatch(a);
          }
        });

        return res;
      };
    };
  };
}

