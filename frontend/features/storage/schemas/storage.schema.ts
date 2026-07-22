import{z}from"zod";const common={id:z.string(),name:z.string().trim().min(1,"Ingrese el nombre.").max(120),isProductionCloudEnabled:z.boolean(),isActive:z.boolean()};
export const storageSettingsSchema=z.discriminatedUnion("provider",[
z.object({...common,provider:z.literal("Local"),localPath:z.string().trim().min(1,"Ingrese la ruta local.")}),
z.object({...common,provider:z.literal("Blob"),blobConnectionString:z.string().min(1,"Ingrese un valor de conexión nuevo."),blobContainer:z.string().regex(/^[a-z0-9-]{3,63}$/, "Use minúsculas, números y guiones (3-63).")}),
z.object({...common,provider:z.literal("Ftp"),ftpHost:z.string().trim().min(1,"Ingrese el host FTP."),ftpUser:z.string().trim().min(1,"Ingrese el usuario FTP."),ftpPassword:z.string().min(1,"Ingrese una clave FTP nueva.")})]);
export type StorageFormValues=z.infer<typeof storageSettingsSchema>;
