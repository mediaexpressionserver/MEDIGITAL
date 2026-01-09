import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  try {
    const { data, error } = await supabaseAdmin
      .from('clients_blog2')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('supabase get error (clients_blog2):', error);
      return NextResponse.json({ error: error.message || error }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (err: any) {
    console.error('GET /api/admin/clients_blog2/[id] error:', err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  let body: any = null;
  try {
    body = await req.json();
  } catch (err) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const allowed = [
    'client_name',
    'blog2_title',
    'blog2_slug',
    'blog2_body_html',
    'blog2_images',
    'blog2_videos',
    'blog2_feature_image',
    'logo_url',
  ];

  // Support legacy keys
  if (Object.prototype.hasOwnProperty.call(body, 'feature_image') && !Object.prototype.hasOwnProperty.call(body, 'blog2_feature_image')) {
    body.blog2_feature_image = body.feature_image;
  }

  const updateObj: Record<string, any> = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      updateObj[key] = body[key];
    }
  }

  if (Object.keys(updateObj).length === 0) {
    return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('clients_blog2')
      .update(updateObj)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      console.error('supabase update error (clients_blog2):', error);
      return NextResponse.json({ error: error.message || error }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (err: any) {
    console.error('PATCH /api/admin/clients_blog2/[id] error:', err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  try {
    const { error } = await supabaseAdmin.from('clients_blog2').delete().eq('id', id);
    if (error) {
      console.error('supabase delete error (clients_blog2):', error);
      return NextResponse.json({ error: error.message || error }, { status: 500 });
    }
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: any) {
    console.error('DELETE /api/admin/clients_blog2/[id] error:', err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}