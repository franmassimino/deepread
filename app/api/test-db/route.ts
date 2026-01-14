import { prisma } from '@/lib/db/db'
import { NextResponse } from 'next/server'

// Test route to verify Prisma setup
export async function GET() {
  try {
    // Test 1: Verify Prisma Client is importable
    if (!prisma) {
      return NextResponse.json({ error: 'Prisma client not initialized' }, { status: 500 })
    }

    // Test 2: Verify database connection
    const userCount = await prisma.user.count()

    return NextResponse.json({
      success: true,
      message: 'Prisma setup verified',
      tests: {
        clientImported: true,
        typesGenerated: true,
        dbConnection: true,
        userCount,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Prisma setup test failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
