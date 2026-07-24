'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, AlertCircle } from 'lucide-react'
import Button from '@/components/ui/Button'
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'
import { collectionFromResponse } from '@/lib/api-response'

interface TaxDeadline {
  id: string
  name: string
  description?: string
  type: string
  dueDate: string
}

interface Task {
  id: string
  title: string
  dueDate?: string
  priority: string
  status: string
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [deadlines, setDeadlines] = useState<TaxDeadline[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [deadlinesRes, tasksRes] = await Promise.all([
        fetch('/api/tax/deadlines'),
        fetch('/api/practice/tasks'),
      ])
      const [deadlinesData, tasksData] = await Promise.all([
        deadlinesRes.json(),
        tasksRes.json(),
      ])
      setDeadlines(collectionFromResponse<TaxDeadline>(deadlinesData))
      setTasks(collectionFromResponse<Task>(tasksData))
    } catch (error) {
      console.error('Error fetching calendar data:', error)
    }
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()

    const days: Array<{ date: Date | null; events: Array<{ type: string; title: string }> }> = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push({ date: null, events: [] })
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const cellDate = new Date(year, month, day)
      const dateStr = cellDate.toISOString().split('T')[0]

      const events: Array<{ type: string; title: string }> = []

      // Check for deadlines
      deadlines.forEach(deadline => {
        if (deadline.dueDate.split('T')[0] === dateStr) {
          events.push({ type: 'deadline', title: deadline.name })
        }
      })

      // Check for tasks
      tasks.forEach(task => {
        if (task.dueDate?.split('T')[0] === dateStr) {
          events.push({ type: 'task', title: task.title })
        }
      })

      days.push({ date: cellDate, events })
    }

    return days
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1))
      return newDate
    })
  }

  const days = getDaysInMonth(currentDate)
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })

  const isToday = (date: Date | null) => {
    if (!date) return false
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const getEventsForSelectedDate = () => {
    if (!selectedDate) return { deadlines: [], tasks: [] }
    const dateStr = selectedDate.toISOString().split('T')[0]
    return {
      deadlines: deadlines.filter(d => d.dueDate.split('T')[0] === dateStr),
      tasks: tasks.filter(t => t.dueDate?.split('T')[0] === dateStr),
    }
  }

  const selectedEvents = getEventsForSelectedDate()

  // Upcoming deadlines
  const upcomingDeadlines = deadlines
    .filter(d => new Date(d.dueDate) >= new Date())
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Calendar</h1>
          <p className="text-secondary-600">View deadlines and scheduled tasks</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Event
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card variant="bordered">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{monthName}</CardTitle>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => navigateMonth('prev')}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())}>
                    Today
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => navigateMonth('next')}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-px bg-secondary-200 rounded-lg overflow-hidden">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="bg-secondary-50 p-2 text-center text-sm font-medium text-secondary-500">
                    {day}
                  </div>
                ))}
                {days.map((day, index) => (
                  <div
                    key={index}
                    className={`bg-white min-h-[100px] p-2 ${day.date ? 'cursor-pointer hover:bg-secondary-50' : ''} ${
                      day.date && selectedDate?.toDateString() === day.date.toDateString() ? 'ring-2 ring-primary-500 ring-inset' : ''
                    }`}
                    onClick={() => day.date && setSelectedDate(day.date)}
                  >
                    {day.date && (
                      <>
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm ${
                          isToday(day.date) ? 'bg-primary-600 text-white' : 'text-secondary-700'
                        }`}>
                          {day.date.getDate()}
                        </span>
                        <div className="mt-1 space-y-1">
                          {day.events.slice(0, 2).map((event, i) => (
                            <div
                              key={i}
                              className={`text-xs px-1 py-0.5 rounded truncate ${
                                event.type === 'deadline' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {event.title}
                            </div>
                          ))}
                          {day.events.length > 2 && (
                            <div className="text-xs text-secondary-500">+{day.events.length - 2} more</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Selected Date Events */}
          {selectedDate && (
            <Card variant="bordered">
              <CardHeader>
                <CardTitle className="text-base">
                  {formatDate(selectedDate)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedEvents.deadlines.length === 0 && selectedEvents.tasks.length === 0 ? (
                  <p className="text-sm text-secondary-500">No events on this date</p>
                ) : (
                  <div className="space-y-3">
                    {selectedEvents.deadlines.map(deadline => (
                      <div key={deadline.id} className="flex items-start p-2 bg-red-50 rounded-lg">
                        <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-red-800">{deadline.name}</p>
                          {deadline.description && (
                            <p className="text-xs text-red-600">{deadline.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                    {selectedEvents.tasks.map(task => (
                      <div key={task.id} className="flex items-start p-2 bg-blue-50 rounded-lg">
                        <Clock className="h-4 w-4 text-blue-600 mt-0.5 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-blue-800">{task.title}</p>
                          <Badge variant={
                            task.priority === 'URGENT' ? 'danger' :
                            task.priority === 'HIGH' ? 'warning' : 'default'
                          } size="sm">
                            {task.priority}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Upcoming Deadlines */}
          <Card variant="bordered">
            <CardHeader>
              <CardTitle className="text-base">Upcoming Deadlines</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingDeadlines.length === 0 ? (
                <p className="text-sm text-secondary-500">No upcoming deadlines</p>
              ) : (
                <div className="space-y-3">
                  {upcomingDeadlines.map(deadline => {
                    const daysUntil = Math.ceil(
                      (new Date(deadline.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                    )
                    return (
                      <div key={deadline.id} className="flex items-center justify-between p-2 bg-secondary-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium">{deadline.name}</p>
                          <p className="text-xs text-secondary-500">{formatDate(deadline.dueDate)}</p>
                        </div>
                        <Badge variant={daysUntil <= 7 ? 'danger' : daysUntil <= 30 ? 'warning' : 'default'} size="sm">
                          {daysUntil}d
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Legend */}
          <Card variant="bordered">
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-100 rounded mr-2"></div>
                  <span className="text-sm text-secondary-600">Tax Deadlines</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-100 rounded mr-2"></div>
                  <span className="text-sm text-secondary-600">Tasks</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
