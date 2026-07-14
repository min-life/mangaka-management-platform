import axios from 'axios';

type ApiErrorBody = {
  error?: string;
  message?: string | string[];
  statusCode?: number;
};

export function getApiErrorMessage(error: unknown, fallbackMessage: string) {
  if (!axios.isAxiosError<ApiErrorBody>(error)) {
    return error instanceof Error ? error.message : fallbackMessage;
  }

  const responseMessage = error.response?.data?.message;
  if (Array.isArray(responseMessage) && responseMessage.length > 0) {
    return responseMessage.join(', ');
  }

  if (typeof responseMessage === 'string' && responseMessage.trim()) {
    return responseMessage;
  }

  if (typeof error.response?.data?.error === 'string' && error.response.data.error.trim()) {
    return error.response.data.error;
  }

  return fallbackMessage;
}
