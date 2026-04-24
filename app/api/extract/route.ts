import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
const MAX_EXTRACTED_TEXT_LENGTH = 12000

function truncateText(text: string) {
  if (text.length <= MAX_EXTRACTED_TEXT_LENGTH) {
    return text
  }

  return text.slice(0, MAX_EXTRACTED_TEXT_LENGTH)
}

async function parsePdf(buffer: Buffer) {
  try {
    const pdfParseModule = await import('pdf-parse')
    const pdfParse = pdfParseModule.default as (input: Buffer) => Promise<{ text?: string }>
    const parsed = await pdfParse(buffer)
    return parsed.text ?? ''
  } catch {
    throw new Error('PDF parsing dependency missing')
  }
}

async function parseDocx(buffer: Buffer) {
  try {
    const mammothModule = await import('mammoth')
    const extractRawText = mammothModule.extractRawText as (options: {
      buffer: Buffer
    }) => Promise<{ value?: string }>
    const result = await extractRawText({ buffer })
    return result.value ?? ''
  } catch {
    throw new Error('DOCX parsing dependency missing')
  }
}

function parsePlainText(buffer: Buffer) {
  return buffer.toString('utf8')
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.size === 0) {
      return NextResponse.json({ error: 'Uploaded file is empty' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'File is too large. Maximum allowed size is 5MB.' },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const fileName = file.name.toLowerCase()

    let extracted = ''

    if (fileName.endsWith('.pdf')) {
      extracted = await parsePdf(buffer)
    } else if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
      extracted = await parseDocx(buffer)
    } else if (fileName.endsWith('.txt') || fileName.endsWith('.md')) {
      extracted = parsePlainText(buffer)
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type. Use PDF, DOC, DOCX, TXT, or MD.' },
        { status: 400 }
      )
    }

    const cleanedText = truncateText(extracted.replace(/\s+/g, ' ').trim())

    if (!cleanedText) {
      return NextResponse.json(
        { error: 'Could not extract readable text from this file.' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      fileName: file.name,
      extractedText: cleanedText,
      truncated: extracted.length > MAX_EXTRACTED_TEXT_LENGTH,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Extraction failed'

    if (message.includes('dependency missing')) {
      return NextResponse.json(
        {
          error:
            'File parser dependencies are missing. Install pdf-parse and mammoth, then restart the server.',
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Unable to extract file content right now. Please try another file.' },
      { status: 500 }
    )
  }
}
