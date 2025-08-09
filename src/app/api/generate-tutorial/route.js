import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { repo_url } = await request.json();
    try {
      const response = await fetch('http://localhost:8000/tutorial/get-tutorial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo_url }),
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json({
          success: true,
          data,
        });
      }
    } catch (err) {
      console.warn(' API call threw an error:', err.message);
    }
    return NextResponse.json({
      success: false,
    });

  } catch (error) {
    console.error('Unexpected API Route Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
