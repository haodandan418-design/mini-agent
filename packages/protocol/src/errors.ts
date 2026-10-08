export type ProtocolErrorCode =
  | "INVALID_PROTOCOL_VALUE"
  | "MISSING_PROTOCOL_FIELD"
  | "INVALID_PROTOCOL_ID"
  | "INVALID_PROTOCOL_TYPE";

export interface ProtocolErrorPayload {
  code: ProtocolErrorCode;
  message: string;
  field?: string;
}

export class ProtocolValidationError extends Error {
  readonly code: ProtocolErrorCode;
  readonly field?: string;

  constructor(payload: ProtocolErrorPayload) {
    super(payload.message);
    this.name = "ProtocolValidationError";
    this.code = payload.code;
    this.field = payload.field;
  }
}

export function protocolError(
  code: ProtocolErrorCode,
  message: string,
  field?: string,
): ProtocolValidationError {
  return new ProtocolValidationError({ code, message, field });
}
