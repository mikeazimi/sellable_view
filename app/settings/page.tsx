'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Clock, Calendar, Plus, Trash2, Save } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ScheduleItem {
  id: string
  days: string[]
  time: string
  enabled: boolean
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
  
  const { toast } = useToast()

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  useEffect(() => {
    // Load saved schedules and account IDs
    const savedSchedules = localStorage.getItem('refresh_schedules')
    const savedAccounts = localStorage.getItem('account_ids')
    
    if (savedSchedules) {
      setSchedules(JSON.parse(savedSchedules))
    }
    
    if (savedAccounts) {
      setAccountIds(JSON.parse(savedAccounts))
    } else {
      // Set default account
      setAccountIds([{
        id: '1',
        value: '88774',
        name: 'Donni HQ'
      }])
    }
  }, [])

  const handleSaveSchedules = () => {
    localStorage.setItem('refresh_schedules', JSON.stringify(schedules))
    toast({
      title: 'Schedules saved',
      description: 'Your refresh schedules have been saved',
    })
  }

  const handleAddSchedule = () => {
    const newSchedule: ScheduleItem = {
      id: Date.now().toString(),
      days: [],
      time: '09:00',
      enabled: true
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

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Configure automatic refresh schedules and manage account IDs
        </p>
      </div>

      {/* Account ID Management */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Save className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-xl">Customer Account IDs</CardTitle>
              <CardDescription>
                Manage customer account IDs that will appear as filters on the inventory page
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Account IDs */}
          <div className="space-y-2">
            <Label>Current Accounts</Label>
            <div className="space-y-2">
              {accountIds.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {account.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      Account ID: {account.value}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveAccountId(account.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Add New Account */}
          <div className="border-t pt-4 space-y-3">
            <Label>Add New Account</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Input
                  placeholder="Account ID (e.g., 88774)"
                  value={newAccountId}
                  onChange={(e) => setNewAccountId(e.target.value)}
                />
              </div>
              <div>
                <Input
                  placeholder="Account Name (e.g., Donni HQ)"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                />
              </div>
            </div>
            <Button
              onClick={handleAddAccountId}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Refresh Scheduler */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-xl">Automatic Refresh Scheduler</CardTitle>
                <CardDescription>
                  Schedule automatic ShipHero inventory refreshes. When complete, Supabase will be updated.
                </CardDescription>
              </div>
            </div>
            <Button onClick={handleAddSchedule} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Schedule
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {schedules.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No schedules configured. Click "Add Schedule" to create one.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3"
                >
                  {/* Days of Week */}
                  <div>
                    <Label className="text-sm mb-2 block">Days</Label>
                    <div className="flex gap-2">
                      {daysOfWeek.map((day) => (
                        <Button
                          key={day}
                          variant={schedule.days.includes(day) ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleToggleDay(schedule.id, day)}
                          className="w-12"
                        >
                          {day}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Time */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <Label className="text-sm mb-2 block">Time</Label>
                      <Input
                        type="time"
                        value={schedule.time}
                        onChange={(e) => handleUpdateTime(schedule.id, e.target.value)}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveSchedule(schedule.id)}
                      className="mt-6"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>

                  {/* Schedule Summary */}
                  {schedule.days.length > 0 && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Runs every {schedule.days.join(', ')} at {schedule.time}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {schedules.length > 0 && (
            <Button
              onClick={handleSaveSchedules}
              className="w-full"
            >
              <Save className="w-4 h-4 mr-2" />
              Save All Schedules
            </Button>
          )}

          {/* Info */}
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Note:</strong> Scheduled refreshes will query ShipHero and update Supabase automatically.
              The inventory page will always show the latest cached data.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
