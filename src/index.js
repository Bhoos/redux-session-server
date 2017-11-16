import createSessionMiddleware from './sessionMiddleware';


const userActions = {};
const actionHooks = {};

const registrar = {
  getUserActionNames: () => Object.keys(userActions),

  getUserAction: name => userActions[name],

  consume: (action, actions) => {
    const hook = actionHooks[action.type];
    if (!hook || !hook.preProcess) {
      return action;
    }

    return hook.preProcess(action, actions);
  },

  sanitize: (action, session) => {
    const hook = actionHooks[action.type];
    if (!hook || !hook.sanitize) {
      return action;
    }

    return hook.sanitize(action, session);
  },
};

export function registerUserAction(name) {
  userActions[name] = true;
}

export function registerActionHook(type, hook) {
  actionHooks[type] = hook;
}

export const sessionMiddleware = createSessionMiddleware(registrar);
