import { NextRequest, NextResponse } from "next/server";

/**
 * Email Report API - Sends CSV + PDF inventory reports via email
 * Uses Resend (recommended) or SendGrid
 */

interface EmailReportRequest {
  email: string
  inventory: any[]
  customerAccountId: string
  scheduleName: string
}

// Helper: Convert inventory to CSV
function generateCSV(inventory: any[]): string {
  // Use ShipHero-compatible headers
  const headers = [
    'Item',
    'Sku',
    'Warehouse',
    'Client',
    'Location',
    'Type',
    'Units',
    'Active Item',
    'Pickable',
    'Sellable',
    'Active Lot',
    'Lot Name',
    'Exp Date',
    'Days to Expire',
    'Creation Date',
    'unique id'
  ]

  const rows = inventory.map(item => [
    item.productName || '',
    item.sku || '',
    item.warehouse || '',
    '', // Client (empty)
    item.location || '',
    item.type || '',
    item.quantity?.toString() || '0',
    'Active', // Active Item
    item.pickable ? 'TRUE' : 'FALSE',
    item.sellable ? 'TRUE' : 'FALSE',
    '', // Active Lot
    '', // Lot Name
    '', // Exp Date
    '', // Days to Expire
    '', // Creation Date
    `${item.sku}-${item.location}` // unique id
  ])

  return [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')
}

// Helper: Generate simple PDF (HTML to PDF would require a library like Puppeteer)
// For now, we'll just send CSV. PDF generation requires additional setup.
function generatePDFPlaceholder(): string {
  return `PDF generation requires additional setup with libraries like:
- @react-pdf/renderer
- puppeteer
- jsPDF

For now, please use the CSV attachment for your inventory report.`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, inventory, customerAccountId, scheduleName } = body as EmailReportRequest

    if (!email || !inventory || !customerAccountId) {
      return NextResponse.json(
        { success: false, error: 'email, inventory, and customerAccountId are required' },
        { status: 400 }
      )
    }

    console.log(`📧 [EMAIL] Preparing report for ${email}`)
    console.log(`📊 [EMAIL] ${inventory.length} items to export`)

    // Generate CSV
    const csvContent = generateCSV(inventory)
    const csvBuffer = Buffer.from(csvContent, 'utf-8')
    const csvBase64 = csvBuffer.toString('base64')

    // Generate timestamp for filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    const filename = `InventoryReport_${customerAccountId}_${timestamp}.csv`

    // Check if Resend API key is configured
    const resendApiKey = process.env.RESEND_API_KEY

    if (!resendApiKey) {
      console.warn(`⚠️ [EMAIL] No RESEND_API_KEY found in environment variables`)
      console.log(`📄 [EMAIL] CSV generated (${inventory.length} rows) but email not sent`)
      
      // Return the CSV as a downloadable response instead
      return NextResponse.json({
        success: true,
        message: 'Email service not configured. CSV generated successfully.',
        csvData: csvContent,
        filename,
        itemCount: inventory.length,
        warning: 'Please configure RESEND_API_KEY in environment variables to enable email delivery'
      })
    }

    // Send email using Resend
    console.log(`📤 [EMAIL] Sending via Resend...`)

    const emailPayload = {
      from: 'Inventory Reports <onboarding@resend.dev>', // Update with your verified domain
      to: email,
      subject: `${scheduleName} - ${new Date().toLocaleDateString()}`,
      html: `
        <h2>${scheduleName}</h2>
        <p>Your scheduled inventory report is ready!</p>
        
        <h3>Summary:</h3>
        <ul>
          <li><strong>Customer Account:</strong> ${customerAccountId}</li>
          <li><strong>Total Items:</strong> ${inventory.length.toLocaleString()}</li>
          <li><strong>Generated:</strong> ${new Date().toLocaleString()}</li>
        </ul>
        
        <p>Please find your inventory report attached as a CSV file.</p>
        
        <p style="color: #666; font-size: 0.9em; margin-top: 2em;">
          This is an automated report from your Sellable View inventory system.
        </p>
      `,
      attachments: [
        {
          filename,
          content: csvBase64
        }
      ]
    }

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    })

    if (!resendResponse.ok) {
      const errorData = await resendResponse.json()
      throw new Error(`Resend API error: ${JSON.stringify(errorData)}`)
    }

    const resendData = await resendResponse.json()
    console.log(`✅ [EMAIL] Sent successfully! Email ID: ${resendData.id}`)

    return NextResponse.json({
      success: true,
      message: `Report emailed successfully to ${email}`,
      emailId: resendData.id,
      itemCount: inventory.length,
      filename
    })

  } catch (error: any) {
    console.error(`❌ [EMAIL] Error:`, error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to send email'
      },
      { status: 500 }
    )
  }
}

