import { NextRequest, NextResponse } from 'next/server';
import { extractTransactionWithAgent } from '@/lib/geminiAgent';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    let imageBase64: string | undefined;
    let mimeType: string | undefined;
    let textPrompt: string | undefined;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      textPrompt = (formData.get('textPrompt') as string) || undefined;

      if (file) {
        mimeType = file.type;
        const bytes = await file.arrayBuffer();
        imageBase64 = Buffer.from(bytes).toString('base64');
      }
    } else {
      const body = await req.json();
      imageBase64 = body.imageBase64;
      mimeType = body.mimeType || 'image/jpeg';
      textPrompt = body.textPrompt;
    }

    if (!imageBase64 && !textPrompt) {
      return NextResponse.json(
        { error: 'Please provide either an image file/base64 or text notes.' },
        { status: 400 }
      );
    }

    const extraction = await extractTransactionWithAgent({
      imageBase64,
      mimeType,
      textPrompt,
    });

    return NextResponse.json({ success: true, data: extraction });
  } catch (error: any) {
    console.error('Extraction API error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process document' },
      { status: 500 }
    );
  }
}

