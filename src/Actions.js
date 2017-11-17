/* eslint-disable no-underscore-dangle */
class Actions {
  constructor() {
    this.serialId = 0;
    this.all = [];
  }

  get length() {
    return this.all.length;
  }

  push(action) {
    this.serialId += 1;
    // eslint-disable-next-line no-param-reassign
    action._serial = this.serialId;
    return this.all.push(action);
  }

  fetchAfter(serialId, fn) {
    const res = [];
    for (let i = this.all.length - 1; i >= 0; i -= 1) {
      const action = this.all[i];
      if (action._serial > serialId) {
        res.unshift(fn(action, action._serial));
      } else {
        break;
      }
    }

    return res;
  }

  removeOneForward(fn) {
    for (let i = 0; i < this.all.length; i += 1) {
      const action = this.all[i];
      if (fn(action, action._serial)) {
        // Request to remove
        return this.all.splice(i, 1)[0];
      }
    }

    return null;
  }

  removeOne(fn) {
    for (let i = this.all.length - 1; i >= 0; i -= 1) {
      const action = this.all[i];
      if (fn(action, action._serial)) {
        return this.all.splice(i, 1)[0];
      }
    }

    return null;
  }

  remove(fn) {
    let count = 0;
    for (let i = this.all.length - 1; i >= 0; i -= 1) {
      const action = this.all[i];
      if (fn(action, action._serial)) {
        this.all.splice(i, 1);
        count += 1;
      }
    }
    return count;
  }
}

export default Actions;
