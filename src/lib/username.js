export const normalizeUsername = value => value.trim().toLowerCase().replace(/[^a-z0-9_.]/g, '');

export const validateUsername = value => {
  const username = normalizeUsername(value);
  if (!/^[a-z][a-z0-9_.]{2,19}$/.test(username)) {
    return 'Username must be 3-20 characters, start with a letter, and use only letters, numbers, dots, or underscores.';
  }
  return '';
};
