import axios from 'axios';

type ApiErrorBody = {
  error?: string;
  message?: string | string[];
  statusCode?: number;
};

export function getEditorBoardApiErrorMessage(error: unknown, fallbackMessage: string) {
  if (!axios.isAxiosError<ApiErrorBody>(error)) {
    return error instanceof Error && error.message ? error.message : fallbackMessage;
  }

  const responseMessage = error.response?.data?.message;
  const message = Array.isArray(responseMessage)
    ? responseMessage.filter(Boolean).join(', ')
    : responseMessage;
  const errorCode = error.response?.data?.error;
  const statusCode = error.response?.data?.statusCode ?? error.response?.status;
  const details = [errorCode, statusCode ? `HTTP ${statusCode}` : null].filter(Boolean).join(' / ');

  if (message?.trim()) {
    return details ? `${message} (${details})` : message;
  }

  if (errorCode?.trim()) {
    return statusCode ? `${errorCode} (HTTP ${statusCode})` : errorCode;
  }

  return fallbackMessage;
}
