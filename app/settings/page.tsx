'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Clock, Calendar, Plus, Trash2, Save, Play, Filter } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface ScheduleFilters {
  warehouse?: string
  sellable: 'all' | 'sellable' | 'non-sellable'
  pickable: 'all' | 'pickable' | 'non-pickable'
  sku?: string
  location?: string
}

interface ScheduleItem {
  id: string
  days: string[]
  time: string
  enabled: boolean
  email: string
  name?: string
  filters: ScheduleFilters
}

interface AccountId {
  id: string
  value: string
  name: string
}

export default function SettingsPage() {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([])
  const [accountIds, setAccountIds] = useState<AccountId[]>([])
  const [newAccountId, setNewAccountId] = useState('')
  const [newAccountName, setNewAccountName] = useState('')
  const [selectedAccountId, setSelectedAccountId] = useState<string>('')
  
  const { toast } = useToast()

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  useEffect(() => {
    // Load accounts from localStorage
    const savedAccounts = localStorage.getItem('account_ids')
    const savedSelectedAccount = localStorage.getItem('selected_account_id')
    
    if (savedAccounts) {
      const accounts = JSON.parse(savedAccounts)
      setAccountIds(accounts)
      setSelectedAccountId(savedSelectedAccount || accounts[0]?.value || '88774')
    } else {
      const defaultAccount = {
        id: '1',
        value: '88774',
        name: 'Donni HQ'
      }
      setAccountIds([defaultAccount])
      setSelectedAccountId('88774')
    }

    // Load schedules from Supabase
    loadSchedulesFromSupabase()
  }, [])

  const loadSchedulesFromSupabase = async () => {
    try {
      const response = await fetch('/api/schedules')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.schedules) {
          setSchedules(data.schedules)
        }
      }
    } catch (error) {
      console.error('Failed to load schedules:', error)
    }
  }

  const handleSaveSchedules = async () => {
    try {
      const response = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schedules: schedules.map(s => ({
            ...s,
            customer_account_id: selectedAccountId,
            name: `${s.days.join(', ')} at ${s.time}`
          }))
        })
      })

      if (response.ok) {
        toast({
          title: 'Schedules saved',
          description: 'Your refresh schedules have been saved to the database',
        })
        // Reload to get IDs from database
        await loadSchedulesFromSupabase()
      } else {
        throw new Error('Failed to save schedules')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save schedules',
        variant: 'destructive',
      })
    }
  }

  const handleAddSchedule = () => {
    const newSchedule: ScheduleItem = {
      id: `temp_${Date.now()}`,
      days: [],
      time: '09:00',
      enabled: true,
      email: '',
      filters: {
        sellable: 'all',
        pickable: 'all'
      }
    }
    setSchedules([...schedules, newSchedule])
  }

  const handleRemoveSchedule = (id: string) => {
    setSchedules(schedules.filter(s => s.id !== id))
  }

  const handleToggleDay = (scheduleId: string, day: string) => {
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

  const handleUpdateTime = (scheduleId: string, time: string) => {
    setSchedules(schedules.map(s => 
      s.id === scheduleId ? { ...s, time } : s
    ))
  }

  const handleUpdateEmail = (scheduleId: string, email: string) => {
    setSchedules(schedules.map(s => 
      s.id === scheduleId ? { ...s, email } : s
    ))
  }

  const handleUpdateFilter = (scheduleId: string, filterKey: keyof ScheduleFilters, value: any) => {
    setSchedules(schedules.map(s => {
      if (s.id === scheduleId) {
        return {
          ...s,
          filters: {
            ...s.filters,
            [filterKey]: value
          }
        }
      }
      return s
    }))
  }

  const handleSelectAccount = (accountValue: string) => {
    setSelectedAccountId(accountValue)
    localStorage.setItem('selected_account_id', accountValue)
    toast({
      title: 'Account selected',
      description: 'This account will be used for inventory queries',
    })
  }

  const handleAddAccountId = () => {
    if (!newAccountId || !newAccountName) {
      toast({
        title: 'Error',
        description: 'Please enter both Account ID and Name',
        variant: 'destructive',
      })
      return
    }

    const newAccount: AccountId = {
      id: Date.now().toString(),
      value: newAccountId,
      name: newAccountName
    }
    
    const updated = [...accountIds, newAccount]
    setAccountIds(updated)
    localStorage.setItem('account_ids', JSON.stringify(updated))
    
    // If this is the first account, select it
    if (updated.length === 1) {
      handleSelectAccount(newAccountId)
    }
    
    setNewAccountId('')
    setNewAccountName('')
    
    toast({
      title: 'Account added',
      description: `${newAccountName} (${newAccountId}) has been added`,
    })
  }

  const handleRemoveAccountId = (id: string) => {
    const updated = accountIds.filter(a => a.id !== id)
    setAccountIds(updated)
    localStorage.setItem('account_ids', JSON.stringify(updated))
    
    toast({
      title: 'Account removed',
      description: 'Account ID has been removed',
    })
  }

  const handleRunNow = async (schedule: ScheduleItem) => {
    if (!schedule.email) {
      toast({
        title: 'Error',
        description: 'Please add an email address to this schedule',
        variant: 'destructive',
      })
      return
    }

    if (schedule.days.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one day for this schedule',
        variant: 'destructive',
      })
      return
    }

    toast({
      title: 'Starting inventory query...',
      description: 'This may take several minutes. The report will be emailed when complete.',
    })

    try {
      // Use the selected account ID
      const customerAccountId = selectedAccountId || accountIds[0]?.value || '88774'
      
      // Get auth token
      const token = localStorage.getItem('shiphero_access_token')
      if (!token) {
        throw new Error('Not authenticated. Please login first.')
      }

      const response = await fetch('/api/scheduler/run-inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          customerAccountId,
          email: schedule.email,
          scheduleName: `Manual Run - ${schedule.time} ${schedule.days.join(', ')}`,
          filters: schedule.filters
        })
      })

      if (!response.ok) {
        throw new Error('Scheduler failed')
      }

      const result = await response.json()
      
      toast({
        title: 'Success!',
        description: `Report sent to ${schedule.email}. ${result.itemsProcessed} items processed.`,
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to run scheduler',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Settings
        </h1>
        <p className="text-gray-500">
          Configure automatic refresh schedules and manage account IDs
        </p>
      </div>

      {/* Account ID Management */}
      <Card className="mb-6 border border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Save className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-xl text-gray-900">Customer Account IDs</CardTitle>
              <CardDescription className="text-gray-500">
                Manage customer account IDs that will appear as filters on the inventory page
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 bg-white">
          {/* Current Account IDs */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Current Accounts</Label>
            <div className="space-y-2">
              {accountIds.map((account) => {
                const isSelected = account.value === selectedAccountId
                return (
                  <div
                    key={account.id}
                    onClick={() => handleSelectAccount(account.value)}
                    className={`
                      flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all
                      ${isSelected 
                        ? 'border-blue-500 bg-blue-50 shadow-sm' 
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-5 h-5 rounded-full border-2 flex items-center justify-center
                        ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}
                      `}>
                        {isSelected && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                      <div>
                        <p className={`font-semibold ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                          {account.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          Account ID: {account.value}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isSelected && (
                        <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded">
                          ACTIVE
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveAccountId(account.id)
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Add New Account */}
          <div className="border-t border-gray-200 pt-4 space-y-3">
            <Label className="text-sm font-medium text-gray-700">Add New Account</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Input
                  placeholder="Account ID (e.g., 88774)"
                  value={newAccountId}
                  onChange={(e) => setNewAccountId(e.target.value)}
                  className="border-gray-300 bg-white"
                />
              </div>
              <div>
                <Input
                  placeholder="Account Name (e.g., Donni HQ)"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  className="border-gray-300 bg-white"
                />
              </div>
            </div>
            <Button
              onClick={handleAddAccountId}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Refresh Scheduler */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-100 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl text-gray-900">Automatic Refresh Scheduler</CardTitle>
                <CardDescription className="text-gray-500">
                  Schedule automatic ShipHero inventory refreshes. When complete, Supabase will be updated.
                </CardDescription>
              </div>
            </div>
            <Button onClick={handleAddSchedule} size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Schedule
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 bg-white">
          {schedules.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No schedules configured. Click "Add Schedule" to create one.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="p-4 border border-gray-200 rounded-lg space-y-3 bg-gray-50"
                >
                  {/* Days of Week */}
                  <div>
                    <Label className="text-sm mb-2 block text-gray-700 font-medium">Days</Label>
                    <div className="flex gap-2">
                      {daysOfWeek.map((day) => (
                        <Button
                          key={day}
                          variant={schedule.days.includes(day) ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleToggleDay(schedule.id, day)}
                          className={`w-12 ${
                            schedule.days.includes(day)
                              ? 'bg-blue-600 hover:bg-blue-700 border-blue-600'
                              : 'border-gray-300 hover:bg-gray-100'
                          }`}
                        >
                          {day}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Time and Email */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <Label className="text-sm mb-2 block text-gray-700 font-medium">Time</Label>
                      <Input
                        type="time"
                        value={schedule.time}
                        onChange={(e) => handleUpdateTime(schedule.id, e.target.value)}
                        className="border-gray-300 bg-white"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-sm mb-2 block text-gray-700 font-medium">Email Address</Label>
                      <Input
                        type="email"
                        placeholder="report@example.com"
                        value={schedule.email}
                        onChange={(e) => handleUpdateEmail(schedule.id, e.target.value)}
                        className="border-gray-300 bg-white"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveSchedule(schedule.id)}
                      className="mt-6 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>

                  {/* Filters */}
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex items-center gap-2 mb-3">
                      <Filter className="w-4 h-4 text-gray-500" />
                      <Label className="text-sm font-medium text-gray-700">Report Filters (Optional)</Label>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs text-gray-600 mb-1 block">Warehouse</Label>
                        <Input
                          placeholder="All warehouses"
                          value={schedule.filters?.warehouse || ''}
                          onChange={(e) => handleUpdateFilter(schedule.id, 'warehouse', e.target.value || undefined)}
                          className="border-gray-300 bg-white text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-600 mb-1 block">Sellable</Label>
                        <Select
                          value={schedule.filters?.sellable || 'all'}
                          onValueChange={(value) => handleUpdateFilter(schedule.id, 'sellable', value)}
                        >
                          <SelectTrigger className="border-gray-300 bg-white text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="sellable">Sellable Only</SelectItem>
                            <SelectItem value="non-sellable">Non-Sellable Only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-600 mb-1 block">Pickable</Label>
                        <Select
                          value={schedule.filters?.pickable || 'all'}
                          onValueChange={(value) => handleUpdateFilter(schedule.id, 'pickable', value)}
                        >
                          <SelectTrigger className="border-gray-300 bg-white text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="pickable">Pickable Only</SelectItem>
                            <SelectItem value="non-pickable">Non-Pickable Only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div>
                        <Label className="text-xs text-gray-600 mb-1 block">SKU Filter</Label>
                        <Input
                          placeholder="Filter by SKU"
                          value={schedule.filters?.sku || ''}
                          onChange={(e) => handleUpdateFilter(schedule.id, 'sku', e.target.value || undefined)}
                          className="border-gray-300 bg-white text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-600 mb-1 block">Location Filter</Label>
                        <Input
                          placeholder="Filter by location"
                          value={schedule.filters?.location || ''}
                          onChange={(e) => handleUpdateFilter(schedule.id, 'location', e.target.value || undefined)}
                          className="border-gray-300 bg-white text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Schedule Summary and Test Button */}
                  <div className="flex items-center justify-between bg-white rounded p-3 border border-gray-200">
                    {schedule.days.length > 0 && (
                      <p className="text-sm text-gray-600">
                        Runs every {schedule.days.join(', ')} at {schedule.time}
                        {schedule.email && ` • Report sent to ${schedule.email}`}
                      </p>
                    )}
                    {schedule.email && schedule.days.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRunNow(schedule)}
                        className="border-blue-500 text-blue-600 hover:bg-blue-50"
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Run Now
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {schedules.length > 0 && (
            <Button
              onClick={handleSaveSchedules}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Save All Schedules
            </Button>
          )}

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Note:</strong> Scheduled refreshes will query ShipHero, update Supabase, and email a CSV + PDF report to the specified email address.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
