import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const apiKey = process.env.GOOGLE_VISION_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { error: 'Google Vision API key not configured' },
                { status: 500 }
            );
        }

        const formData = await req.formData();
        const file = formData.get('image') as File;

        if (!file) {
            return NextResponse.json(
                { error: 'No image provided' },
                { status: 400 }
            );
        }

        // Convert image to base64
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64Image = buffer.toString('base64');

        console.log('[VISION API] Processing image...');

        // Call Google Cloud Vision API
        const response = await fetch(
            `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    requests: [
                        {
                            image: {
                                content: base64Image,
                            },
                            features: [
                                {
                                    type: 'TEXT_DETECTION',
                                    maxResults: 10,
                                },
                            ],
                        },
                    ],
                }),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[VISION API] Error:', errorText);
            return NextResponse.json(
                { error: 'Google Vision API error', details: errorText },
                { status: response.status }
            );
        }

        const data = await response.json();
        const annotations = data.responses[0];

        if (!annotations || !annotations.textAnnotations || annotations.textAnnotations.length === 0) {
            console.log('[VISION API] No text detected');
            return NextResponse.json({
                text: '',
                confidence: 0,
                fullText: '',
            });
        }

        // First annotation is the full detected text
        const fullText = annotations.textAnnotations[0].description || '';

        // Calculate average confidence from all detections
        const totalConfidence = annotations.textAnnotations.reduce(
            (sum: number, ann: any) => sum + (ann.confidence || 1.0),
            0
        );
        const avgConfidence = (totalConfidence / annotations.textAnnotations.length) * 100;

        console.log('[VISION API] ✅ Text detected:', fullText);
        console.log('[VISION API] Confidence:', Math.round(avgConfidence), '%');

        return NextResponse.json({
            text: fullText,
            confidence: avgConfidence,
            fullText: fullText,
        });

    } catch (error: any) {
        console.error('[VISION API] ❌ Error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
