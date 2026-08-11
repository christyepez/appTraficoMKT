/*
  Hito 6 - Presentación parametrizable de formularios de requerimientos.
  Ejecutar contra la base Identity.

  Rollback manual:
    ALTER TABLE [BrandSettings] DROP CONSTRAINT [DF_BrandSettings_RequirementFormLayout];
    ALTER TABLE [BrandSettings] DROP COLUMN [RequirementFormLayout];
*/

BEGIN TRANSACTION;

IF OBJECT_ID('BrandSettings', 'U') IS NOT NULL
   AND COL_LENGTH('BrandSettings', 'RequirementFormLayout') IS NULL
BEGIN
    ALTER TABLE [BrandSettings]
        ADD [RequirementFormLayout] nvarchar(20) NOT NULL
            CONSTRAINT [DF_BrandSettings_RequirementFormLayout] DEFAULT('singlePage');
END;

IF OBJECT_ID('BrandSettings', 'U') IS NOT NULL
BEGIN
    UPDATE [BrandSettings]
       SET [RequirementFormLayout] = 'singlePage'
     WHERE [RequirementFormLayout] IS NULL
        OR [RequirementFormLayout] NOT IN ('singlePage', 'stepper');
END;

COMMIT TRANSACTION;

SELECT TOP 10 [Id], [RequirementFormLayout], [UpdatedAt]
  FROM [BrandSettings]
 ORDER BY COALESCE([UpdatedAt], [CreatedAt]) DESC;
