export type StorageProvider="Local"|"Blob"|"Ftp";
export type StorageSettings={id:string;name:string;provider:StorageProvider;localPath:string;blobContainer:string;ftpHost:string;ftpUser:string;isProductionCloudEnabled:boolean;isActive:boolean;hasBlobSecret:boolean;hasFtpSecret:boolean};
export type StoragePayload={name:string;provider:StorageProvider;localPath:string;blobConnectionString:string;blobContainer:string;ftpHost:string;ftpUser:string;ftpPassword:string;isProductionCloudEnabled:boolean;isActive:boolean};
export const emptyStorageSettings:StorageSettings={id:"",name:"Configuración local",provider:"Local",localPath:"uploads",blobContainer:"evidencias",ftpHost:"",ftpUser:"",isProductionCloudEnabled:false,isActive:true,hasBlobSecret:false,hasFtpSecret:false};
