import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json({ message: 'email and password are required' }, { status: 400 });
    }
    if (password.length < 6) {
        throw new Error('password must be at least 6 characters long');
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

  } catch (error: any) {
    if (error.message === 'password must be at least 6 characters long') {
        return NextResponse.json({ message: error.message }, { status: 400 });
    }
    console.error('registration error:', error);
    return NextResponse.json({ message: 'error registering user' }, { status: 500 });
  }
} 