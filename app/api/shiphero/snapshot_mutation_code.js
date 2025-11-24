// ShipHero Inventory Snapshot Mutation
// Filtered for customer account 88774 with has_inventory=true

const GENERATE_SNAPSHOT_MUTATION = `
  mutation GenerateInventorySnapshot(
    $customer_account_id: String
    $has_inventory: Boolean
    $new_format: Boolean
    $notification_email: String
  ) {
    inventory_generate_snapshot(
      data: {
        customer_account_id: $customer_account_id
        has_inventory: $has_inventory
        new_format: $new_format
        notification_email: $notification_email
      }
    ) {
      request_id
      complexity
      snapshot {
        snapshot_id
        job_user_id
        job_account_id
        warehouse_id
        customer_account_id
        notification_email
        email_error
        post_url
        post_error
        post_url_pre_check
        status
        error
        created_at
        enqueued_at
        updated_at
        snapshot_url
        snapshot_expiration
      }
    }
  }
`;

// Example usage with fetch
async function generateSnapshot() {
  const response = await fetch('https://public-api.shiphero.com/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${YOUR_SHIPHERO_TOKEN}`,
    },
    body: JSON.stringify({
      query: GENERATE_SNAPSHOT_MUTATION,
      variables: {
        customer_account_id: "Q3VzdG9tZXJBY2NvdW50Ojg4Nzc0", // Account ID for 88774
        has_inventory: true,
        new_format: true,
        notification_email: "your-email@example.com" // Replace with your email
      }
    })
  });

  const data = await response.json();
  console.log('Snapshot requested:', data);
  return data;
}

// Then poll for completion using this query:
const CHECK_SNAPSHOT_STATUS = `
  query GetSnapshotStatus($snapshot_id: String!) {
    inventory_snapshot(snapshot_id: $snapshot_id) {
      request_id
      complexity
      snapshot {
        snapshot_id
        status
        snapshot_url
        snapshot_expiration
        error
      }
    }
  }
`;

async function checkSnapshotStatus(snapshotId) {
  const response = await fetch('https://public-api.shiphero.com/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${YOUR_SHIPHERO_TOKEN}`,
    },
    body: JSON.stringify({
      query: CHECK_SNAPSHOT_STATUS,
      variables: {
        snapshot_id: snapshotId
      }
    })
  });

  const data = await response.json();
  return data.data.inventory_snapshot.snapshot;
}

// Complete workflow example
async function getInventorySnapshot() {
  // Step 1: Request the snapshot
  const generateResult = await generateSnapshot();
  const snapshotId = generateResult.data.inventory_generate_snapshot.snapshot.snapshot_id;
  
  console.log(`Snapshot ID: ${snapshotId}. Waiting for completion...`);
  
  // Step 2: Poll until ready (check every 30 seconds)
  let snapshot = null;
  let attempts = 0;
  const maxAttempts = 60; // 30 minutes max
  
  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds
    
    snapshot = await checkSnapshotStatus(snapshotId);
    
    if (snapshot.status === 'success') {
      console.log('Snapshot ready!');
      console.log('Download URL:', snapshot.snapshot_url);
      break;
    } else if (snapshot.status === 'error') {
      throw new Error(`Snapshot failed: ${snapshot.error}`);
    } else {
      console.log(`Status: ${snapshot.status}. Waiting...`);
      attempts++;
    }
  }
  
  if (snapshot.status !== 'success') {
    throw new Error('Snapshot timed out');
  }
  
  // Step 3: Download and parse the JSON
  const snapshotResponse = await fetch(snapshot.snapshot_url);
  const inventoryData = await snapshotResponse.json();
  
  console.log('Inventory data downloaded successfully!');
  return inventoryData;
}

// Export for use in your app
export { generateSnapshot, checkSnapshotStatus, getInventorySnapshot };
