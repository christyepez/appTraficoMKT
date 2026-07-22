import{importScopes,type ImportResult,type ImportScope}from"../models/import.models";export const maxImportFileSize=50*1024*1024;
export function validateImportFile(file:File){if(!file.name.toLowerCase().endsWith(".xlsx"))return"Seleccione un archivo Excel .xlsx.";if(file.size>maxImportFileSize)return"El archivo supera el límite de 50 MB.";return"";}
export function templateHref(scope:ImportScope){return`/initial-import-template-${scope}.xlsx`;}
export function scopeLabel(value:string){return importScopes.find(item=>item.value===value)?.label??value;}
export function importCounts(result:ImportResult){return[{label:"Facultades",value:result.faculties},{label:"Sedes",value:result.campuses},{label:"Carreras",value:result.careers},{label:"Catálogos",value:result.catalogs},{label:"Aprobadores",value:result.approvers},{label:"Requerimientos",value:result.requirements},{label:"Productos",value:result.products},{label:"Usuarios",value:result.users}];}
export function formatImportDate(value:string){const date=new Date(value);return Number.isNaN(date.getTime())?"Fecha inválida":new Intl.DateTimeFormat("es-EC",{dateStyle:"short",timeStyle:"short"}).format(date);}
