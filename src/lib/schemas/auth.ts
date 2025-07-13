import { z } from 'zod';

export const signupSchema = z.object({
  email: z
    .string()
    .min(1, 'メールアドレスは必須です')
    .email('有効なメールアドレスを入力してください')
    .transform(val => val.trim().toLowerCase()),
  password: z
    .string()
    .min(8, 'パスワードは8文字以上である必要があります')
    .max(128, 'パスワードは128文字以内で入力してください'),
  name: z
    .string()
    .min(1, '名前は必須です')
    .max(100, '名前は100文字以内で入力してください')
    .transform(val => val.trim()),
});

export type SignupInput = z.infer<typeof signupSchema>;

// LINE設定用のスキーマも追加
export const lineSettingsSchema = z.object({
  channelId: z
    .string()
    .min(1, 'Channel IDは必須です')
    .regex(/^\d+$/, 'Channel IDは数字のみで入力してください'),
  channelSecret: z
    .string()
    .min(1, 'Channel Secretは必須です')
    .length(32, 'Channel Secretは32文字である必要があります'),
  channelAccessToken: z
    .string()
    .min(1, 'Channel Access Tokenは必須です')
    .regex(/^[a-zA-Z0-9+/=]+$/, '無効なChannel Access Tokenです'),
});

export type LineSettingsInput = z.infer<typeof lineSettingsSchema>;