const Lock = jest.requireActual('browser-tabs-lock').default;

export const acquireLockSpy = jest.fn().mockResolvedValue(true);
export const releaseLockSpy = jest.fn();

export default class extends Lock {
  async acquireLock(...args: unknown[]) {
    const canProceed = await acquireLockSpy(...args);
    if (canProceed) {
      return super.acquireLock(...args);
    }
  }

  releaseLock(...args: unknown[]) {
    releaseLockSpy(...args);
    return super.releaseLock(...args);
  }
}
