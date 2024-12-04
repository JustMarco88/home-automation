import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Environment metrics endpoint' });
}

export async function POST() {
  return NextResponse.json({ message: 'Environment data received' });
} 