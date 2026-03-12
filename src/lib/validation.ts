import { z } from "zod";

export const nicknameSchema = z
  .string()
  .min(2, "닉네임은 2자 이상이어야 합니다")
  .max(12, "닉네임은 12자 이하여야 합니다")
  .regex(/^[가-힣a-zA-Z0-9_]+$/, "한글, 영문, 숫자, 밑줄만 사용 가능합니다");

export const phoneSchema = z
  .string()
  .regex(/^01[016789]\d{7,8}$/, "올바른 휴대폰 번호 형식이 아닙니다");

export const completeSignupSchema = z.object({
  nickname: nicknameSchema,
  phone: z.string().optional().or(z.literal("")),
  barracksAddress: z.string().url().optional().or(z.literal("")),
  barracksVerified: z.boolean().default(false),
  notificationEmail: z.string().email("올바른 이메일 형식이 아닙니다").optional().or(z.literal("")),
});

export type CompleteSignupInput = z.infer<typeof completeSignupSchema>;
