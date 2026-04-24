'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fetchEvents, createEvent, attachRelease, validateRelease, ProcessEvent, fetchApplications, createApplication, Application, Environment, Jurisdiction } from '../lib/api/client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function ProcessManagerDashboard() {
  const queryClient = useQueryClient();
  const { data: events, isLoading } = useQuery({ queryKey: ['events'], queryFn: fetchEvents });
  const { data: applications, isLoading: isAppsLoading } = useQuery({ queryKey: ['applications'], queryFn: fetchApplications });

  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    name: '',
    testStart: '', testEnd: '', testEnabled: true,
    preprodStart: '', preprodEnd: '', preprodEnabled: true,
    prodStart: '', prodEnd: '', prodEnabled: true
  });

  const createEventMutation = useMutation({
    mutationFn: async () => {
      await createEvent({
        name: newEvent.name,
        event_enabled: true,
        event_open_for_delivery: true,
        type: 'standard',
        time_windows: {
          test: { start: new Date(newEvent.testStart).toISOString(), end: new Date(newEvent.testEnd).toISOString(), enabled: newEvent.testEnabled },
          preprod: { start: new Date(newEvent.preprodStart).toISOString(), end: new Date(newEvent.preprodEnd).toISOString(), enabled: newEvent.preprodEnabled },
          prod: { start: new Date(newEvent.prodStart).toISOString(), end: new Date(newEvent.prodEnd).toISOString(), enabled: newEvent.prodEnabled },
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setIsEventModalOpen(false);
    }
  });

  // Attach Release State
  const [releaseId, setReleaseId] = useState('');
  const [attachEventId, setAttachEventId] = useState('');
  const attachMutation = useMutation({
    mutationFn: () => attachRelease(releaseId, attachEventId),
    onSuccess: () => alert('Release attached!')
  });

  // Validation State
  const [valReleaseId, setValReleaseId] = useState('');
  const [valEventId, setValEventId] = useState('');
  const [validationResult, setValidationResult] = useState<any>(null);
  
  const handleValidate = async () => {
    try {
      const res = await validateRelease(valReleaseId, valEventId);
      setValidationResult(res);
    } catch (err) {
      alert('Validation check failed');
    }
  };

  // Application State
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const [newApp, setNewApp] = useState({
    name: '',
    environments: {
      dev: [] as Jurisdiction[],
      test: [] as Jurisdiction[],
      preprod: [] as Jurisdiction[],
      prod: [] as Jurisdiction[]
    }
  });

  const createAppMutation = useMutation({
    mutationFn: async () => {
      await createApplication({
        name: newApp.name,
        environments: newApp.environments
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      setIsAppModalOpen(false);
      setNewApp({
        name: '',
        environments: { dev: [], test: [], preprod: [], prod: [] }
      });
    }
  });

  const toggleJurisdiction = (env: Environment, jur: Jurisdiction) => {
    setNewApp(prev => {
      const current = prev.environments[env];
      const updated = current.includes(jur) 
        ? current.filter(j => j !== jur)
        : [...current, jur];
      return { ...prev, environments: { ...prev.environments, [env]: updated } };
    });
  };

  const environmentsList: Environment[] = ['dev', 'test', 'preprod', 'prod'];
  const jurisdictionsList: Jurisdiction[] = ['APAC', 'CH', 'EMEA', 'US', 'GLOBAL'];

  const formatDate = (dateStr: string | null | undefined) => {
    return dateStr ? format(new Date(dateStr), 'MMM dd') : 'open';
  };

  return (
    <div className="container mx-auto p-8 max-w-6xl space-y-8">
      <h1 className="text-3xl font-bold">Release Planner Dashboard</h1>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Events</CardTitle>
          <Dialog open={isEventModalOpen} onOpenChange={setIsEventModalOpen}>
            <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
              Create Event
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium">Event Name</label>
                  <Input value={newEvent.name} onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })} />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 flex items-center space-x-2">
                    <input type="checkbox" checked={newEvent.testEnabled} onChange={(e) => setNewEvent({ ...newEvent, testEnabled: e.target.checked })} />
                    <label className="text-sm font-medium text-blue-600">TEST Enabled</label>
                  </div>
                  {newEvent.testEnabled && (
                    <>
                      <div>
                        <label className="text-sm font-medium text-blue-600">TEST Start</label>
                        <Input type="datetime-local" value={newEvent.testStart} onChange={(e) => setNewEvent({ ...newEvent, testStart: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-blue-600">TEST End</label>
                        <Input type="datetime-local" value={newEvent.testEnd} onChange={(e) => setNewEvent({ ...newEvent, testEnd: e.target.value })} />
                      </div>
                    </>
                  )}

                  <div className="col-span-2 flex items-center space-x-2 mt-2">
                    <input type="checkbox" checked={newEvent.preprodEnabled} onChange={(e) => setNewEvent({ ...newEvent, preprodEnabled: e.target.checked })} />
                    <label className="text-sm font-medium text-purple-600">PREPROD Enabled</label>
                  </div>
                  {newEvent.preprodEnabled && (
                    <>
                      <div>
                        <label className="text-sm font-medium text-purple-600">PREPROD Start</label>
                        <Input type="datetime-local" value={newEvent.preprodStart} onChange={(e) => setNewEvent({ ...newEvent, preprodStart: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-purple-600">PREPROD End</label>
                        <Input type="datetime-local" value={newEvent.preprodEnd} onChange={(e) => setNewEvent({ ...newEvent, preprodEnd: e.target.value })} />
                      </div>
                    </>
                  )}

                  <div className="col-span-2 flex items-center space-x-2 mt-2">
                    <input type="checkbox" checked={newEvent.prodEnabled} onChange={(e) => setNewEvent({ ...newEvent, prodEnabled: e.target.checked })} />
                    <label className="text-sm font-medium text-green-600">PROD Enabled</label>
                  </div>
                  {newEvent.prodEnabled && (
                    <>
                      <div>
                        <label className="text-sm font-medium text-green-600">PROD Start</label>
                        <Input type="datetime-local" value={newEvent.prodStart} onChange={(e) => setNewEvent({ ...newEvent, prodStart: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-green-600">PROD End</label>
                        <Input type="datetime-local" value={newEvent.prodEnd} onChange={(e) => setNewEvent({ ...newEvent, prodEnd: e.target.value })} />
                      </div>
                    </>
                  )}
                </div>

                <Button onClick={() => createEventMutation.mutate()} className="w-full">Save Event</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event Name</TableHead>
                <TableHead>TEST Window</TableHead>
                <TableHead>PREPROD Window</TableHead>
                <TableHead>PROD Window</TableHead>
                <TableHead>ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events?.map((evt: ProcessEvent) => (
                <TableRow key={evt.id}>
                  <TableCell className="font-medium">{evt.name}</TableCell>
                  <TableCell className="text-xs text-blue-600">
                    {evt.time_windows.test.enabled ? `${formatDate(evt.time_windows.test.start)} - ${formatDate(evt.time_windows.test.end)}` : 'Disabled'}
                  </TableCell>
                  <TableCell className="text-xs text-purple-600">
                    {evt.time_windows.preprod.enabled ? `${formatDate(evt.time_windows.preprod.start)} - ${formatDate(evt.time_windows.preprod.end)}` : 'Disabled'}
                  </TableCell>
                  <TableCell className="text-xs text-green-600">
                    {evt.time_windows.prod.enabled ? `${formatDate(evt.time_windows.prod.start)} - ${formatDate(evt.time_windows.prod.end)}` : 'Disabled'}
                  </TableCell>
                  <TableCell className="text-xs text-gray-400">{evt.id}</TableCell>
                </TableRow>
              ))}
              {!events?.length && !isLoading && (
                <TableRow><TableCell colSpan={5} className="text-center">No events found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Applications</CardTitle>
          <Dialog open={isAppModalOpen} onOpenChange={setIsAppModalOpen}>
            <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
              Create Application
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Application</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium">Application Name</label>
                  <Input value={newApp.name} onChange={(e) => setNewApp({ ...newApp, name: e.target.value })} placeholder="e.g. Core Banking API" />
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Environments & Jurisdictions</h4>
                  {environmentsList.map(env => (
                    <div key={env} className="grid grid-cols-[100px_1fr] items-center gap-4 border-b pb-2">
                      <span className="text-sm font-semibold uppercase">{env}</span>
                      <div className="flex flex-wrap gap-2">
                        {jurisdictionsList.map(jur => {
                          const isSelected = newApp.environments[env].includes(jur);
                          return (
                            <Badge 
                              key={jur} 
                              variant={isSelected ? "default" : "outline"}
                              className="cursor-pointer"
                              onClick={() => toggleJurisdiction(env, jur)}
                            >
                              {jur}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <Button onClick={() => createAppMutation.mutate()} className="w-full">Save Application</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>App Name</TableHead>
                <TableHead>DEV</TableHead>
                <TableHead>TEST</TableHead>
                <TableHead>PREPROD</TableHead>
                <TableHead>PROD</TableHead>
                <TableHead>ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications?.map((app: Application) => (
                <TableRow key={app.id}>
                  <TableCell className="font-medium">{app.name}</TableCell>
                  <TableCell className="text-xs">
                    {app.environments.dev.join(', ') || '-'}
                  </TableCell>
                  <TableCell className="text-xs">
                    {app.environments.test.join(', ') || '-'}
                  </TableCell>
                  <TableCell className="text-xs">
                    {app.environments.preprod.join(', ') || '-'}
                  </TableCell>
                  <TableCell className="text-xs">
                    {app.environments.prod.join(', ') || '-'}
                  </TableCell>
                  <TableCell className="text-xs text-gray-400">{app.id}</TableCell>
                </TableRow>
              ))}
              {!applications?.length && !isAppsLoading && (
                <TableRow><TableCell colSpan={6} className="text-center">No applications found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader><CardTitle>Attach Release</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Release ID</label>
              <Input placeholder="REL-123" value={releaseId} onChange={e => setReleaseId(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Event ID</label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={attachEventId} 
                onChange={e => setAttachEventId(e.target.value)}
              >
                <option value="">Select Event...</option>
                {events?.map((e: ProcessEvent) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <Button onClick={() => attachMutation.mutate()} className="w-full">Attach</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Validation Checker</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Release ID</label>
              <Input placeholder="REL-123" value={valReleaseId} onChange={e => setValReleaseId(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Event ID</label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={valEventId} 
                onChange={e => setValEventId(e.target.value)}
              >
                <option value="">Select Event...</option>
                {events?.map((e: ProcessEvent) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <Button onClick={handleValidate} variant="secondary" className="w-full">Validate</Button>
            
            {validationResult && (
              <div className="mt-4 p-4 border rounded-lg bg-slate-50">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={validationResult.isValid ? "default" : "destructive"}>
                    {validationResult.isValid ? 'VALID' : 'INVALID'}
                  </Badge>
                  {validationResult.phase && (
                    <Badge variant="outline">{validationResult.phase}</Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600">{validationResult.message}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
