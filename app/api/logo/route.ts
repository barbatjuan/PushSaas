import { NextRequest, NextResponse } from 'next/server';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const logoUrl = searchParams.get('url');
    const size = parseInt(searchParams.get('size') || '192');

    if (!logoUrl) {
      return NextResponse.json(
        { error: 'Logo URL is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Create a standardized logo with proper size and background
    const standardizedLogoSvg = `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="logo" patternUnits="userSpaceOnUse" width="${size}" height="${size}">
            <rect width="${size}" height="${size}" fill="#ffffff"/>
            <image href="${logoUrl}" x="16" y="16" width="${size - 32}" height="${size - 32}" preserveAspectRatio="xMidYMid meet"/>
          </pattern>
        </defs>
        <rect width="${size}" height="${size}" fill="url(#logo)" rx="16"/>
      </svg>
    `;

    return new NextResponse(standardizedLogoSvg, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      },
    });

  } catch (error) {
    console.error('❌ Logo processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process logo' },
      { status: 500, headers: corsHeaders }
    );
  }
}
