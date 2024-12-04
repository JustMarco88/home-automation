import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Automation actions endpoint' });
}

export async function POST() {
  return NextResponse.json({ message: 'Action triggered' });
} 