'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Loader2, 
  Plus, 
  Edit, 
  Trash2, 
  ClipboardList,
  Eye,
  CheckCircle,
  XCircle,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  Coins
} from 'lucide-react';
import { toast } from 'sonner';

// Fallback mockup task items
const fallbackTasks = [
  { _id: '6a2691310913d8ca8ada6334', title: 'Complete Profile Details', description: 'Fill out all profile inputs: full name, alternate email, and phone number in user settings.', rewardAmount: 25, isActive: true },
  { _id: '6a2691490913d8ca8ada633c', title: 'Follow Telegram Channel', description: 'Join our official updates group on Telegram for notifications and announcements.', rewardAmount: 15, isActive: true },
  { _id: '6a2691180913d8ca8ada632c', title: 'Subscribe to YouTube Channel', description: 'Subscribe to our corporate video tutorials channel and hit the notification bell.', rewardAmount: 30, isActive: false },
];

// Fallback user submissions
const fallbackSubmissions = [
  { 
    _id: '6a26983f0913d8ca8ada6371', 
    user: { fullName: 'Sandeep Gupta', email: 'sgupta@bbdu.ac.in' },
    taskId: { title: 'Complete Profile Details', rewardAmount: 25 },
    proof: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=600',
    status: 'pending',
    createdAt: '2026-06-11T14:00:00.000Z'
  },
  { 
    _id: '6a26983f0913d8ca8ada6372', 
    user: { fullName: 'Amit Kumar', email: 'amit@gmail.com' },
    taskId: { title: 'Follow Telegram Channel', rewardAmount: 15 },
    proof: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600',
    status: 'approved',
    createdAt: '2026-06-10T12:00:00.000Z'
  }
];

export default function TasksPage() {
  const queryClient = useQueryClient();
  const [activeView, setActiveView] = useState('manager');
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  
  // Dialogs
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isProofOpen, setIsProofOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rewardAmount, setRewardAmount] = useState('');

  const [mounted, setMounted] = useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch Tasks
  const { data: tasksRes, isLoading: isTasksQueryLoading, error: tasksError, isError: isTasksError } = useQuery({
    queryKey: ['admin', 'tasks'],
    queryFn: () => taskApi.getAllTasksAdmin(),
    enabled: mounted,
  });

  const isTasksLoading = !mounted || isTasksQueryLoading;

  // Robust list extractor
  const getTasksList = () => {
    if (!tasksRes) return [];
    const rData = tasksRes.data?.data;
    if (Array.isArray(rData)) return rData;
    if (rData && typeof rData === 'object') {
      for (const key of Object.keys(rData)) {
        if (Array.isArray((rData as any)[key])) return (rData as any)[key];
      }
    }
    const responseData = tasksRes.data;
    if (Array.isArray(responseData)) return responseData;
    if (responseData && typeof responseData === 'object') {
      for (const key of Object.keys(responseData)) {
        if (Array.isArray((responseData as any)[key])) return (responseData as any)[key];
      }
    }
    return [];
  };

  const tasks = getTasksList();

  // Fetch Submissions
  const { data: submissionsRes, isLoading: isSubmissionsQueryLoading, error: submissionsError, isError: isSubmissionsError } = useQuery({
    queryKey: ['admin', 'submissions'],
    queryFn: () => taskApi.getAllSubmissionsAdmin(),
    enabled: mounted && activeView === 'submissions',
  });

  const isSubmissionsLoading = !mounted || isSubmissionsQueryLoading;


  // Robust list extractor
  const getSubmissionsList = () => {
    if (!submissionsRes) return [];
    const rData = submissionsRes.data?.data;
    if (Array.isArray(rData)) return rData;
    if (rData && typeof rData === 'object') {
      for (const key of Object.keys(rData)) {
        if (Array.isArray((rData as any)[key])) return (rData as any)[key];
      }
    }
    const responseData = submissionsRes.data;
    if (Array.isArray(responseData)) return responseData;
    if (responseData && typeof responseData === 'object') {
      for (const key of Object.keys(responseData)) {
        if (Array.isArray((responseData as any)[key])) return (responseData as any)[key];
      }
    }
    return [];
  };

  const submissions = getSubmissionsList();

  // Create/Update mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => taskApi.createTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tasks'] });
      toast.success('Task created successfully');
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create task');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => taskApi.updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tasks'] });
      toast.success('Task updated successfully');
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update task');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => taskApi.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tasks'] });
      toast.success('Task deleted successfully');
      setIsDeleteOpen(false);
      setSelectedTask(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete task');
    }
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => taskApi.toggleTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tasks'] });
      toast.success('Task status toggled');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Toggle status failed');
    }
  });

  // Submissions Approve/Reject mutations
  const approveSubMutation = useMutation({
    mutationFn: (id: string) => taskApi.approveSubmission(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'submissions'] });
      toast.success('Submission approved and reward credited');
      setIsProofOpen(false);
      setSelectedSubmission(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Approval failed');
    }
  });

  const rejectSubMutation = useMutation({
    mutationFn: (id: string) => taskApi.rejectSubmission(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'submissions'] });
      toast.success('User submission rejected successfully');
      setIsProofOpen(false);
      setSelectedSubmission(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Rejection failed');
    }
  });

  const handleEditClick = (task: any) => {
    setSelectedTask(task);
    setTitle(task.title);
    setDescription(task.description);
    setRewardAmount(task.rewardAmount.toString());
    setIsFormOpen(true);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setRewardAmount('');
    setSelectedTask(null);
    setIsFormOpen(false);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !rewardAmount) return;

    const rewardNum = parseFloat(rewardAmount);
    if (isNaN(rewardNum) || rewardNum <= 0) {
      toast.error('Reward must be a positive number');
      return;
    }

    const payload = { title, description, rewardAmount: rewardNum };

    if (selectedTask) {
      updateMutation.mutate({ id: selectedTask._id || selectedTask.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20">Pending Audit</Badge>;
      case 'approved':
        return <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-rose-500/10 text-rose-450 border border-rose-500/20">Declined</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Tasks & Audits</h1>
          <p className="text-slate-400 text-sm">Create micro-tasks for users to perform and audit submitted screenshot proofs to distribute wallet rewards.</p>
        </div>
      </div>

      <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
        <TabsList className="border-slate-800 bg-slate-900 text-slate-400">
          <TabsTrigger value="manager" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">Tasks Directory</TabsTrigger>
          <TabsTrigger value="submissions" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">Audit Submissions</TabsTrigger>
        </TabsList>

        {/* Manager View */}
        <TabsContent value="manager" className="mt-6 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-350">System Task Templates</h2>
            <Button 
              onClick={() => setIsFormOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold gap-1.5 size-sm h-9 shadow-md shadow-emerald-600/20"
            >
              <Plus className="h-4 w-4" />
              Add Task
            </Button>
          </div>

          {isTasksLoading ? (
            <div className="flex h-60 flex-col items-center justify-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
              <p className="text-sm text-slate-400">Loading task inventory...</p>
            </div>
          ) : isTasksError ? (
            <div className="py-20 text-center border border-dashed border-rose-500/20 rounded-xl bg-rose-500/5 text-rose-400 text-sm">
              Failed to load tasks: {tasksError instanceof Error ? tasksError.message : 'Unknown error'}
            </div>
          ) : tasks.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-slate-800 rounded-xl bg-slate-900/10 text-slate-500">
              No tasks configured. Click &quot;Add Task&quot; to build micro-tasks.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {tasks.map((task: any) => {
                const taskId = task._id || task.id;
                return (
                  <Card 
                    key={taskId} 
                    className={`flex flex-col justify-between border-slate-800 bg-slate-900/30 backdrop-blur-xl shadow-lg hover:border-slate-700/80 transition-all ${
                      !task.isActive && 'opacity-65'
                    }`}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        {task.isActive ? (
                          <Badge className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20">
                            Active Task
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-slate-800 text-slate-400">
                            Inactive
                          </Badge>
                        )}
                        <span className="text-xs text-slate-500 font-mono">ID: {taskId.slice(-6)}</span>
                      </div>
                      <CardTitle className="text-base font-bold text-white mt-3">{task.title}</CardTitle>
                      <CardDescription className="text-slate-405 text-xs line-clamp-2 mt-1">
                        {task.description || 'No description provided'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="py-2">
                      <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2 text-emerald-400">
                        <Coins className="h-4 w-4 shrink-0" />
                        <span className="text-xs font-semibold">Reward:</span>
                        <span className="text-sm font-bold text-white">₹{task.rewardAmount}</span>
                      </div>
                    </CardContent>
                    <CardFooter className="flex gap-2 pt-4 border-t border-slate-850/60 mt-4">
                      {/* Toggle status */}
                      <Button
                        onClick={() => toggleMutation.mutate(taskId)}
                        variant="outline"
                        size="sm"
                        className="flex-1 border-slate-800 bg-slate-950/50 text-slate-350 hover:bg-slate-850"
                      >
                        {task.isActive ? (
                          <span className="flex items-center gap-1 text-[11px] text-amber-400">
                            <ToggleRight className="h-4 w-4" /> Disable
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[11px] text-emerald-450">
                            <ToggleLeft className="h-4 w-4" /> Enable
                          </span>
                        )}
                      </Button>

                      {/* Edit */}
                      <Button
                        onClick={() => handleEditClick(task)}
                        variant="outline"
                        size="icon"
                        className="border-slate-800 bg-slate-950/50 text-slate-350 hover:bg-slate-850"
                        title="Edit Task"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>

                      {/* Delete */}
                      <Button
                        onClick={() => {
                          setSelectedTask(task);
                          setIsDeleteOpen(true);
                        }}
                        variant="outline"
                        size="icon"
                        className="border-slate-800 bg-slate-950/50 text-rose-455 hover:bg-rose-500/10 hover:border-rose-500/20"
                        title="Delete Task"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Submissions View */}
        <TabsContent value="submissions" className="mt-6">
          <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-xl shadow-lg">
            <CardContent className="p-0">
              {isSubmissionsLoading ? (
                <div className="flex h-60 flex-col items-center justify-center gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                  <p className="text-sm text-slate-400">Loading submissions logs...</p>
                </div>
              ) : isSubmissionsError ? (
                <div className="py-20 text-center text-rose-400 text-sm">
                  Failed to load submissions: {submissionsError instanceof Error ? submissionsError.message : 'Unknown error'}
                </div>
              ) : submissions.length === 0 ? (
                <div className="py-20 text-center text-slate-500 text-sm">
                  No task claims submitted by users yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="border-slate-800 bg-slate-950/45">
                      <TableRow className="border-slate-850 hover:bg-transparent">
                        <TableHead className="text-slate-400 font-semibold py-3.5">User Profile</TableHead>
                        <TableHead className="text-slate-400 font-semibold py-3.5">Task Title</TableHead>
                        <TableHead className="text-slate-400 font-semibold py-3.5 text-center">Reward (₹)</TableHead>
                        <TableHead className="text-slate-400 font-semibold py-3.5 text-center">Audit Status</TableHead>
                        <TableHead className="text-slate-400 font-semibold py-3.5 text-right">Audit Trigger</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {submissions.map((sub: any) => {
                        const subId = sub._id || sub.id;
                        const userName = sub.user?.fullName || 'Sandbox User';
                        const userEmail = sub.user?.email || 'user@example.com';
                        const taskName = sub.taskId?.title || 'Unknown Task';
                        const taskReward = sub.taskId?.rewardAmount || 0;

                        return (
                          <TableRow key={subId} className="border-slate-850 hover:bg-slate-900/20 transition-colors">
                            <TableCell className="font-medium">
                              <div className="flex flex-col">
                                <span className="text-sm font-semibold text-slate-200">{userName}</span>
                                <span className="text-[11px] text-slate-500 mt-0.5">{userEmail}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-slate-300 text-sm font-semibold max-w-[200px] truncate">
                              {taskName}
                            </TableCell>
                            <TableCell className="text-center font-bold text-white font-mono text-xs">
                              ₹{taskReward}
                            </TableCell>
                            <TableCell className="text-center">{getStatusBadge(sub.status)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  onClick={() => {
                                    setSelectedSubmission(sub);
                                    setIsProofOpen(true);
                                  }}
                                  size="sm"
                                  variant="outline"
                                  className="h-8 border-slate-800 bg-slate-950 text-slate-350 hover:bg-slate-850 hover:text-white text-xs gap-1"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  Inspect Proof
                                </Button>

                                {sub.status === 'pending' && (
                                  <>
                                    <Button
                                      onClick={() => approveSubMutation.mutate(subId)}
                                      size="icon"
                                      variant="outline"
                                      className="h-8 w-8 border-emerald-500/20 bg-emerald-500/10 text-emerald-450 hover:bg-emerald-500/20 hover:text-emerald-350"
                                      title="Approve Submission"
                                    >
                                      <CheckCircle className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      onClick={() => rejectSubMutation.mutate(subId)}
                                      size="icon"
                                      variant="outline"
                                      className="h-8 w-8 border-rose-500/20 bg-rose-500/10 text-rose-455 hover:bg-rose-500/20 hover:text-rose-350"
                                      title="Reject Submission"
                                    >
                                      <XCircle className="h-3.5 w-3.5" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Task Creation Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={(val) => !val && resetForm()}>
        <DialogContent className="border-slate-800 bg-slate-900 text-white max-w-md sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-emerald-400" />
              {selectedTask ? 'Edit Task Specifications' : 'Build Micro-Task'}
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Configure parameters of the task. Users will earn the specified reward upon approval.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleFormSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="taskTitle">Task Title</Label>
                <Input
                  id="taskTitle"
                  placeholder="Complete Profile Verification"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="border-slate-800 bg-slate-950 text-white placeholder:text-slate-700 text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="taskReward">Reward (₹)</Label>
                <Input
                  id="taskReward"
                  type="number"
                  placeholder="25"
                  value={rewardAmount}
                  onChange={(e) => setRewardAmount(e.target.value)}
                  className="border-slate-800 bg-slate-950 text-white placeholder:text-slate-700 text-xs"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="taskDesc">Task Description & Instructions</Label>
              <Textarea
                id="taskDesc"
                placeholder="Give exact instructions. E.g. Go to settings, fill name/phone, upload profile photo. Upload screenshot of completed settings page."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="border-slate-800 bg-slate-950 text-white placeholder:text-slate-700 resize-none h-24 text-xs"
                required
              />
            </div>

            <DialogFooter className="pt-4 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                className="border-slate-800 text-slate-350 hover:bg-slate-850 hover:text-white text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/20"
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving Task...
                  </>
                ) : (
                  selectedTask ? 'Update Task' : 'Publish Task'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Task Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="border-slate-800 bg-slate-900 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-rose-455 font-bold">Delete Task Template?</DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Confirm deleting <strong>{selectedTask?.title}</strong>. This removes the task and blocks any active submissions.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              className="border-slate-800 text-slate-350 hover:bg-slate-850 hover:text-white text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (selectedTask) {
                  deleteMutation.mutate(selectedTask._id || selectedTask.id);
                }
              }}
              disabled={deleteMutation.isPending}
              className="bg-rose-650 hover:bg-rose-550 text-white font-semibold text-xs"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Removing...
                </>
              ) : (
                'Confirm Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task Submission Proof Viewer Dialog */}
      <Dialog open={isProofOpen} onOpenChange={setIsProofOpen}>
        <DialogContent className="border-slate-800 bg-slate-900 text-white max-w-xl sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-emerald-400" />
              Submission Proof Audit
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Verify claims for task: <strong>{selectedSubmission?.taskId?.title}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3">
            {/* Image display */}
            <div className="relative flex flex-col items-center justify-center border border-slate-800 bg-slate-950 rounded-xl overflow-hidden p-2 group h-64">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedSubmission?.proof}
                alt="Submitted proof screenshot"
                className="max-h-full max-w-full object-contain rounded-lg transition-transform group-hover:scale-[1.02] duration-350"
              />
              <a 
                href={selectedSubmission?.proof} 
                target="_blank" 
                rel="noreferrer" 
                className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-900 px-3 py-1.5 text-[10px] font-semibold border border-slate-805 text-emerald-400 backdrop-blur-md shadow-lg"
              >
                Original Image <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {/* Audit Details */}
            <div className="flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="rounded-lg bg-slate-950/40 border border-slate-850 p-3.5 space-y-2 text-xs">
                  <div className="flex justify-between border-b border-slate-900 pb-1.5">
                    <span className="text-slate-500">Submitter:</span>
                    <span className="text-slate-200 font-semibold">{selectedSubmission?.user?.fullName}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-900 pb-1.5">
                    <span className="text-slate-500">Reward Value:</span>
                    <span className="text-emerald-400 font-bold">₹{selectedSubmission?.taskId?.rewardAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status:</span>
                    <span>{getStatusBadge(selectedSubmission?.status)}</span>
                  </div>
                </div>

                <div className="rounded-lg bg-slate-950/20 border border-slate-850/60 p-3 text-[10px] text-slate-500 leading-relaxed">
                  Verify the image carefully. Make sure the screenshot clearly represents successful execution of the task description before approving.
                </div>
              </div>

              {selectedSubmission?.status === 'pending' && (
                <div className="flex gap-2 pt-3 border-t border-slate-850">
                  <Button
                    onClick={() => rejectSubMutation.mutate(selectedSubmission._id || selectedSubmission.id)}
                    disabled={rejectSubMutation.isPending}
                    type="button"
                    variant="outline"
                    className="flex-1 border-rose-500/25 bg-rose-500/5 text-rose-400 hover:bg-rose-500/15 hover:text-rose-300 font-semibold text-xs h-10"
                  >
                    Reject claim
                  </Button>
                  <Button
                    onClick={() => approveSubMutation.mutate(selectedSubmission._id || selectedSubmission.id)}
                    disabled={approveSubMutation.isPending}
                    type="button"
                    className="flex-1 bg-emerald-650 hover:bg-emerald-550 text-white font-semibold text-xs h-10"
                  >
                    {approveSubMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      'Approve & Reward'
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
