import { getDataStore } from "@/lib/data";

export type QuestionSetFlow = "option-a" | "option-b";

export const getQuestionSetFlow = async (): Promise<QuestionSetFlow> => {
  const store = getDataStore();
  const flag = await store.getFeatureFlag("question_set_flow");
  return flag?.enabled ? "option-b" : "option-a";
};

export const isEmailSendEnabled = async (): Promise<boolean> => {
  const store = getDataStore();
  const flag = await store.getFeatureFlag("email_send");
  return Boolean(flag?.enabled);
};
