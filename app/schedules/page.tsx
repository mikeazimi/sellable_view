'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { 
  Calendar, 
  Clock, 
  Mail, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  Play,
  Power,
  PowerOff,
  Filter,
  Plus,
  RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ScheduleFilters {
  warehouse?: string
  sellable: 'all' | 'sellable' | 'non-sellable'
  pickable: 'all' | 'pickable' | 'non-pickable'
  sku?: string
  location?: string
}

interface Schedule {
  id: string
  name: string
  customer_account_id: string
  customer_account_name?: string
  email: string
  days: string[]
  time: string
  enabled: boolean
  filter_warehouse: string | null
  filter_sellable: string
  filter_pickable: string
  filter_sku: string | null
  filter_location: string | null
  created_at: string
  updated_at: string
}

interface EditableSchedule extends Schedule {
  isEditing?: boolean
}

interface AccountId {
  id: string
  value: string
  name: string
}

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<EditableSchedule[]>([])
  const [accounts, setAccounts] = useState<AccountId[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  // Load accounts from localStorage
  useEffect(() => {
    const savedAccounts = localStorage.getItem('account_ids')
    if (savedAccounts) {
      setAccounts(JSON.parse(savedAccounts))
    }
  }, [])

  // Load schedules from Supabase
  useEffect(() => {
    loadSchedules()
  }, [])

  const loadSchedules = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/schedules')
      const data = await response.json()
      
      if (response.ok && data.success) {
        // Enrich schedules with account names
        const enrichedSchedules = data.schedules.map((schedule: Schedule) => {
          const account = accounts.find(acc => acc.value === schedule.customer_account_id)
          return {
            ...schedule,
            customer_account_name: account?.name || schedule.customer_account_id,
            isEditing: false
          }
        })
        setSchedules(enrichedSchedules)
        toast({
          title: 'Schedules Loaded',
          description: `Found ${data.schedules.length} scheduled jobs`,
        })
      } else {
        throw new Error(data.error || 'Failed to load schedules')
      }
    } catch (error: any) {
      console.error('❌ Failed to load schedules:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to load schedules',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleEdit = (scheduleId: string) => {
    setSchedules(schedules.map(s => 
      s.id === scheduleId ? { ...s, isEditing: !s.isEditing } : s
    ))
  }

  const updateSchedule = (scheduleId: string, field: string, value: any) => {
    setSchedules(schedules.map(s => 
      s.id === scheduleId ? { ...s, [field]: value } : s
    ))
  }

  const toggleDay = (scheduleId: string, day: string) => {
    setSchedules(schedules.map(s => {
      if (s.id === scheduleId) {
        const days = s.days.includes(day)
          ? s.days.filter(d => d !== day)
          : [...s.days, day]
        return { ...s, days }
      }
      return s
    }))
  }

  const saveSchedule = async (schedule: EditableSchedule) => {
    try {
      setSaving(true)
      
      const scheduleData = {
        id: schedule.id,
        name: schedule.name,
        customer_account_id: schedule.customer_account_id,
        email: schedule.email,
        days: schedule.days,
        time: schedule.time,
        enabled: schedule.enabled,
        filters: {
          warehouse: schedule.filter_warehouse || undefined,
          sellable: schedule.filter_sellable as any,
          pickable: schedule.filter_pickable as any,
          sku: schedule.filter_sku || undefined,
          location: schedule.filter_location || undefined,
        }
      }

      const response = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_account_id: schedule.customer_account_id,
          schedules: [scheduleData]
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          title: 'Schedule Saved',
          description: 'Schedule updated successfully',
        })
        toggleEdit(schedule.id)
        await loadSchedules() // Reload to get fresh data
      } else {
        throw new Error(data.error || 'Failed to save schedule')
      }
    } catch (error: any) {
      console.error('❌ Failed to save schedule:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to save schedule',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const deleteSchedule = async (scheduleId: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) {
      return
    }

    try {
      setSaving(true)
      const schedule = schedules.find(s => s.id === scheduleId)
      if (!schedule) return

      // Get all schedules for this account except the one we're deleting
      const remainingSchedules = schedules
        .filter(s => s.customer_account_id === schedule.customer_account_id && s.id !== scheduleId)
        .map(s => ({
          id: s.id,
          name: s.name,
          customer_account_id: s.customer_account_id,
          email: s.email,
          days: s.days,
          time: s.time,
          enabled: s.enabled,
          filters: {
            warehouse: s.filter_warehouse || undefined,
            sellable: s.filter_sellable as any,
            pickable: s.filter_pickable as any,
            sku: s.filter_sku || undefined,
            location: s.filter_location || undefined,
          }
        }))

      const response = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_account_id: schedule.customer_account_id,
          schedules: remainingSchedules
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          title: 'Schedule Deleted',
          description: 'Schedule removed successfully',
        })
        await loadSchedules()
      } else {
        throw new Error(data.error || 'Failed to delete schedule')
      }
    } catch (error: any) {
      console.error('❌ Failed to delete schedule:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete schedule',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const toggleEnabled = async (schedule: EditableSchedule) => {
    const updatedSchedule = { ...schedule, enabled: !schedule.enabled }
    await saveSchedule(updatedSchedule)
  }

  const runNow = async (schedule: Schedule) => {
    try {
      toast({
        title: 'Running Schedule',
        description: 'Starting inventory refresh and report generation...',
      })

      const response = await fetch('/api/scheduler/run-inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_account_id: schedule.customer_account_id,
          recipient_email: schedule.email,
          filter_warehouse: schedule.filter_warehouse,
          filter_sellable: schedule.filter_sellable,
          filter_pickable: schedule.filter_pickable,
          filter_sku: schedule.filter_sku,
          filter_location: schedule.filter_location,
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          title: 'Job Started',
          description: `Report will be emailed to ${schedule.email}`,
        })
      } else {
        throw new Error(data.error || 'Failed to run schedule')
      }
    } catch (error: any) {
      console.error('❌ Failed to run schedule:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to run schedule',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading schedules...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Scheduled Jobs</h1>
            <p className="text-gray-600 mt-1">
              Manage all automated inventory reports across accounts
            </p>
          </div>
          <Button onClick={loadSchedules} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-gray-900">{schedules.length}</div>
              <div className="text-sm text-gray-600">Total Schedules</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">
                {schedules.filter(s => s.enabled).length}
              </div>
              <div className="text-sm text-gray-600">Active</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-gray-400">
                {schedules.filter(s => !s.enabled).length}
              </div>
              <div className="text-sm text-gray-600">Disabled</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">
                {new Set(schedules.map(s => s.customer_account_id)).size}
              </div>
              <div className="text-sm text-gray-600">Accounts</div>
            </CardContent>
          </Card>
        </div>

        {/* Schedules List */}
        {schedules.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Schedules Yet</h3>
              <p className="text-gray-600 mb-4">
                Create schedules in Settings to automate inventory reports
              </p>
              <Button onClick={() => window.location.href = '/settings'}>
                <Plus className="w-4 h-4 mr-2" />
                Go to Settings
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {schedules.map((schedule) => (
              <Card key={schedule.id} className={cn(
                "relative",
                !schedule.enabled && "opacity-60"
              )}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {schedule.isEditing ? (
                        <Input
                          value={schedule.name}
                          onChange={(e) => updateSchedule(schedule.id, 'name', e.target.value)}
                          className="text-lg font-semibold mb-2"
                          placeholder="Schedule name"
                        />
                      ) : (
                        <CardTitle className="flex items-center gap-2">
                          {schedule.name}
                          {schedule.enabled ? (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                              Active
                            </span>
                          ) : (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                              Disabled
                            </span>
                          )}
                        </CardTitle>
                      )}
                      <CardDescription className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {schedule.email}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                          {schedule.customer_account_name || schedule.customer_account_id}
                        </span>
                      </CardDescription>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {schedule.isEditing ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => saveSchedule(schedule)}
                            disabled={saving}
                            className="bg-blue-600 text-white hover:bg-blue-700"
                          >
                            <Save className="w-4 h-4 mr-1" />
                            Save Changes
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleEdit(schedule.id)}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleEnabled(schedule)}
                            disabled={saving}
                            title={schedule.enabled ? "Disable schedule" : "Enable schedule"}
                          >
                            {schedule.enabled ? (
                              <>
                                <PowerOff className="w-4 h-4 mr-1" />
                                <span className="hidden sm:inline">Disable</span>
                              </>
                            ) : (
                              <>
                                <Power className="w-4 h-4 mr-1" />
                                <span className="hidden sm:inline">Enable</span>
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => runNow(schedule)}
                            title="Run this schedule now"
                            className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                          >
                            <Play className="w-4 h-4 mr-1" />
                            <span className="hidden sm:inline">Run Now</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleEdit(schedule.id)}
                            title="Edit schedule"
                          >
                            <Edit2 className="w-4 h-4 mr-1" />
                            <span className="hidden sm:inline">Edit</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteSchedule(schedule.id)}
                            disabled={saving}
                            title="Delete schedule"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            <span className="hidden sm:inline">Delete</span>
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Schedule Time */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-gray-600 mb-2 block">Days</Label>
                      {schedule.isEditing ? (
                        <div className="flex flex-wrap gap-2">
                          {daysOfWeek.map(day => (
                            <button
                              key={day}
                              onClick={() => toggleDay(schedule.id, day)}
                              className={cn(
                                "px-3 py-1 rounded-md text-sm font-medium transition-colors",
                                schedule.days.includes(day)
                                  ? "bg-blue-600 text-white"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              )}
                            >
                              {day}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium">
                            {schedule.days.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <Label className="text-xs text-gray-600 mb-2 block">Time</Label>
                      {schedule.isEditing ? (
                        <Input
                          type="time"
                          value={schedule.time}
                          onChange={(e) => updateSchedule(schedule.id, 'time', e.target.value)}
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium">{schedule.time}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  {schedule.isEditing && (
                    <div>
                      <Label className="text-xs text-gray-600 mb-2 block">Email</Label>
                      <Input
                        type="email"
                        value={schedule.email}
                        onChange={(e) => updateSchedule(schedule.id, 'email', e.target.value)}
                        placeholder="email@example.com"
                      />
                    </div>
                  )}

                  {/* Filters */}
                  <div>
                    <Label className="text-xs text-gray-600 mb-2 flex items-center gap-1">
                      <Filter className="w-3 h-3" />
                      Report Filters
                    </Label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {schedule.isEditing ? (
                        <>
                          <div>
                            <Label className="text-xs">Warehouse ID</Label>
                            <Input
                              value={schedule.filter_warehouse || ''}
                              onChange={(e) => updateSchedule(schedule.id, 'filter_warehouse', e.target.value || null)}
                              placeholder="Optional"
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Sellable</Label>
                            <Select
                              value={schedule.filter_sellable}
                              onValueChange={(value) => updateSchedule(schedule.id, 'filter_sellable', value)}
                            >
                              <SelectTrigger className="text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="sellable">Sellable</SelectItem>
                                <SelectItem value="non-sellable">Non-Sellable</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">Pickable</Label>
                            <Select
                              value={schedule.filter_pickable}
                              onValueChange={(value) => updateSchedule(schedule.id, 'filter_pickable', value)}
                            >
                              <SelectTrigger className="text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="pickable">Pickable</SelectItem>
                                <SelectItem value="non-pickable">Non-Pickable</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">SKU Contains</Label>
                            <Input
                              value={schedule.filter_sku || ''}
                              onChange={(e) => updateSchedule(schedule.id, 'filter_sku', e.target.value || null)}
                              placeholder="Optional"
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Location Contains</Label>
                            <Input
                              value={schedule.filter_location || ''}
                              onChange={(e) => updateSchedule(schedule.id, 'filter_location', e.target.value || null)}
                              placeholder="Optional"
                              className="text-sm"
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          {schedule.filter_warehouse && (
                            <div className="text-xs">
                              <div className="text-gray-600">Warehouse</div>
                              <div className="font-mono">{schedule.filter_warehouse}</div>
                            </div>
                          )}
                          {schedule.filter_sellable !== 'all' && (
                            <div className="text-xs">
                              <div className="text-gray-600">Sellable</div>
                              <div className="font-medium capitalize">{schedule.filter_sellable}</div>
                            </div>
                          )}
                          {schedule.filter_pickable !== 'all' && (
                            <div className="text-xs">
                              <div className="text-gray-600">Pickable</div>
                              <div className="font-medium capitalize">{schedule.filter_pickable}</div>
                            </div>
                          )}
                          {schedule.filter_sku && (
                            <div className="text-xs">
                              <div className="text-gray-600">SKU Filter</div>
                              <div className="font-mono">{schedule.filter_sku}</div>
                            </div>
                          )}
                          {schedule.filter_location && (
                            <div className="text-xs">
                              <div className="text-gray-600">Location Filter</div>
                              <div className="font-mono">{schedule.filter_location}</div>
                            </div>
                          )}
                          {!schedule.filter_warehouse && 
                           schedule.filter_sellable === 'all' && 
                           schedule.filter_pickable === 'all' && 
                           !schedule.filter_sku && 
                           !schedule.filter_location && (
                            <div className="text-xs text-gray-500 italic">No filters applied</div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="pt-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                    <div>
                      Created: {schedule.created_at ? new Date(schedule.created_at).toLocaleDateString() : 'N/A'}
                    </div>
                    <div>
                      Last updated: {schedule.updated_at ? new Date(schedule.updated_at).toLocaleString() : 'N/A'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

