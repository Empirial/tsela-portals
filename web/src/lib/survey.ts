// Where survey answers go. NOT CONNECTED YET: the destination (Firestore, a spreadsheet, email...) is still to be chosen.
// Until then submitSurvey does not store anything, so the survey pages are not linked from the public site.

export type Answers = Record<string, string | string[]>

export type SurveySubmission = {
  survey: 'merchants' | 'customers'
  answers: Answers // question id -> chosen option(s) or typed text; "<id>_other" holds an "Other" text
  submittedAt: string // ISO time
}

export async function submitSurvey(submission: SurveySubmission): Promise<void> {
  // TODO: send `submission` to its destination here. Throw an Error to show the visitor "could not send".
  if (import.meta.env.DEV) console.info('[survey] not stored yet:', submission)
}
