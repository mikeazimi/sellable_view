import { NextRequest, NextResponse } from "next/server";

/**
 * Snapshot Test API - Handles all snapshot operations
 * Actions: create, status, abort, download
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get("action")
    const authHeader = request.headers.get('authorization')
    const accessToken = authHeader?.replace('Bearer ', '')

    if (!accessToken) {
      return NextResponse.json({ 
        success: false, 
        error: "Authorization required" 
      }, { status: 401 });
    }

    // CREATE SNAPSHOT
    if (action === 'create') {
      const customerAccountId = searchParams.get("customer_account_id")
      const email = searchParams.get("email")

      if (!customerAccountId || !email) {
        return NextResponse.json({
          success: false,
          error: "customer_account_id and email required"
        }, { status: 400 });
      }

      const mutation = `
        mutation CreateInventorySnapshot($customer_account_id: String!, $email: String!) {
          inventory_snapshot_create(
            data: {
              customer_account_id: $customer_account_id
              email: $email
              has_inventory: true
              new_format: true
            }
          ) {
            request_id
            complexity
            snapshot_id
          }
        }
      `

      const variables = {
        customer_account_id: customerAccountId,
        email
      }

      console.log('🚀 Creating snapshot...')

      const response = await fetch('https://public-api.shiphero.com/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ query: mutation, variables })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const result = await response.json()

      if (result.errors) {
        throw new Error(result.errors[0].message)
      }

      const data = result.data?.inventory_snapshot_create
      console.log(`✅ Snapshot created: ${data.snapshot_id}`)

      return NextResponse.json({
        success: true,
        snapshot_id: data.snapshot_id,
        request_id: data.request_id,
        complexity: data.complexity
      });
    }

    // CHECK STATUS
    if (action === 'status') {
      const snapshotId = searchParams.get("snapshot_id")

      if (!snapshotId) {
        return NextResponse.json({
          success: false,
          error: "snapshot_id required"
        }, { status: 400 });
      }

      const query = `
        query GetInventorySnapshot($snapshot_id: String!) {
          inventory_snapshot(snapshot_id: $snapshot_id) {
            request_id
            complexity
            data {
              snapshot_id
              link
              status
              error
              created_date
            }
          }
        }
      `

      const variables = { snapshot_id: snapshotId }

      console.log(`📊 Checking status for ${snapshotId}...`)

      const response = await fetch('https://public-api.shiphero.com/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ query, variables })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const result = await response.json()

      if (result.errors) {
        throw new Error(result.errors[0].message)
      }

      const snapshot = result.data?.inventory_snapshot?.data
      console.log(`   Status: ${snapshot.status}`)
      
      return NextResponse.json({
        success: true,
        snapshot_id: snapshot.snapshot_id,
        link: snapshot.link,
        status: snapshot.status,
        error: snapshot.error,
        created_date: snapshot.created_date
      });
    }

    // ABORT SNAPSHOT
    if (action === 'abort') {
      const snapshotId = searchParams.get("snapshot_id")

      if (!snapshotId) {
        return NextResponse.json({
          success: false,
          error: "snapshot_id required"
        }, { status: 400 });
      }

      const mutation = `
        mutation AbortInventorySnapshot($snapshot_id: String!) {
          inventory_abort_snapshot(data: { snapshot_id: $snapshot_id }) {
            request_id
            complexity
          }
        }
      `

      const variables = { snapshot_id: snapshotId }

      console.log(`🛑 Aborting snapshot ${snapshotId}...`)

      const response = await fetch('https://public-api.shiphero.com/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ query: mutation, variables })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const result = await response.json()

      if (result.errors) {
        const error = result.errors[0]
        // Error code 9 = snapshot already processing
        if (error.code === 9) {
          console.log(`❌ Cannot abort: ${error.message}`)
          return NextResponse.json({
            success: false,
            error: error.message,
            code: 9
          }, { status: 400 });
        }
        throw new Error(error.message)
      }

      const data = result.data?.inventory_abort_snapshot
      console.log(`✅ Snapshot aborted`)

      return NextResponse.json({
        success: true,
        request_id: data.request_id,
        complexity: data.complexity
      });
    }

    // DOWNLOAD SNAPSHOT
    if (action === 'download') {
      const url = searchParams.get("url")

      if (!url) {
        return NextResponse.json({
          success: false,
          error: "url required"
        }, { status: 400 });
      }

      console.log(`📥 Downloading snapshot from ${url.substring(0, 50)}...`)

      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Failed to download: ${response.status}`)
      }

      const data = await response.json()
      console.log(`✅ Downloaded ${Object.keys(data).length} keys`)

      return NextResponse.json({
        success: true,
        data
      });
    }

    return NextResponse.json({
      success: false,
      error: "Invalid action. Use: create, status, abort, or download"
    }, { status: 400 });

  } catch (error: any) {
    console.error("❌ Snapshot test error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

