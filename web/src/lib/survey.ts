import { httpsCallable } from 'firebase/functions'
import { functions } from './firebase'

// Survey answers are saved by the backend function `submitSurvey` (backend/functions/src/index.ts) into the
// Firestore `surveys` collection. The owner reads them in the dashboard under Survey responses.

export type Answers = Record<string, string | string[]>

export type SurveyContact = {
  name: string
  phone: string
  email: string
  business: string
  consent: boolean
}

export type SurveySubmission = {
  survey: 'merchants' | 'customers'
  answers: Answers // question id -> chosen option(s) or typed text; "<id>_other" holds an "Other" text
  contact: SurveyContact
}

export async function submitSurvey(submission: SurveySubmission): Promise<void> {
  await httpsCallable(functions, 'submitSurvey')(submission)
}
