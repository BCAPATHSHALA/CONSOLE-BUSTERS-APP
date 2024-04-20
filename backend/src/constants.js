/**
 * @description Name of the database used in the backend setup.
 */
export const DB_NAME = "consolebustersapi";

/**
 * @description Expiration time (in some units) for a block.
 */
export const BLOCK_EXPIRY = 2;

/**
 * @type {{ ADMIN: "ADMIN"; USER: "USER"; MODERATOR: "MODERATOR"; GUEST: "GUEST"; PREMIUM: "PREMIUM"} as const}
 */
export const UserRolesEnum = {
  ADMIN: "admin",
  USER: "user",
  MODERATOR: "moderator",
  GUEST: "guest",
  PREMIUM: "premium",
};

export const AvailableUserRoles = Object.values(UserRolesEnum);
