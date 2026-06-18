export type LoginErrors = Partial<{
  email: string;
  password: string;
  form: string;
}>;

export type RegisterErrors = Partial<{
  displayName: string;
  email: string;
  password: string;
  form: string;
}>;

export type ForgotPasswordErrors = Partial<{
  email: string;
  password: string;
  confirmPassword: string;
  form: string;
}>;

export function validateLogin(email: string, password: string): LoginErrors {
  const errors: LoginErrors = {};
  const normalizedEmail = email.trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    errors.email = 'Enter a valid email address.';
  }

  if (password.length < 6) {
    errors.password = 'Password must be at least 6 characters.';
  }

  return errors;
}

export function validateRegister(displayName: string, email: string, password: string): RegisterErrors {
  const errors: RegisterErrors = {};
  const normalizedEmail = email.trim();

  if (displayName.trim().length < 5) {
    errors.displayName = 'User name must be at least 5 characters.';
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    errors.email = 'Enter a valid email address.';
  }

  if (password.length < 6) {
    errors.password = 'Password must be at least 6 characters.';
  }

  return errors;
}

export function validateForgotPassword(email: string): ForgotPasswordErrors {
  const errors: ForgotPasswordErrors = {};
  const normalizedEmail = email.trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    errors.email = 'Enter a valid email address.';
  }

  return errors;
}

export function validateResetPassword(
  password: string,
  confirmPassword: string,
): ForgotPasswordErrors {
  const errors: ForgotPasswordErrors = {};

  if (password.length < 6) {
    errors.password = 'Password must be at least 6 characters.';
  }

  if (confirmPassword !== password) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return errors;
}
