export const DEFAULT_PLAN = Object.freeze({baseCents: 20000, extraUserCents: 5000, includedUsers: 1, graceDays: 5, paymentsEnabled: false, blockingEnabled: false});
export function calculate(plan, users) {
  if (!Number.isSafeInteger(users) || users < 0) throw new Error('Invalid users');
  for (const field of ['baseCents','extraUserCents']) if (!Number.isSafeInteger(plan[field]) || plan[field] < 0) throw new Error('Invalid price');
  if (!Number.isSafeInteger(plan.includedUsers) || plan.includedUsers < 1) throw new Error('Invalid plan');
  const extras = Math.max(0, users - plan.includedUsers);
  return {users, extras, totalCents: plan.baseCents + extras * plan.extraUserCents};
}
