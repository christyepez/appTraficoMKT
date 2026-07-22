export type ImportScope="all"|"administration"|"catalogs"|"users"|"requirements"|"products";
export type ImportResult={faculties:number;campuses:number;careers:number;catalogs:number;approvers:number;requirements:number;products:number;users:number;errors?:Array<{row?:number;sheet?:string;message:string}>};
export type ImportRun=ImportResult&{id:string;fileName:string;scope:ImportScope;status:string;startedAt:string;completedAt:string};
export const importScopes:Array<{value:ImportScope;label:string}>=[{value:"all",label:"Completa"},{value:"administration",label:"Administración"},{value:"catalogs",label:"Catálogos"},{value:"users",label:"Usuarios"},{value:"requirements",label:"Requerimientos"},{value:"products",label:"Productos"}];
