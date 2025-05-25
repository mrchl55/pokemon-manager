import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json({ message: 'email and password are required' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ message: 'password must be at least 6 characters long' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email }
    });

    if (existingUser) {
      return NextResponse.json({ message: 'user with this email already exists' }, { status: 409 }); 
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        name: name || email, 
        password: hashedPassword,
      },
      select: { 
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    });

    return NextResponse.json({ message: 'user registered successfully', user }, { status: 201 });

  } catch (error: unknown) {
    console.error('registration error:', error);
    return NextResponse.json({ message: 'error registering user' }, { status: 500 });
  }
} 