export type SubmissionErrorCode =
  | "AUTH_REQUIRED"
  | "WORD_COUNT"
  | "CHALLENGE_NOT_FOUND"
  | "EVALUATION_FAILED";

export class SubmissionError extends Error {
  readonly code: SubmissionErrorCode;

  constructor(code: SubmissionErrorCode, message: string) {
    super(message);
    this.name = "SubmissionError";
    this.code = code;
  }
}

export function getSubmissionErrorMessage(error: unknown) {
  if (error instanceof SubmissionError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong while evaluating the submission.";
}
