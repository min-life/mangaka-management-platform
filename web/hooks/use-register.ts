'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AxiosError } from 'axios';

import { register as registerRequest } from '@/services/auth.service';

export type RegisterErrors = Partial<{
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
  form: string;
}>;

type RegisterValues = {
  displayName: string;
  email: string;
  password: string;
};

export function useRegister() {
  const router = useRouter();
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const register = useCallback(
    async ({ displayName, email, password }: RegisterValues) => {
      setIsSubmitting(true);
      setErrors({});

      const normalizedEmail = email.trim().toLowerCase();

      try {
        await registerRequest({
          displayName: displayName.trim(),
          email: normalizedEmail,
          password,
        });

        router.push(`/check-email?email=${encodeURIComponent(normalizedEmail)}`);
      } catch (error) {
        const axiosError = error as AxiosError<{ message?: string }>;
        const message = axiosError.response?.data?.message;

        setErrors({
          form:
            axiosError.response?.status === 409
              ? 'Email already exists.'
              : (message ?? 'Unable to create your account. Please try again.'),
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [router],
  );

  return {
    errors,
    isSubmitting,
    register,
    setErrors,
  };
}
