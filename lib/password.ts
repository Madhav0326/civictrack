export const PASSWORD_REQUIREMENTS = [
  { label: 'At least 8 characters', test: (value: string) => value.length >= 8 },
  { label: 'One uppercase letter', test: (value: string) => /[A-Z]/.test(value) },
  { label: 'One lowercase letter', test: (value: string) => /[a-z]/.test(value) },
  { label: 'One number', test: (value: string) => /\d/.test(value) },
  { label: 'One special character', test: (value: string) => /[^A-Za-z0-9]/.test(value) },
];

export function passwordErrors(value: string) {
  return PASSWORD_REQUIREMENTS.filter((requirement) => !requirement.test(value)).map((requirement) => requirement.label);
}

export function passwordStrength(value: string) {
  const passed = PASSWORD_REQUIREMENTS.length - passwordErrors(value).length;
  if (passed <= 2) return { label: 'Weak', className: 'bg-destructive' };
  if (passed <= 4) return { label: 'Fair', className: 'bg-amber-500' };
  return { label: 'Strong', className: 'bg-emerald-500' };
}

export function isValidPassword(value: string) {
  return passwordErrors(value).length === 0;
}

