const ERROR = 'Error';

class Session {
  constructor(id, timestamp, { close, dispatch }) {
    this.id = id;
    this.delta = Date.now() - timestamp;
    this.alive = true;

    this.close = () => {
      close();
      this.alive = false;
    };

    this.dispatch = (action, serialId) => {
      if (this.alive) {
        dispatch(action, serialId);
      } else {
        // There is some probablity of seeing this working, specially
        // when the server closes the remote client and the remove client
        // also closes itself in response. Need to check though
        console.warn(`Dispatching ${action.type}/${serialId} on a dead session[${this.id}`);
      }
    };
  }

  dispatchError(message) {
    this.dispatch({
      type: ERROR,
      payload: {
        message,
      },
    }, null);
  }
}

export default Session;
