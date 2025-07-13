import { NextResponse } from 'next/server'
import { generateCSVTemplate } from '@/lib/csv-parser'

export async function GET() {
  try {
    const template = generateCSVTemplate()
    
    return new NextResponse(template, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="property_template.csv"',
      },
    })
  } catch (error) {
    console.error('Template generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate template' },
      { status: 500 }
    )
  }
}