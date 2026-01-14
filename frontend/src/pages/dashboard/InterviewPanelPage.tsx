import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeftIcon, ClockIcon, CloudArrowUpIcon, PlayIcon, StopIcon } from '@heroicons/react/24/outline';
import { Card, Badge, Button, Spinner, Textarea, Input } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { InterviewStatus, UserRole } from '@/types';
import { useInterview, useStartInterview, useCompleteInterview, useUploadRecording } from '@/hooks/useInterviews';
import toast from 'react-hot-toast';

const InterviewPanelPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { data: interview, isLoading, isError } = useInterview(id || '');
  const startInterview = useStartInterview();
  const completeInterview = useCompleteInterview();
  const uploadRecording = useUploadRecording();

  // Local timer
  const [timerStart, setTimerStart] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  // Local notes (not persisted server-side)
  const [notes, setNotes] = useState('');

  const timerKey = useMemo(() => `interview-timer-${id}`, [id]);
  const notesKey = useMemo(() => `interview-notes-${id}`, [id]);

  // Load persisted notes/timer
  useEffect(() => {
    const savedNotes = localStorage.getItem(notesKey);
    if (savedNotes) setNotes(savedNotes);

    const savedStart = localStorage.getItem(timerKey);
    if (savedStart) {
      const ts = Number(savedStart);
      if (!Number.isNaN(ts)) {
        setTimerStart(ts);
      }
    }
  }, [notesKey, timerKey]);

  // Persist notes
  useEffect(() => {
    localStorage.setItem(notesKey, notes);
  }, [notes, notesKey]);

  // Tick timer
  useEffect(() => {
    if (!timerStart) return;
    const interval = setInterval(() => {
      setElapsed(Date.now() - timerStart);
    }, 1000);
    return () => clearInterval(interval);
  }, [timerStart]);

  // If interview is completed/cancelled, stop timer
  useEffect(() => {
    if (interview && interview.status !== InterviewStatus.IN_PROGRESS) {
      setTimerStart(null);
      setElapsed(0);
      localStorage.removeItem(timerKey);
    }
  }, [interview, timerKey]);

  const isInterviewer = user?.role === UserRole.INTERVIEWER;
  const jobSeekerId =
    (interview as any)?.jobSeeker?._id ||
    (interview as any)?.jobSeekerId?._id ||
    (interview as any)?.jobSeekerId;
  const interviewerId =
    (interview as any)?.interviewer?._id ||
    (interview as any)?.interviewerId?._id ||
    (interview as any)?.interviewerId;
  const isParticipant = interview ? jobSeekerId === user?._id || interviewerId === user?._id : false;
  const recording = (interview as any)?.videoRecording || interview?.recording;

  const formatElapsed = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  const handleStart = async () => {
    if (!id) return;
    try {
      await startInterview.mutateAsync(id);
      const now = Date.now();
      setTimerStart(now);
      localStorage.setItem(timerKey, String(now));
    } catch (error: any) {
      toast.error(error?.message || 'Unable to start interview');
    }
  };

  const handleComplete = async () => {
    if (!id) return;
    try {
      await completeInterview.mutateAsync(id);
      setTimerStart(null);
      setElapsed(0);
      localStorage.removeItem(timerKey);
      toast.success('Interview marked completed');
    } catch (error: any) {
      toast.error(error?.message || 'Unable to complete interview');
    }
  };

  const handleUpload = async (file?: File) => {
    if (!file || !id) return;
    try {
      await uploadRecording.mutateAsync({ id, file });
      toast.success('Recording uploaded');
      queryClient.invalidateQueries({ queryKey: ['interview', id] });
    } catch (error: any) {
      toast.error(error?.message || 'Upload failed');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !interview) {
    return (
      <div className="p-6">
        <Button onClick={() => navigate(-1)}>Back</Button>
        <p className="mt-4 text-red-600">Interview not found.</p>
      </div>
    );
  }

  if (!isParticipant) {
    return (
      <div className="p-6">
        <Button onClick={() => navigate(-1)}>Back</Button>
        <p className="mt-4 text-red-600">You do not have access to this interview.</p>
      </div>
    );
  }

  const statusBadge: Record<InterviewStatus, { variant: 'primary' | 'success' | 'warning' | 'danger' | 'gray'; label: string }> = {
    [InterviewStatus.REQUESTED]: { variant: 'gray', label: 'Requested' },
    [InterviewStatus.SCHEDULED]: { variant: 'primary', label: 'Scheduled' },
    [InterviewStatus.IN_PROGRESS]: { variant: 'warning', label: 'In Progress' },
    [InterviewStatus.COMPLETED]: { variant: 'success', label: 'Completed' },
    [InterviewStatus.CANCELLED]: { variant: 'danger', label: 'Cancelled' },
    [InterviewStatus.NO_SHOW]: { variant: 'gray', label: 'No Show' },
    [InterviewStatus.EXPIRED]: { variant: 'gray', label: 'Expired' },
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h1 className="text-2xl font-semibold text-gray-900">Interview Panel</h1>
        <Badge variant={statusBadge[interview.status].variant}>{statusBadge[interview.status].label}</Badge>
      </div>

      <Card className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-sm text-gray-600">Candidate</p>
            <p className="font-semibold text-gray-900">
              {interview.jobSeeker?.firstName} {interview.jobSeeker?.lastName}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Interviewer</p>
            <p className="font-semibold text-gray-900">
              {interview.interviewer?.firstName} {interview.interviewer?.lastName}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ClockIcon className="h-5 w-5 text-gray-500" />
            <span className="font-mono text-lg">{timerStart ? formatElapsed(elapsed) : '00:00:00'}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {isInterviewer && interview.status === InterviewStatus.SCHEDULED && (
            <Button onClick={handleStart} isLoading={startInterview.isPending}>
              <PlayIcon className="h-4 w-4 mr-1" />
              Start Interview
            </Button>
          )}
          {isInterviewer && interview.status === InterviewStatus.IN_PROGRESS && (
            <Button variant="outline" onClick={handleComplete} isLoading={completeInterview.isPending}>
              <StopIcon className="h-4 w-4 mr-1" />
              Mark Complete
            </Button>
          )}
          <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['interview', id] })}>
            Refresh
          </Button>
        </div>

        <div className="rounded-lg border border-dashed border-gray-200 p-4 bg-gray-50">
          <p className="text-sm text-gray-700 font-semibold mb-1">Call Instructions</p>
          <p className="text-sm text-gray-600">
            This panel doesn’t use an external provider. Coordinate a voice/video call using your preferred internal
            method, and use this panel to track status, timing, notes, and upload the recording to the system.
          </p>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-gray-900">Notes</p>
            <Badge variant="gray">Local-only</Badge>
          </div>
          <Textarea
            rows={10}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Write notes, feedback, or action items..."
          />
        </Card>

        <Card className="space-y-3">
          <p className="font-semibold text-gray-900">Recording Upload</p>
          <p className="text-sm text-gray-600">
            After your session, upload the call recording. It will be stored securely (S3) and attached to this interview.
          </p>
          <Input
            type="file"
            accept="video/*"
            onChange={(e) => handleUpload(e.target.files?.[0])}
            disabled={uploadRecording.isPending}
          />
          {uploadRecording.isPending && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CloudArrowUpIcon className="h-4 w-4" />
              Uploading...
            </div>
          )}
          {recording?.url && (
            <Button
              variant="outline"
              onClick={() => window.open(recording.url, '_blank')}
            >
              View Current Recording
            </Button>
          )}
        </Card>
      </div>
    </div>
  );
};

export default InterviewPanelPage;

