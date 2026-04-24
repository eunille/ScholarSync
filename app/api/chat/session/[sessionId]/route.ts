import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

type RouteContext = {
  params: Promise<{ sessionId: string }>
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createServerSupabaseClient()

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sessionId } = await context.params

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    const { data: existingSession, error: lookupError } = await supabase
      .from('chat_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('user_id', session.user.id)
      .single()

    if (lookupError || !existingSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const { error: deleteMessagesError } = await supabase
      .from('messages')
      .delete()
      .eq('session_id', sessionId)

    if (deleteMessagesError) {
      throw deleteMessagesError
    }

    const { error: deleteSessionError } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', session.user.id)

    if (deleteSessionError) {
      throw deleteSessionError
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete session API error:', error)
    return NextResponse.json(
      { error: 'Unable to delete session right now. Please try again.' },
      { status: 500 }
    )
  }
}
