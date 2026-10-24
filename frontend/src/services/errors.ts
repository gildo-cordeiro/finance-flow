export interface FieldError {
  field: string;
  message: string;
}

/** Erro da API, montado a partir do Problem Details (ADR-0027). O `code` é estável; `message` é o `detail`. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fieldErrors: FieldError[];

  constructor(status: number, code: string, message: string, fieldErrors: FieldError[] = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

export async function toApiError(response: Response): Promise<ApiError> {
  const fallbackCode = `HTTP_${response.status}`;
  try {
    const body = await response.json();
    return new ApiError(
      response.status,
      typeof body.code === 'string' ? body.code : fallbackCode,
      typeof body.detail === 'string' ? body.detail : response.statusText,
      Array.isArray(body.errors) ? body.errors : []
    );
  } catch {
    return new ApiError(response.status, fallbackCode, response.statusText);
  }
}

const GENERIC_MESSAGE = 'Não foi possível concluir a operação. Tente novamente.';

const MESSAGES: Record<string, string> = {
  NETWORK_ERROR: 'Sem conexão com o servidor. Verifique sua internet e tente novamente.',
  INTERNAL_ERROR: 'Ocorreu um erro inesperado. Tente novamente em instantes.',
  TOO_MANY_REQUESTS: 'Muitas tentativas seguidas. Aguarde alguns minutos e tente novamente.',
  VALIDATION_FAILED: 'Confira os campos destacados.',
  UNAUTHORIZED: 'Sua sessão expirou. Entre novamente.',
  INVALID_REFRESH_TOKEN: 'Sua sessão expirou. Entre novamente.',
  INVALID_CREDENTIALS: 'E-mail ou senha incorretos.',
  EMAIL_ALREADY_USED: 'Já existe uma conta com este e-mail.',
  ACCOUNT_IN_USE: 'Esta conta tem transações e não pode ser excluída. Arquive-a para escondê-la.',
  CATEGORY_IN_USE: 'Esta categoria tem transações ou orçamento. Arquive ou mescle em outra.',
  CATEGORY_NAME_TAKEN: 'Já existe uma categoria com esse nome neste nível.',
  CATEGORY_HAS_SUBCATEGORIES: 'Exclua as subcategorias antes de excluir a categoria.',
  PARENT_CATEGORY_ARCHIVED: 'Desarquive a categoria pai primeiro.',
};

/** Mensagem para o usuário, escolhida pelo `code` do erro. */
export function errorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return GENERIC_MESSAGE;
  const known = MESSAGES[error.code];
  if (known) return known;
  return error.status >= 500 ? MESSAGES.INTERNAL_ERROR : error.message || GENERIC_MESSAGE;
}
