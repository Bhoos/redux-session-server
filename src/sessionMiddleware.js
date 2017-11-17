import { batchActions } from 'redux-batched-actions';

import Actions from './Actions';
import Session from './Session';

export default function createSessionMiddleware({
  getUserAction, getUserActionNames, consume, sanitize,
}) {
  return function createSessionManager(onNewSession) {
    const sessions = [];
    const actions = new Actions();

    return function sessionMiddleware(store) {
      // Create an array of userAction dispatchers, these need to be bound
      // to the specific session while creating the sessions
      const userActionNames = getUserActionNames();
      const userActionsDispatchers = userActionNames.map(name => ({
        name,
        fn: (session, ...args) => {
          try {
            store.dispatch(getUserAction(name)(session, ...args));
          } catch (err) {
            session.dispatchError(err.message);
          }
        },
      }));

      /**
       * Create a server side session for client
       *
       * @param {*} id User ID, that identifies the session uniquely
       * @param {*} timestamp The client side timestamp to manage the time
       *                      difference between client and server
       * @param {*} serialId The client side progress
       * @param {*} client The client interface
       */
      sessionMiddleware.createSession = (id, timestamp, serialId, client) => {
        const idx = sessions.findIndex(s => s.id === id);
        if (idx >= 0) {
          const s = sessions.splice(idx, 1)[0];
          // Close the session forcefully
          s.dispatchError('Logged in from another client');
          s.close();
        }

        const session = new Session(id, timestamp, client);

        // Get some validation from the application for every new session
        try {
          onNewSession(session, store.getState, store.dispatch);
        } catch (err) {
          session.dispatchError(err.message);
          session.close();
          return null;
        }

        // Everything is ok, register the new session
        sessions.push(session);

        // Send all the actions collected so far in a batch
        const batch = actions.fetchAfter(serialId, action => sanitize(action, session));
        if (batch.length > 0) {
          session.dispatch(batchActions(batch), actions.lastSerialId);
        }

        return userActionsDispatchers.reduce((res, d) => ({
          ...res,
          [d.name]: d.fn.bind(null, session),
        }), {});
      };

      return next => (action) => {
        const res = next(action);

        // Pre process the action
        // The pre process mechanism need to return a action
        // Some actions might not need to be recorded, like
        // when the player leaves, the preProcess mechanism
        // removes the join action, and the leave doesn't need
        // to be stored at all
        const serialId = consume(action, actions) && actions.push(action);

        if (__DEV__ && serialId === undefined) {
          const err = `Please make sure you have returned either null or an action object from preProcess hook for ${action.type}`;
          console.error(err);
          throw new Error(err);
        }

        // Send action to each and every client after sanitization
        sessions.forEach((session) => {
          const a = sanitize(action, session);
          if (a) {
            session.dispatch(a, serialId);
          }
        });

        return res;
      };
    };
  };
}

