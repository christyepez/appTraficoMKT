import{api}from"../../../app/lib";import type{StoragePayload,StorageProvider,StorageSettings}from"../models/storage.models";
type UnsafeStorageResponse=Omit<StorageSettings,"hasBlobSecret"|"hasFtpSecret">&{provider:StorageProvider;blobConnectionString?:string;ftpPassword?:string};
function redact(item:UnsafeStorageResponse):StorageSettings{const{blobConnectionString,ftpPassword,...safe}=item;return{...safe,hasBlobSecret:Boolean(blobConnectionString),hasFtpSecret:Boolean(ftpPassword)};}
export async function getStorageSettings(){return(await api<UnsafeStorageResponse[]>("/api/storage-settings/all")).map(redact);}
export async function saveStorageSettings(id:string,payload:StoragePayload){return redact(await api<UnsafeStorageResponse>(`/api/storage-settings${id?`/${id}`:""}`,{method:id?"PUT":"POST",body:JSON.stringify(payload)}));}
export function disableStorageSettings(id:string){return api(`/api/storage-settings/${id}`,{method:"DELETE"});}
