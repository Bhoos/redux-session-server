# redux-session-server
Using redux on server with proper session management

# Installation
> `$ npm install redux-session-server`

# Usage
## Create a session manager redux middleware
```javascript
import { createSessionManager } from 'redux-session-server';

const onNewSession = (session, getState, dispatch) => { 
  // Callback mechanism to handle new session, may be see if there
  // are more sessions than we can support. Just throw and error if
  // you do not want to accept this session
}

const onDestroySession = (session, getState, dispatch) => {
  // A notification mechanism when a session is destroyed. Could be
  // used as a cleanup mechanism
}

const sessionManager = createSessionManager(onNewSession, onDestroySession);

// Create sessions via sessionManager for every new user connection
// The userId uniquely identifies the session
// Timestamp could be used for changing timestamps through preProcessing action hooks
// serialId could be used to dispatch only actions that are available after the given id
// client needs to provide a 'close' and 'dispatch' mechanisms.
const clientSession = sessionManager.create(userId, Date.now(), 0, client);

// the clientSession can then be used to perform any user Action
clientSession.join(name, picture);
clientSession.makeMove([1, 2]);
```

## Register user actions
```javascript
import { registerUserAction } from 'redux-session-server';

const join = (session, name, picture) => (dispatch, getState) => {
  dispatch({
    type: 'JOIN',
    payload: {
      id: session.id,
      name,
      picture,
    },
  });
}

// Register user actions, that are then available to be invoked via clientSession.
// Note that, while invoking the action from the client session object, the session
// instance should not be passed, it is provided by the manager itself
registerUserAction('join', join);
```

## Add hooks to customize your action structure
You could use hooks to clear actions from previous rounds, or remove selective actions
only. For example, after every LEAVE action, you might want to remove the JOIN action.
This way your list of actions remain trimmed.

```javascript
import { registerActionHook } from 'redux-session-server'

registerActionHook('LEAVE', {
  // As soon as the action is executed on the store, this hook is triggered. You
  // could use the `actions` parameter to trim down on your actions list.
  // You could change the action here (hardly needed), or you could return null
  // to not record the action in serialization
  preProcess: (action, actions) => {
    // Remove only one (iterating all the actions from the back)
    actions.removeOne(a => a.type === 'LEAVE');
    // Use removeOneForward to iterate from the front

    // Remove all actions that are tagged as dynamic
    actions.remove(a => a.tag === 'dyn');

    // If you want this action to be recorded for serialization return it, otherwise
    // return null;
    return action;
  },

  // Sanitize the action on the per session basis, this hook it triggered before the
  // action is dispatched to the client. Use this opportunity to customize the action
  // on per client basis. For example you might want to remove client specific information
  // which are all needed on server, but should not be passed on to the client. Or you
  // might want to change the timestamps of your timer, so all the clients behave exactly
  // regardles of what time they have.
  sanitize: (action, session) => ({
    ...action,
    payload: {
      [session.id]: action.payload[session.id],
      startTimestamp: action.payload.startTimestamp - session.delta,
    },
  });
})
```