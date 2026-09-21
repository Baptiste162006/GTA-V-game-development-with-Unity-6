// Bus d'événements minimal : les systèmes de jeu n'ont pas à connaître l'UI.
const listeners = new Map();

export const GameEvents = {
  on(name, fn) {
    if (!listeners.has(name)) listeners.set(name, new Set());
    listeners.get(name).add(fn);
    return () => GameEvents.off(name, fn);
  },

  off(name, fn) {
    listeners.get(name)?.delete(fn);
  },

  emit(name, payload) {
    const set = listeners.get(name);
    if (!set) return;
    for (const fn of set) fn(payload);
  },
};

export const EVENTS = {
  MONEY: 'money',
  HEALTH: 'health',
  WANTED: 'wanted',
  NOTIFY: 'notify',
  OBJECTIVE: 'objective',
  MISSION_DONE: 'mission-done',
  BIG_MESSAGE: 'big-message',
  ENTER_VEHICLE: 'enter-vehicle',
  EXIT_VEHICLE: 'exit-vehicle',
};
