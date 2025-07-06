'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  Eye
} from 'lucide-react';

// Mock data for calendar events
const events = [
  {
    id: 1,
    title: "Pelleteuse CAT 320",
    client: "Entreprise Martin",
    startDate: "2024-01-15",
    endDate: "2024-01-25",
    status: "active",
    color: "bg-blue-500"
  },
  {
    id: 2,
    title: "Grue mobile 50T",
    client: "BTP Solutions",
    startDate: "2024-01-18",
    endDate: "2024-01-28",
    status: "confirmed",
    color: "bg-green-500"
  },
  {
    id: 3,
    title: "Camion-benne 20T",
    client: "Construction Moderne",
    startDate: "2024-01-20",
    endDate: "2024-01-30",
    status: "pending",
    color: "bg-yellow-500"
  }
];

const months = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedView, setSelectedView] = useState<'month' | 'week'>('month');

  const getCurrentMonth = () => {
    return currentDate.getMonth();
  };

  const getCurrentYear = () => {
    return currentDate.getFullYear();
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const renderCalendarDays = () => {
    const month = getCurrentMonth();
    const year = getCurrentYear();
    const daysInMonth = getDaysInMonth(month, year);
    const firstDay = getFirstDayOfMonth(month, year);
    const calendarDays = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      calendarDays.push(
        <div key={`empty-${i}`} className="h-24 border border-gray-200"></div>
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayEvents = events.filter(event => {
        const startDate = new Date(event.startDate);
        const endDate = new Date(event.endDate);
        const currentDay = new Date(dateStr);
        return currentDay >= startDate && currentDay <= endDate;
      });

      calendarDays.push(
        <div key={day} className="h-24 border border-gray-200 p-1 overflow-hidden">
          <div className="text-sm font-medium text-gray-900 mb-1">{day}</div>
          <div className="space-y-1">
            {dayEvents.slice(0, 2).map((event) => (
              <div
                key={event.id}
                className={`text-xs text-white px-1 py-0.5 rounded truncate ${event.color}`}
                title={`${event.title} - ${event.client}`}
              >
                {event.title}
              </div>
            ))}
            {dayEvents.length > 2 && (
              <div className="text-xs text-gray-500">
                +{dayEvents.length - 2} autres
              </div>
            )}
          </div>
        </div>
      );
    }

    return calendarDays;
  };

  const getUpcomingEvents = () => {
    const today = new Date();
    const upcoming = events.filter(event => {
      const startDate = new Date(event.startDate);
      return startDate >= today;
    }).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    
    return upcoming.slice(0, 5);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'confirmed': return 'secondary';
      case 'pending': return 'outline';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'En cours';
      case 'confirmed': return 'Confirmé';
      case 'pending': return 'En attente';
      default: return status;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Calendrier</h1>
            <p className="text-muted-foreground">
              Planification et suivi des locations
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filtrer
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle location
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <h2 className="text-xl font-semibold">
                        {months[getCurrentMonth()]} {getCurrentYear()}
                      </h2>
                      <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={selectedView === 'month' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedView('month')}
                    >
                      Mois
                    </Button>
                    <Button
                      variant={selectedView === 'week' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedView('week')}
                    >
                      Semaine
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-0">
                  {/* Day headers */}
                  {days.map((day) => (
                    <div key={day} className="h-12 border border-gray-200 bg-gray-50 flex items-center justify-center font-medium text-sm text-gray-600">
                      {day}
                    </div>
                  ))}
                  {/* Calendar days */}
                  {renderCalendarDays()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Today */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Aujourd&apos;hui
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Date().toLocaleDateString('fr-FR', { 
                    day: 'numeric', 
                    month: 'long' 
                  })}
                </div>
                <p className="text-sm text-muted-foreground">
                  {events.filter(event => {
                    const today = new Date().toISOString().split('T')[0];
                    const startDate = event.startDate;
                    const endDate = event.endDate;
                    return today >= startDate && today <= endDate;
                  }).length} location{events.length > 1 ? 's' : ''} en cours
                </p>
              </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card>
              <CardHeader>
                <CardTitle>Prochaines locations</CardTitle>
                <CardDescription>
                  Les 5 prochaines échéances
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {getUpcomingEvents().map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{event.title}</div>
                        <div className="text-xs text-muted-foreground">{event.client}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(event.startDate).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusColor(event.status)} className="text-xs">
                          {getStatusLabel(event.status)}
                        </Badge>
                        <Button size="sm" variant="ghost">
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {getUpcomingEvents().length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Aucune location prévue
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Legend */}
            <Card>
              <CardHeader>
                <CardTitle>Légende</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span className="text-sm">En cours</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span className="text-sm">Confirmé</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                    <span className="text-sm">En attente</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
