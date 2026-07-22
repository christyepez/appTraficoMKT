import{api}from"../../../app/lib";import type{ImportResult,ImportRun,ImportScope}from"../models/import.models";
export function getImportRuns(){return api<ImportRun[]>("/api/admin/initial-import/runs");}
export function uploadInitialImport(file:File,scope:ImportScope){const form=new FormData();form.append("file",file);form.append("scope",scope);return api<ImportResult>("/api/admin/initial-import",{method:"POST",body:form});}
export function disableImportRun(id:string){return api(`/api/admin/initial-import/runs/${id}`,{method:"DELETE"});}
