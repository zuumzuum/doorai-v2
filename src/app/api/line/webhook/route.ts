import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Initialize Supabase client with anon key for webhook access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// LINE API endpoints
const LINE_REPLY_URL = 'https://api.line.me/v2/bot/message/reply';

// Verify LINE webhook signature
function verifySignature(body: string, signature: string, channelSecret: string): boolean {
  const hash = crypto
    .createHmac('SHA256', channelSecret)
    .update(body)
    .digest('base64');
  return hash === signature;
}

// Send reply message to LINE
async function replyMessage(replyToken: string, messages: any[], accessToken: string) {
  const response = await fetch(LINE_REPLY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      replyToken,
      messages,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to send LINE reply:', error);
    throw new Error('Failed to send LINE reply');
  }
}

// Generate response using OpenAI
async function generateResponse(userMessage: string, properties: any[], conversationHistory: any[]) {
  const systemPrompt = `あなたは親切で丁寧な不動産会社のAIアシスタントです。
ユーザーからの物件に関する問い合わせに対して、適切な物件情報を提供します。
物件情報は簡潔にまとめ、LINEのメッセージとして読みやすい形式で返信してください。
敬語を使い、親しみやすい口調で対応してください。`;

  const propertiesInfo = properties.map(p => 
    `物件名: ${p.name}
住所: ${p.address}
賃料: ${p.rent_price?.toLocaleString()}円
間取り: ${p.floor_plan}
面積: ${p.area_sqm}㎡
説明: ${p.ai_description || '詳細はお問い合わせください。'}`
  ).join('\n\n');

  const userPrompt = `ユーザーからの問い合わせ: ${userMessage}

${properties.length > 0 ? `見つかった物件情報:\n${propertiesInfo}` : '該当する物件が見つかりませんでした。'}

適切な返信を生成してください。`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.slice(-5), // Include last 5 messages for context
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const response = completion.choices[0].message.content || 'すみません、回答を生成できませんでした。';
    const tokensUsed = completion.usage?.total_tokens || 0;

    return { response, tokensUsed };
  } catch (error) {
    console.error('Error generating OpenAI response:', error);
    return { 
      response: '申し訳ございません。現在システムに問題が発生しています。しばらくしてからもう一度お試しください。', 
      tokensUsed: 0 
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-line-signature');

    // 1. Verify signature first (highest priority)
    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    // Parse the webhook event
    const event = JSON.parse(body);

    // Get channel configuration using RPC function to bypass RLS
    const { data: channelData, error: channelError } = await supabase
      .rpc('get_line_channel_for_webhook', {
        p_channel_id: event.destination
      });

    if (channelError || !channelData) {
      console.error('LINE channel not found or inactive:', event.destination);
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    const lineChannel = channelData;

    // Verify signature with channel secret
    if (!verifySignature(body, signature, lineChannel.channel_secret)) {
      console.error('Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    // Handle only message events
    if (event.events.length === 0) {
      return NextResponse.json({ success: true });
    }

    for (const e of event.events) {
      if (e.type !== 'message' || e.message.type !== 'text') {
        continue;
      }

      const userId = e.source.userId;
      const userMessage = e.message.text;
      const replyToken = e.replyToken;

      // Get or create conversation using RPC function
      const { data: conversationData, error: convError } = await supabase
        .rpc('get_or_create_line_conversation', {
          p_tenant_id: lineChannel.tenant_id,
          p_line_user_id: userId
        });

      if (convError || !conversationData) {
        console.error('Error getting/creating conversation:', convError);
        continue;
      }

      const conversation = conversationData;
      const conversationId = conversation.id;
      const messages = conversation.messages || [];

      // Search properties using RPC function
      const { data: propertiesData, error: searchError } = await supabase
        .rpc('search_properties_for_line', {
          p_tenant_id: lineChannel.tenant_id,
          p_query: userMessage
        });

      if (searchError) {
        console.error('Error searching properties:', searchError);
      }

      const properties = propertiesData || [];

      // Generate response
      const { response, tokensUsed } = await generateResponse(userMessage, properties, messages);

      // 3. Update usage_tokens with a single RPC call for exclusive update
      const { data: tokenUpdateResult, error: tokenUpdateError } = await supabase
        .rpc('update_line_token_usage', {
          p_tenant_id: lineChannel.tenant_id,
          p_tokens_to_add: tokensUsed
        });

      if (tokenUpdateError) {
        console.error('Error updating token usage:', tokenUpdateError);
      }

      if (tokenUpdateResult && !tokenUpdateResult.success) {
        if (tokenUpdateResult.error === 'Token limit exceeded') {
          await replyMessage(
            replyToken,
            [{
              type: 'text',
              text: '申し訳ございません。月間の利用上限に達しました。プランをアップグレードしてください。',
            }],
            lineChannel.access_token
          );
          continue;
        }
      }

      // Update conversation history
      const updatedMessages = [
        ...messages,
        { role: 'user', content: userMessage, timestamp: new Date().toISOString() },
        { role: 'assistant', content: response, timestamp: new Date().toISOString() },
      ];

      // Update conversation using RPC function
      const { error: updateConvError } = await supabase
        .rpc('update_line_conversation', {
          p_conversation_id: conversationId,
          p_messages: updatedMessages,
          p_tokens_used: conversation.tokens_used + tokensUsed
        });

      if (updateConvError) {
        console.error('Error updating conversation:', updateConvError);
      }

      // Send reply
      await replyMessage(
        replyToken,
        [{
          type: 'text',
          text: response,
        }],
        lineChannel.access_token
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}