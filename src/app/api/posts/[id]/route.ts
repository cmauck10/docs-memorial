import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

// GET single post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseClient();
    const { id } = await params;
    
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH update post
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseClient();
    const { id } = await params;
    const body = await request.json();
    const { guest_name, message, media_url, media_type, guest_token, is_hidden } = body;

    // Verify guest token matches (for non-admin updates)
    if (guest_token) {
      const { data: existingPost } = await supabase
        .from('posts')
        .select('guest_token')
        .eq('id', id)
        .single();

      if (existingPost?.guest_token !== guest_token) {
        return NextResponse.json(
          { error: 'Unauthorized to edit this post' },
          { status: 403 }
        );
      }
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    if (guest_name !== undefined) updateData.guest_name = guest_name.trim();
    if (message !== undefined) updateData.message = message.trim();
    if (media_url !== undefined) updateData.media_url = media_url;
    if (media_type !== undefined) updateData.media_type = media_type;
    if (is_hidden !== undefined) updateData.is_hidden = is_hidden;

    const { data, error } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseClient();
    const { id } = await params;
    
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
