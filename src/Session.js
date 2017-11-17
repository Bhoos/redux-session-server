const ERROR = 'Error';

class Session {
  constructor(id, timestamp, serialId, { close, dispatch }) {
    this.id = id;
    this.delta = Date.now() - timestamp;
    this.serialId = serialId;
    this.alive = true;

    this.close = () => {
      close();
      this.alive = false;
    };

    this.dispatch = (action) => {
      if (!this.alive) {
        throw new Error('Cannot dispatch on a dead session');
      }
      dispatch(action);
    };
  }

  dispatchError(message) {
    this.dispatch({
      type: ERROR,
      payload: {
        message,
      },
    });
  }
}

export default Session;
