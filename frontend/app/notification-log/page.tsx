"use client";import{NotificationLog}from"../../features/notifications/components/NotificationLog";import{useNotificationLog}from"../../features/notifications/hooks/useNotificationLog";import{AppNav}from"../nav";
export default function NotificationLogPage(){const workspace=useNotificationLog();return <main className="app-shell"><AppNav/><NotificationLog workspace={workspace}/></main>;}
