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
    const { guest_name, message, media, guest_token, is_hidden } = body;

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
    if (media !== undefined) updateData.media = media;
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
    
    // First, get the post to find associated media
    const { data: post } = await supabase
      .from('posts')
      .select('media')
      .eq('id', id)
      .single();

    // Delete media files from storage
    if (post?.media && post.media.length > 0) {
      const filePaths = post.media
        .map((item: { url: string }) => {
          // Extract file path from URL
          const match = item.url.match(/\/media\/(.+)$/);
          return match ? match[1] : null;
        })
        .filter(Boolean);

      if (filePaths.length > 0) {
        await supabase.storage.from('media').remove(filePaths);
      }
    }

    // Delete the post
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
