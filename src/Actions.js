class Actions {
  constructor() {
    this.serialId = 0;
    this.all = [];
  }

  get length() {
    return this.all.length;
  }

  get lastSerialId() {
    return this.serialId;
  }

  push(action) {
    this.serialId += 1;
    // eslint-disable-next-line no-param-reassign
    this.all.push({
      id: this.serialId,
      action,
    });

    return this.serialId;
  }

  fetchAfter(serialId, fn) {
    const res = [];
    for (let i = this.all.length - 1; i >= 0; i -= 1) {
      const { id, action } = this.all[i];
      if (id > serialId) {
        res.unshift(fn(action, id));
      } else {
        break;
      }
    }

    return res;
  }

  removeOneForward(fn) {
    for (let i = 0; i < this.all.length; i += 1) {
      const { id, action } = this.all[i];
      if (fn(action, id)) {
        // Request to remove
        this.all.splice(i, 1);
        return action;
      }
    }

    return null;
  }

  removeOne(fn) {
    for (let i = this.all.length - 1; i >= 0; i -= 1) {
      const { id, action } = this.all[i];
      if (fn(action, id)) {
        this.all.splice(i, 1);
        return action;
      }
    }

    return null;
  }

  remove(fn) {
    let count = 0;
    for (let i = this.all.length - 1; i >= 0; i -= 1) {
      const { id, action } = this.all[i];
      if (fn(action, id)) {
        this.all.splice(i, 1);
        count += 1;
      }
    }
    return count;
  }
}

export default Actions;
