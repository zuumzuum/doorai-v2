import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { signupSchema } from '@/lib/schemas/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input with zod schema
    const parseResult = signupSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0].message },
        { status: 400 }
      )
    }

    const { email, password, name } = parseResult.data

    const supabase = await createClient()

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
      }
    })

    if (authError) {
      // Supabase Authのエラーメッセージを日本語化
      let errorMessage = authError.message;
      
      if (authError.message.includes('User already registered')) {
        errorMessage = 'このメールアドレスは既に登録されています。ログインしてください。';
      } else if (authError.message.includes('Password should be at least')) {
        errorMessage = 'パスワードは8文字以上で入力してください。';
      } else if (authError.message.includes('Invalid email')) {
        errorMessage = '有効なメールアドレスを入力してください。';
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    try {
      // ❶ Auth 作成済み
      // ❷ tenants のみ登録（trigger が usage_tokens 等を生成）
      const serviceSupabase = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      const { data: tenant, error: tenantError } = await serviceSupabase
        .from('tenants')
        .insert({
          auth_user_id: authData.user.id,
          name,
          email
        })
        .select()
        .single()

      if (tenantError) {
        // ロールバック: Auth ユーザーを削除
        await serviceSupabase.auth.admin.deleteUser(authData.user.id)
        
        // メールアドレス重複エラーをわかりやすく表示
        if (tenantError.code === '23505' && tenantError.message.includes('tenants_email_key')) {
          return NextResponse.json(
            { error: 'このメールアドレスは既に登録されています。ログインしてください。' },
            { status: 400 }
          )
        }
        
        return NextResponse.json(
          { error: tenantError.message },
          { status: 500 }
        )
      }

      // ❸ ここで usage_tokens を手動で作らない（トリガーが自動作成）
      return NextResponse.json(
        { 
          user: authData.user, 
          tenant, 
          message: 'Account created successfully' 
        },
        { status: 201 }
      )

    } catch (dbError) {
      console.error('Database error after user creation:', dbError)
      
      // ロールバック: Auth ユーザーを削除
      try {
        const serviceSupabase = createServiceClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
        await serviceSupabase.auth.admin.deleteUser(authData.user.id)
      } catch (cleanupError) {
        console.error('Failed to cleanup auth user:', cleanupError)
      }
      
      return NextResponse.json(
        { error: 'Account created but setup failed. Please contact support.' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}