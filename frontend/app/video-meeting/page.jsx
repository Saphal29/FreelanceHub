"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Video,
  Calendar,
  Clock,
  Users,
  Copy,
  MoreVertical,
} from "lucide-react";
import { getAvatarUrl, getInitials, getAvatarColor } from "@/lib/avatarUtils";
import api from "@/lib/api";

export default function VideoMeetingPage() {
  const { user } = useAuth();
  const [meetingLink, setMeetingLink] = useState("");
  const [meetingCodeInput, setMeetingCodeInput] = useState("");
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [recentMeetings, setRecentMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  
  const isFreelancer = user?.role === 'FREELANCER';
  const userType = isFreelancer ? 'freelancer' : 'client';

  useEffect(() => {
    if (user) {
      fetchMeetings();
    }
  }, [user]);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      
      // Fetch scheduled meetings
      const scheduledRes = await api.get('/calls/scheduled');
      if (scheduledRes.data.success) {
        setUpcomingMeetings(scheduledRes.data.meetings || []);
      }

      // Fetch call history
      const historyRes = await api.get('/calls/history');
      if (historyRes.data.success) {
        // Filter only completed calls
        const completed = (historyRes.data.calls || [])
          .filter(call => call.status === 'ended' || call.status === 'connected')
          .slice(0, 5); // Show only last 5
        setRecentMeetings(completed);
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMeetingLink = () => {
    const randomId = crypto.randomUUID();
    const link = `${window.location.origin}/calls/join/${randomId}`;
    setMeetingLink(link);
  };

  const copyMeetingLink = () => {
    navigator.clipboard.writeText(meetingLink);
    // You could add a toast notification here
    alert("Meeting link copied to clipboard!");
  };

  const startMeeting = () => {
    // Generate a new meeting ID and redirect to the meeting room
    const randomId = crypto.randomUUID();
    router.push(`/calls/join/${randomId}`);
  };

  const joinMeeting = () => {
    if (!meetingCodeInput.trim()) {
      alert("Please enter a meeting code or link");
      return;
    }

    // Extract meeting ID from link or use code directly
    let meetingId = meetingCodeInput.trim();
    
    // If it's a full URL, extract the meeting ID
    if (meetingCodeInput.includes('/calls/join/')) {
      const parts = meetingCodeInput.split('/calls/join/');
      meetingId = parts[parts.length - 1];
    } else if (meetingCodeInput.includes('/meet/')) {
      // Support old format
      const parts = meetingCodeInput.split('/meet/');
      meetingId = parts[parts.length - 1];
    }

    // Validate meeting ID format (basic validation)
    if (meetingId.length < 5) {
      alert("Invalid meeting code or link");
      return;
    }

    // Redirect to the meeting room
    router.push(`/calls/join/${meetingId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar userType={userType} />

      {/* Header */}
      <section className="border-b border-border bg-secondary/30 py-8">
        <div className="container mx-auto px-4">
          <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
            Video Meetings
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Connect face-to-face with clients and team members
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Quick Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Start Meeting Card */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center font-display text-xl">
                  <Video className="mr-2 h-5 w-5 text-accent" />
                  Start a Meeting
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Create an instant meeting or schedule one for later
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={startMeeting}
                    variant="accent"
                    size="lg"
                    className="flex-1 min-w-[200px]"
                  >
                    <Video className="mr-2 h-5 w-5" />
                    Start Instant Meeting
                  </Button>
                  <Button
                    onClick={generateMeetingLink}
                    variant="outline"
                    size="lg"
                    className="flex-1 min-w-[200px]"
                  >
                    <Calendar className="mr-2 h-5 w-5" />
                    Schedule Meeting
                  </Button>
                </div>

                {meetingLink && (
                  <div className="rounded-xl border border-border bg-secondary p-4">
                    <p className="mb-2 text-sm font-medium text-foreground">
                      Your meeting link:
                    </p>
                    <div className="flex items-center gap-2">
                      <Input
                        value={meetingLink}
                        readOnly
                        className="flex-1 bg-card"
                      />
                      <Button
                        onClick={copyMeetingLink}
                        variant="outline"
                        size="icon"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Share this link with participants to join the meeting
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Join Meeting Card */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center font-display text-xl">
                  <Users className="mr-2 h-5 w-5 text-accent" />
                  Join a Meeting
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Enter a meeting code or link to join
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Input
                    placeholder="Enter meeting code or link..."
                    className="flex-1 border-border bg-card"
                    value={meetingCodeInput}
                    onChange={(e) => setMeetingCodeInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        joinMeeting();
                      }
                    }}
                  />
                  <Button variant="accent" onClick={joinMeeting}>Join</Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Meetings */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center font-display text-xl">
                  <Clock className="mr-2 h-5 w-5 text-accent" />
                  Recent Meetings
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading meetings...
                  </div>
                ) : recentMeetings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No recent meetings
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentMeetings.map((call) => {
                      // Determine the other participant
                      const otherUserId = call.callerId === user?.id ? call.receiverId : call.callerId;
                      const isOutgoing = call.callerId === user?.id;
                      
                      // Format date and duration
                      const callDate = new Date(call.createdAt);
                      const dateStr = callDate.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: callDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                      });
                      const timeStr = callDate.toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit',
                        hour12: true 
                      });
                      
                      // Format duration
                      const durationMins = call.duration ? Math.floor(call.duration / 60) : 0;
                      const durationSecs = call.duration ? call.duration % 60 : 0;
                      const durationStr = durationMins > 0 
                        ? `${durationMins}m ${durationSecs}s` 
                        : `${durationSecs}s`;

                      return (
                        <div
                          key={call.callId}
                          className="flex items-center justify-between rounded-xl border border-border bg-secondary p-4 transition-colors hover:bg-secondary/80"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={getAvatarUrl(null)} alt="User" />
                              <AvatarFallback className={getAvatarColor(otherUserId)}>
                                {getInitials('User')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-semibold text-foreground">
                                {isOutgoing ? 'Outgoing' : 'Incoming'} {call.callType === 'video' ? 'Video' : 'Audio'} Call
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {dateStr} at {timeStr} • {durationStr}
                              </p>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground capitalize">
                            {call.status}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Upcoming Meetings */}
          <div className="space-y-6">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center font-display text-xl">
                  <Calendar className="mr-2 h-5 w-5 text-accent" />
                  Upcoming Meetings
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading meetings...
                  </div>
                ) : upcomingMeetings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No upcoming meetings
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingMeetings.map((meeting) => {
                      // Format scheduled date and time
                      const scheduledDate = new Date(meeting.scheduledAt);
                      const dateStr = scheduledDate.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: scheduledDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                      });
                      const timeStr = scheduledDate.toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit',
                        hour12: true 
                      });

                      // Get other participants (exclude current user)
                      const otherParticipants = meeting.participants.filter(p => p.userId !== user?.id);
                      const participantNames = otherParticipants.map(p => p.fullName).join(', ') || 'No other participants';

                      return (
                        <div
                          key={meeting.meetingId}
                          className="rounded-xl border border-border bg-secondary p-4"
                        >
                          <div className="mb-3 flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold text-foreground">
                                {meeting.title}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {otherParticipants.length > 0 ? `with ${participantNames}` : 'No participants yet'}
                              </p>
                            </div>
                            {otherParticipants.length > 0 && (
                              <div className="flex -space-x-2">
                                {otherParticipants.slice(0, 3).map((participant) => (
                                  <Avatar key={participant.userId} className="h-8 w-8 border-2 border-background">
                                    <AvatarImage src={getAvatarUrl(participant.avatarUrl)} alt={participant.fullName} />
                                    <AvatarFallback className={getAvatarColor(participant.userId)}>
                                      {getInitials(participant.fullName)}
                                    </AvatarFallback>
                                  </Avatar>
                                ))}
                                {otherParticipants.length > 3 && (
                                  <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium">
                                    +{otherParticipants.length - 3}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="mb-3 flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {dateStr}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {timeStr}
                            </div>
                          </div>
                          <Button
                            onClick={() => router.push(meeting.meetingUrl)}
                            variant="accent"
                            size="sm"
                            className="w-full"
                          >
                            <Video className="mr-2 h-4 w-4" />
                            Join Meeting
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
