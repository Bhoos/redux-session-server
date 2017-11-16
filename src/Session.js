const ERROR = 'Error';

class Session {
  constructor(timestamp, serialId, client) {
    this.delta = Date.now() - timestamp;
    this.serialId = serialId;
    this.client = client;
    this.alive = true;
  }

  close() {
    this.client.close();
    this.alive = false;
  }

  dispatchError(message) {
    this.dispatch({
      type: ERROR,
      payload: {
        message,
      },
    });
  }

  dispatch(action) {
    if (!this.alive) {
      throw new Error('Cannot dispatch on a dead session');
    }

    this.client.dispatch(action);
  }
}

export default Session;
