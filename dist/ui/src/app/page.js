"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ProcessManagerDashboard;
const react_1 = require("react");
const react_query_1 = require("@tanstack/react-query");
const date_fns_1 = require("date-fns");
const client_1 = require("../lib/api/client");
const card_1 = require("@/components/ui/card");
const table_1 = require("@/components/ui/table");
const button_1 = require("@/components/ui/button");
const badge_1 = require("@/components/ui/badge");
const input_1 = require("@/components/ui/input");
const dialog_1 = require("@/components/ui/dialog");
function ProcessManagerDashboard() {
    const queryClient = (0, react_query_1.useQueryClient)();
    const { data: events, isLoading } = (0, react_query_1.useQuery)({ queryKey: ['events'], queryFn: client_1.fetchEvents });
    const [isEventModalOpen, setIsEventModalOpen] = (0, react_1.useState)(false);
    const [newEvent, setNewEvent] = (0, react_1.useState)({
        name: '',
        testStart: '', testEnd: '',
        preprodStart: '', preprodEnd: '',
        prodStart: '', prodEnd: ''
    });
    const createEventMutation = (0, react_query_1.useMutation)({
        mutationFn: async () => {
            await (0, client_1.createEvent)({
                name: newEvent.name,
                test_window: { start: new Date(newEvent.testStart).toISOString(), end: new Date(newEvent.testEnd).toISOString() },
                preprod_window: { start: new Date(newEvent.preprodStart).toISOString(), end: new Date(newEvent.preprodEnd).toISOString() },
                prod_window: { start: new Date(newEvent.prodStart).toISOString(), end: new Date(newEvent.prodEnd).toISOString() },
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] });
            setIsEventModalOpen(false);
        }
    });
    // Attach Release State
    const [releaseId, setReleaseId] = (0, react_1.useState)('');
    const [attachEventId, setAttachEventId] = (0, react_1.useState)('');
    const attachMutation = (0, react_query_1.useMutation)({
        mutationFn: () => (0, client_1.attachRelease)(releaseId, attachEventId),
        onSuccess: () => alert('Release attached!')
    });
    // Validation State
    const [valReleaseId, setValReleaseId] = (0, react_1.useState)('');
    const [valEventId, setValEventId] = (0, react_1.useState)('');
    const [validationResult, setValidationResult] = (0, react_1.useState)(null);
    const handleValidate = async () => {
        try {
            const res = await (0, client_1.validateRelease)(valReleaseId, valEventId);
            setValidationResult(res);
        }
        catch (err) {
            alert('Validation check failed');
        }
    };
    return (<div className="container mx-auto p-8 max-w-6xl space-y-8">
      <h1 className="text-3xl font-bold">Release Planner Dashboard</h1>

      <card_1.Card>
        <card_1.CardHeader className="flex flex-row items-center justify-between">
          <card_1.CardTitle>Events</card_1.CardTitle>
          <dialog_1.Dialog open={isEventModalOpen} onOpenChange={setIsEventModalOpen}>
            <dialog_1.DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
              Create Event
            </dialog_1.DialogTrigger>
            <dialog_1.DialogContent className="sm:max-w-[500px]">
              <dialog_1.DialogHeader>
                <dialog_1.DialogTitle>Create New Event</dialog_1.DialogTitle>
              </dialog_1.DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium">Event Name</label>
                  <input_1.Input value={newEvent.name} onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}/>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-blue-600">TEST Start</label>
                    <input_1.Input type="datetime-local" value={newEvent.testStart} onChange={(e) => setNewEvent({ ...newEvent, testStart: e.target.value })}/>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-blue-600">TEST End</label>
                    <input_1.Input type="datetime-local" value={newEvent.testEnd} onChange={(e) => setNewEvent({ ...newEvent, testEnd: e.target.value })}/>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-purple-600">PREPROD Start</label>
                    <input_1.Input type="datetime-local" value={newEvent.preprodStart} onChange={(e) => setNewEvent({ ...newEvent, preprodStart: e.target.value })}/>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-purple-600">PREPROD End</label>
                    <input_1.Input type="datetime-local" value={newEvent.preprodEnd} onChange={(e) => setNewEvent({ ...newEvent, preprodEnd: e.target.value })}/>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-green-600">PROD Start</label>
                    <input_1.Input type="datetime-local" value={newEvent.prodStart} onChange={(e) => setNewEvent({ ...newEvent, prodStart: e.target.value })}/>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-green-600">PROD End</label>
                    <input_1.Input type="datetime-local" value={newEvent.prodEnd} onChange={(e) => setNewEvent({ ...newEvent, prodEnd: e.target.value })}/>
                  </div>
                </div>

                <button_1.Button onClick={() => createEventMutation.mutate()} className="w-full">Save Event</button_1.Button>
              </div>
            </dialog_1.DialogContent>
          </dialog_1.Dialog>
        </card_1.CardHeader>
        <card_1.CardContent>
          <table_1.Table>
            <table_1.TableHeader>
              <table_1.TableRow>
                <table_1.TableHead>Event Name</table_1.TableHead>
                <table_1.TableHead>TEST Window</table_1.TableHead>
                <table_1.TableHead>PREPROD Window</table_1.TableHead>
                <table_1.TableHead>PROD Window</table_1.TableHead>
                <table_1.TableHead>ID</table_1.TableHead>
              </table_1.TableRow>
            </table_1.TableHeader>
            <table_1.TableBody>
              {events?.map((evt) => (<table_1.TableRow key={evt.id}>
                  <table_1.TableCell className="font-medium">{evt.name}</table_1.TableCell>
                  <table_1.TableCell className="text-xs text-blue-600">
                    {(0, date_fns_1.format)(new Date(evt.test_window.start), 'MMM dd')} - {(0, date_fns_1.format)(new Date(evt.test_window.end), 'MMM dd')}
                  </table_1.TableCell>
                  <table_1.TableCell className="text-xs text-purple-600">
                    {(0, date_fns_1.format)(new Date(evt.preprod_window.start), 'MMM dd')} - {(0, date_fns_1.format)(new Date(evt.preprod_window.end), 'MMM dd')}
                  </table_1.TableCell>
                  <table_1.TableCell className="text-xs text-green-600">
                    {(0, date_fns_1.format)(new Date(evt.prod_window.start), 'MMM dd')} - {(0, date_fns_1.format)(new Date(evt.prod_window.end), 'MMM dd')}
                  </table_1.TableCell>
                  <table_1.TableCell className="text-xs text-gray-400">{evt.id}</table_1.TableCell>
                </table_1.TableRow>))}
              {!events?.length && !isLoading && (<table_1.TableRow><table_1.TableCell colSpan={5} className="text-center">No events found.</table_1.TableCell></table_1.TableRow>)}
            </table_1.TableBody>
          </table_1.Table>
        </card_1.CardContent>
      </card_1.Card>

      <div className="grid md:grid-cols-2 gap-8">
        <card_1.Card>
          <card_1.CardHeader><card_1.CardTitle>Attach Release</card_1.CardTitle></card_1.CardHeader>
          <card_1.CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Release ID</label>
              <input_1.Input placeholder="REL-123" value={releaseId} onChange={e => setReleaseId(e.target.value)}/>
            </div>
            <div>
              <label className="text-sm font-medium">Event ID</label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" value={attachEventId} onChange={e => setAttachEventId(e.target.value)}>
                <option value="">Select Event...</option>
                {events?.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <button_1.Button onClick={() => attachMutation.mutate()} className="w-full">Attach</button_1.Button>
          </card_1.CardContent>
        </card_1.Card>

        <card_1.Card>
          <card_1.CardHeader><card_1.CardTitle>Validation Checker</card_1.CardTitle></card_1.CardHeader>
          <card_1.CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Release ID</label>
              <input_1.Input placeholder="REL-123" value={valReleaseId} onChange={e => setValReleaseId(e.target.value)}/>
            </div>
            <div>
              <label className="text-sm font-medium">Event ID</label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" value={valEventId} onChange={e => setValEventId(e.target.value)}>
                <option value="">Select Event...</option>
                {events?.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <button_1.Button onClick={handleValidate} variant="secondary" className="w-full">Validate</button_1.Button>
            
            {validationResult && (<div className="mt-4 p-4 border rounded-lg bg-slate-50">
                <div className="flex items-center gap-2 mb-2">
                  <badge_1.Badge variant={validationResult.isValid ? "default" : "destructive"}>
                    {validationResult.isValid ? 'VALID' : 'INVALID'}
                  </badge_1.Badge>
                  {validationResult.phase && (<badge_1.Badge variant="outline">{validationResult.phase}</badge_1.Badge>)}
                </div>
                <p className="text-sm text-gray-600">{validationResult.message}</p>
              </div>)}
          </card_1.CardContent>
        </card_1.Card>
      </div>
    </div>);
}
