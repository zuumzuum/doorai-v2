"use server";

import { revalidatePath } from "next/cache";
import { requireAuth, requireTenant } from "@/lib/utils/error-handler";
import { upsertLineChannel, getLineChannelByTenantId, updateLineChannelStatus } from "@/lib/dal/line-channels";
import { createSuccessResult, createErrorResult, type ActionResult } from "@/lib/types/actions";
import { lineSettingsSchema, type LineSettingsInput } from "@/lib/schemas/auth";

export interface LineChannelData {
  id: string;
  channelId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Save LINE channel settings
export async function saveLineSettings(
  settings: LineSettingsInput
): Promise<ActionResult<LineChannelData>> {
  try {
    const user = await requireAuth();
    const tenant = await requireTenant(user.id);

    // Validate input with zod schema
    const parseResult = lineSettingsSchema.safeParse(settings);
    if (!parseResult.success) {
      return createErrorResult(parseResult.error.errors[0].message);
    }

    const { channelId, channelSecret, channelAccessToken } = parseResult.data;

    // Upsert LINE channel
    const result = await upsertLineChannel(tenant.id, {
      channel_id: channelId,
      channel_secret: channelSecret,
      access_token: channelAccessToken,
    });

    if (!result) {
      return createErrorResult("LINE設定の保存に失敗しました");
    }

    // Revalidate the settings page
    revalidatePath("/settings/line");

    return createSuccessResult({
      id: result.id,
      channelId: result.channel_id,
      isActive: result.is_active,
      createdAt: result.created_at!,
      updatedAt: result.updated_at!,
    });
  } catch (error) {
    console.error("Error saving LINE settings:", error);
    return createErrorResult("設定の保存中にエラーが発生しました");
  }
}

// Get LINE channel settings
export async function getLineSettings(): Promise<ActionResult<LineChannelData | null>> {
  try {
    const user = await requireAuth();
    const tenant = await requireTenant(user.id);

    const channel = await getLineChannelByTenantId(tenant.id);

    if (!channel) {
      return createSuccessResult(null);
    }

    return createSuccessResult({
      id: channel.id,
      channelId: channel.channel_id,
      isActive: channel.is_active,
      createdAt: channel.created_at!,
      updatedAt: channel.updated_at!,
    });
  } catch (error) {
    console.error("Error getting LINE settings:", error);
    return createErrorResult("設定の取得中にエラーが発生しました");
  }
}

// Test LINE connection
export async function testLineConnection(): Promise<ActionResult<{ isConnected: boolean }>> {
  try {
    const user = await requireAuth();
    const tenant = await requireTenant(user.id);

    const channel = await getLineChannelByTenantId(tenant.id);

    if (!channel || !channel.is_active) {
      return createErrorResult("LINE Botが設定されていません");
    }

    // Test LINE API connection by getting bot info
    const response = await fetch('https://api.line.me/v2/bot/info', {
      headers: {
        'Authorization': `Bearer ${channel.access_token}`,
      },
    });

    if (!response.ok) {
      return createErrorResult("LINE APIへの接続に失敗しました。設定を確認してください。");
    }

    return createSuccessResult({ isConnected: true });
  } catch (error) {
    console.error("Error testing LINE connection:", error);
    return createErrorResult("接続テスト中にエラーが発生しました");
  }
}

// Toggle LINE channel status
export async function toggleLineStatus(isActive: boolean): Promise<ActionResult<{ isActive: boolean }>> {
  try {
    const user = await requireAuth();
    const tenant = await requireTenant(user.id);

    const success = await updateLineChannelStatus(tenant.id, isActive);

    if (!success) {
      return createErrorResult("ステータスの更新に失敗しました");
    }

    // Revalidate the settings page
    revalidatePath("/settings/line");

    return createSuccessResult({ isActive });
  } catch (error) {
    console.error("Error toggling LINE status:", error);
    return createErrorResult("ステータス更新中にエラーが発生しました");
  }
}