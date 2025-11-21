import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to inventory page since we don't have a dashboard
    router.replace('/inventory')
  }, [router])

  return null
}
