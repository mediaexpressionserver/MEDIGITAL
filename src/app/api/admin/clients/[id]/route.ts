import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  try {
    const { data, error } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('supabase get error:', error);
      return NextResponse.json({ error: error.message || error }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (err: any) {
    console.error('GET /api/admin/clients/[id] error:', err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  let body: any = null;
  try {
    body = await req.json();
  } catch (err) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const allowed = [
    'client_name',
    'blog_title',
    'blog_slug',
    'blog_body_html',
    'cta_text',
    'images',
    'videos',
    'body_data',
    'blog_feature_image',
    'blog2_feature_image',
    'blog2_title',
    'blog2_slug',
    'blog2_body_html',
    'blog2_images',
    'blog2_videos',
    'logo_url',
  ];

  // Support legacy key
  if (Object.prototype.hasOwnProperty.call(body, 'feature_image') && !Object.prototype.hasOwnProperty.call(body, 'blog_feature_image')) {
    body.blog_feature_image = body.feature_image;
  }
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
      .from('clients')
      .update(updateObj)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      console.error('supabase update error:', error);
      return NextResponse.json({ error: error.message || error }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (err: any) {
    console.error('PATCH /api/admin/clients/[id] error:', err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  try {
    const { error } = await supabaseAdmin.from('clients').delete().eq('id', id);
    if (error) {
      console.error('supabase delete error:', error);
      return NextResponse.json({ error: error.message || error }, { status: 500 });
    }
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: any) {
    console.error('DELETE /api/admin/clients/[id] error:', err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}