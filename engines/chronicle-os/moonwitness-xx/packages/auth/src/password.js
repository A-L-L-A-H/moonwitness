import argon2 from "argon2";

const PASSWORD_OPTIONS = Object.freeze({
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1
});

export async function hashPassword(password) {
  if (typeof password !== "string" || password.length < 12 || password.length > 128) {
    throw new TypeError("Password must contain between 12 and 128 characters");
  }

  return argon2.hash(password, PASSWORD_OPTIONS);
}

export async function verifyPassword(password, encodedHash) {
  if (typeof password !== "string" || typeof encodedHash !== "string" || !encodedHash) {
    return false;
  }

  try {
    return await argon2.verify(encodedHash, password, { type: argon2.argon2id });
  } catch {
    return false;
  }
}
