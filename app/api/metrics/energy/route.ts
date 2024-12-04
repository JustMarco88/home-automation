import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Energy metrics endpoint' });
}

export async function POST() {
  return NextResponse.json({ message: 'Energy metrics data received' });
} 