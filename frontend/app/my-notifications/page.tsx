"use client";import{MyNotificationList}from"../../features/notifications/components/MyNotificationList";import{useMyNotifications}from"../../features/notifications/hooks/useMyNotifications";import{AppNav}from"../nav";
export default function MyNotificationsPage(){const workspace=useMyNotifications();return <main className="app-shell"><AppNav/><MyNotificationList workspace={workspace}/></main>;}
