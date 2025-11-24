# ShipHero API Pagination Optimization Analysis

## Credit Limit Problem

**Error:** Query requires 5,101 credits, max allowed is 4,004 credits per operation

## Complexity Calculation

ShipHero's complexity is roughly calculated as:
```
Complexity ≈ Products × Locations per Product
```

## Previous Configuration (FAILED)
- **Products per page:** 100
- **Locations per product:** 50
- **Complexity:** ~5,000 credits
- **Result:** ❌ EXCEEDED LIMIT (5,101 > 4,004)

## Optimal Configuration (IMPLEMENTED)

### Batch Sizes:
- **Products per page:** 50
- **Locations per product:** 30  
- **Complexity:** ~1,500 credits per page ✅
- **Buffer:** 2,500 credits safety margin

### Pause Strategy:
- **Between pages:** 1 second (prevents rate limiting)
- **Every 5th page:** 3 seconds (credit conservation)
- **Every 10th page:** Already covered by 5th page logic

## Performance Estimates

### Scenario 1: All Locations (No Filters)
- **Total products:** ~2,000
- **Pages needed:** ~40 pages
- **Time estimate:** ~45-60 seconds
  - 35 pages × 1s = 35s
  - 5 pauses × 3s = 15s
  - Processing time = ~10s
- **Credits per page:** ~1,500
- **Total credits:** ~60,000 (distributed across time)

### Scenario 2: Non-Sellable Only (Filtered)
- **Total products:** ~2,000
- **Non-sellable locations:** ~20% (client-side filter)
- **Pages needed:** ~40 pages (same fetch)
- **Records returned:** ~400 records
- **Time:** ~45-60 seconds (same fetch, but filtered)
- **Note:** Client-side filtering doesn't reduce fetch time, but reduces data displayed

### Scenario 3: Specific SKU Search (Future)
- **Products matching SKU:** ~1-10
- **Pages needed:** 1 page
- **Time:** ~2 seconds
- **Credits:** ~1,500

## Optimization Benefits

### Credit Management:
✅ Stays under 4,004 limit per page
✅ 1,500 credits leaves 2,500 buffer
✅ Safe from "not enough credits" errors

### Speed vs Safety:
✅ 1s between pages = good throughput
✅ 3s every 5 pages = credit recovery time
✅ Progressive loading = user sees data immediately

### User Experience:
✅ Data appears within 2-3 seconds (first page)
✅ Table updates continuously
✅ Loading indicator shows progress
✅ No timeouts or errors

## Trade-offs

**Smaller batches means:**
- ✅ More pages to fetch for complete data
- ✅ But never hits credit limit
- ✅ And never times out backend
- ✅ Progressive UX is better anyway

**Client-side filtering means:**
- ✅ Still fetches all data even if filtering
- ✅ But users can change filters instantly without re-fetching
- ✅ And we avoid complex API filter arguments that don't exist

## Recommended Settings (Current Implementation)

```javascript
// Backend
data(first: 50, after: $cursor)      // 50 products per page
locations(first: 30)                  // 30 locations per product

// Frontend
pageDelay = 1000ms                    // 1s between pages
extendedDelay = 3000ms                // 3s every 5 pages
maxPages = 200                        // Safety limit
```

## Future Optimizations

1. **Add SKU search:** Fetch only specific SKUs (1 page, instant)
2. **Cache results:** Store for 5 minutes to avoid re-fetching
3. **Virtual scrolling:** Only render visible rows (performance)
4. **Background refresh:** Auto-update data every 10 minutes

## Summary

Current configuration balances:
- ✅ Credit limits (1,500 < 4,004)
- ✅ User experience (progressive loading)
- ✅ Speed (data appears quickly)
- ✅ Reliability (no timeouts or errors)

**This is the optimal configuration for ShipHero's API limits.**

