import{api}from"../../../app/lib";import type{NotificationRecord,NotificationSettings}from"../models/notification.models";
export function getNotificationSettings(){return api<NotificationSettings[]>("/api/notification-settings");}
export function saveNotificationSettings(item:NotificationSettings){return api<NotificationSettings>(`/api/notification-settings${item.id?`/${item.id}`:""}`,{method:item.id?"PUT":"POST",body:JSON.stringify(item)});}
export function disableNotificationSettings(id:string){return api(`/api/notification-settings/${id}`,{method:"DELETE"});}
export function getMyNotificationRecords(email:string,name:string){return api<NotificationRecord[]>(`/api/notification-records/by-user?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`);}
export function acknowledgeNotification(id:string,acknowledgedBy:string){return api(`/api/notification-records/${id}/ack`,{method:"PATCH",body:JSON.stringify({acknowledgedBy})});}
export function getNotificationRecords(){return api<NotificationRecord[]>("/api/notification-records");}
