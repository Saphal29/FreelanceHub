"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  PhoneOff,
  Settings,
  Users,
  MessageSquare,
  MoreVertical,
  Copy,
  Calendar,
  Clock,
  User,
} from "lucide-react";

// Dummy upcoming meetings
const upcomingMeetings = [
  {
    id: 1,
    title: "Project Kickoff Meeting",
    participant: "Sarah Chen",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    date: "Today",
    time: "2:00 PM",
    duration: "30 min",
  },
  {
    id: 2,
    title: "Design Review",
    participant: "Alex Morgan",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    date: "Tomorrow",
    time: "10:00 AM",
    duration: "1 hour",
  },
  {
    id: 3,
    title: "Weekly Sync",
    participant: "Emma Davis",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    date: "Dec 15",
    time: "3:30 PM",
    duration: "45 min",
  },
];

// Dummy recent meetings
const recentMeetings = [
  {
    id: 1,
    title: "Client Consultation",
    participant: "Mike Johnson",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    date: "Yesterday",
    duration: "45 min",
  },
  {
    id: 2,
    title: "Code Review Session",
    participant: "Lisa Zhang",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop",
    date: "Dec 10",
    duration: "1 hour",
  },
];

export default function VideoMeetingPage() {
  const [isInMeeting, setIsInMeeting] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [meetingLink, setMeetingLink] = useState("");
  const pathname = usePathname();
  
  // Determine user type based on referrer or default to client
  const isFreelancer = typeof window !== 'undefined' && 
    (document.referrer.includes('/freelancer') || 
     document.referrer.includes('/projects') || 
     document.referrer.includes('/time-tracking') ||
     sessionStorage.getItem('userType') === 'freelancer');
  
  const userType = isFreelancer ? 'freelancer' : 'client';

  const generateMeetingLink = () => {
    const randomId = Math.random().toString(36).substring(2, 15);
    const link = `https://freelancehub.com/meet/${randomId}`;
    setMeetingLink(link);
  };

  const copyMeetingLink = () => {
    navigator.clipboard.writeText(meetingLink);
    // You could add a toast notification here
    alert("Meeting link copied to clipboard!");
  };

  const startMeeting = () => {
    setIsInMeeting(true);
  };

  const endMeeting = () => {
    setIsInMeeting(false);
    setIsCameraOn(true);
    setIsMicOn(true);
    setIsScreenSharing(false);
  };

  if (isInMeeting) {
    return (
      <div className="min-h-screen bg-black">
        {/* Meeting Room */}
        <div className="relative h-screen">
          {/* Main Video Area */}
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
            {isCameraOn ? (
              <div className="relative h-full w-full">
                {/* Placeholder for video stream */}
                <div className="flex h-full w-full items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto mb-4 flex h-32 w-32 items-center justify-center rounded-full bg-accent">
                      <User className="h-16 w-16 text-accent-foreground" />
                    </div>
                    <p className="text-xl font-semibold text-white">You</p>
                    <p className="text-sm text-gray-400">Camera is on</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-32 w-32 items-center justify-center rounded-full bg-gray-800">
                  <VideoOff className="h-16 w-16 text-gray-400" />
                </div>
                <p className="text-xl font-semibold text-white">Camera is off</p>
              </div>
            )}

            {/* Participant Thumbnails */}
            <div className="absolute right-4 top-4 space-y-2">
              <div className="relative h-32 w-24 overflow-hidden rounded-xl border-2 border-accent bg-gray-800">
                <img
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop"
                  alt="Participant"
                  className="h-full w-full object-cover"
                />
                <div className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-1 text-xs text-white">
                  Sarah
                </div>
              </div>
            </div>
          </div>

          {/* Meeting Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/95 to-transparent p-6">
            <div className="mx-auto flex max-w-2xl items-center justify-center gap-4">
              {/* Camera Toggle */}
              <button
                onClick={() => setIsCameraOn(!isCameraOn)}
                className={`flex h-14 w-14 items-center justify-center rounded-full transition-colors ${
                  isCameraOn
                    ? "bg-gray-700 text-white hover:bg-gray-600"
                    : "bg-red-600 text-white hover:bg-red-700"
                }`}
              >
                {isCameraOn ? (
                  <Video className="h-6 w-6" />
                ) : (
                  <VideoOff className="h-6 w-6" />
                )}
              </button>

              {/* Mic Toggle */}
              <button
                onClick={() => setIsMicOn(!isMicOn)}
                className={`flex h-14 w-14 items-center justify-center rounded-full transition-colors ${
                  isMicOn
                    ? "bg-gray-700 text-white hover:bg-gray-600"
                    : "bg-red-600 text-white hover:bg-red-700"
                }`}
              >
                {isMicOn ? (
                  <Mic className="h-6 w-6" />
                ) : (
                  <MicOff className="h-6 w-6" />
                )}
              </button>

              {/* Screen Share Toggle */}
              <button
                onClick={() => setIsScreenSharing(!isScreenSharing)}
                className={`flex h-14 w-14 items-center justify-center rounded-full transition-colors ${
                  isScreenSharing
                    ? "bg-amber-500 text-black hover:bg-amber-600"
                    : "bg-gray-700 text-white hover:bg-gray-600"
                }`}
              >
                {isScreenSharing ? (
                  <MonitorOff className="h-6 w-6" />
                ) : (
                  <Monitor className="h-6 w-6" />
                )}
              </button>

              {/* Chat */}
              <button
                className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-700 text-white transition-colors hover:bg-gray-600"
              >
                <MessageSquare className="h-6 w-6" />
              </button>

              {/* Participants */}
              <button
                className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-700 text-white transition-colors hover:bg-gray-600"
              >
                <Users className="h-6 w-6" />
              </button>

              {/* Settings */}
              <button
                className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-700 text-white transition-colors hover:bg-gray-600"
              >
                <Settings className="h-6 w-6" />
              </button>

              {/* End Call */}
              <button
                onClick={endMeeting}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white transition-colors hover:bg-red-700"
              >
                <PhoneOff className="h-6 w-6" />
              </button>
            </div>

            {/* Meeting Info */}
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-400">
                Meeting with Sarah Chen • 00:15:32
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                  />
                  <Button variant="accent">Join</Button>
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
                <div className="space-y-3">
                  {recentMeetings.map((meeting) => (
                    <div
                      key={meeting.id}
                      className="flex items-center justify-between rounded-xl border border-border bg-secondary p-4 transition-colors hover:bg-secondary/80"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={meeting.avatar}
                          alt={meeting.participant}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                        <div>
                          <h4 className="font-semibold text-foreground">
                            {meeting.title}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {meeting.participant} • {meeting.date} • {meeting.duration}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </div>
                  ))}
                </div>
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
                <div className="space-y-3">
                  {upcomingMeetings.map((meeting) => (
                    <div
                      key={meeting.id}
                      className="rounded-xl border border-border bg-secondary p-4"
                    >
                      <div className="mb-3 flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-foreground">
                            {meeting.title}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            with {meeting.participant}
                          </p>
                        </div>
                        <img
                          src={meeting.avatar}
                          alt={meeting.participant}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      </div>
                      <div className="mb-3 flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {meeting.date}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {meeting.time}
                        </div>
                      </div>
                      <Button
                        onClick={startMeeting}
                        variant="accent"
                        size="sm"
                        className="w-full"
                      >
                        <Video className="mr-2 h-4 w-4" />
                        Join Meeting
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
