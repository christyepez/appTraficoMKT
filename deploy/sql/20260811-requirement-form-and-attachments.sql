/*
AppTraficoMKT - Requerimientos canonicos y adjuntos independientes
Fecha: 2026-08-11

Rollback manual sugerido:
1. Verificar que la aplicacion no use las columnas/tablas nuevas.
2. Respaldar RequirementsDb.
3. Eliminar FK/indices/tablas RequirementAttachments y RequirementPublicCreations.
4. Eliminar columnas nuevas de Requirements solo si no se requiere conservar historico.

Este script no contiene secretos, webhooks ni credenciales.
*/

BEGIN TRY
    BEGIN TRANSACTION;

    IF COL_LENGTH('Requirements', 'RequesterName') IS NULL
        ALTER TABLE [Requirements] ADD [RequesterName] nvarchar(160) NOT NULL DEFAULT('');
    IF COL_LENGTH('Requirements', 'RequesterEmail') IS NULL
        ALTER TABLE [Requirements] ADD [RequesterEmail] nvarchar(180) NOT NULL DEFAULT('');
    IF COL_LENGTH('Requirements', 'CareerId') IS NULL
        ALTER TABLE [Requirements] ADD [CareerId] uniqueidentifier NULL;
    IF COL_LENGTH('Requirements', 'AudienceType') IS NULL
        ALTER TABLE [Requirements] ADD [AudienceType] nvarchar(20) NOT NULL DEFAULT('internal');
    IF COL_LENGTH('Requirements', 'ActivityFormatDescription') IS NULL
        ALTER TABLE [Requirements] ADD [ActivityFormatDescription] nvarchar(4000) NOT NULL DEFAULT('');

    UPDATE [Requirements] SET [RequesterEmail] = [RequestedBy] WHERE [RequesterEmail] = '';
    UPDATE [Requirements] SET [RequesterName] = [RequestedBy] WHERE [RequesterName] = '';

    IF EXISTS (SELECT 1 FROM [Requirements] WHERE [CareerId] IS NULL)
    BEGIN
        INSERT INTO [CatalogReferences] ([Id], [Type], [Code], [Name], [IsActive], [CreatedAt])
        SELECT NEWID(), 'Career', LEFT([Career], 80), [Career], 1, SYSDATETIMEOFFSET()
        FROM [Requirements] r
        WHERE [CareerId] IS NULL
          AND NOT EXISTS (SELECT 1 FROM [CatalogReferences] c WHERE c.[Type] = 'Career' AND c.[Name] = r.[Career])
        GROUP BY [Career];

        UPDATE r
        SET [CareerId] = c.[Id]
        FROM [Requirements] r
        INNER JOIN [CatalogReferences] c ON c.[Type] = 'Career' AND c.[Name] = r.[Career]
        WHERE r.[CareerId] IS NULL;
    END

    IF OBJECT_ID('FK_Requirements_CatalogReferences_CareerId', 'F') IS NULL
        ALTER TABLE [Requirements] ADD CONSTRAINT [FK_Requirements_CatalogReferences_CareerId]
        FOREIGN KEY ([CareerId]) REFERENCES [CatalogReferences] ([Id]);

    IF OBJECT_ID('RequirementAttachments', 'U') IS NULL
    BEGIN
        CREATE TABLE [RequirementAttachments] (
            [Id] uniqueidentifier NOT NULL,
            [RequirementId] uniqueidentifier NOT NULL,
            [OriginalFileName] nvarchar(240) NOT NULL,
            [StoredFileName] nvarchar(260) NOT NULL,
            [ContentType] nvarchar(120) NOT NULL,
            [SizeBytes] bigint NOT NULL,
            [StorageKey] nvarchar(800) NOT NULL,
            [Status] nvarchar(32) NOT NULL,
            [UploadedBy] nvarchar(180) NOT NULL,
            [CreatedAt] datetimeoffset NOT NULL,
            [UpdatedAt] datetimeoffset NULL,
            [IsDeleted] bit NOT NULL DEFAULT(0),
            [DeletedAt] datetimeoffset NULL,
            [DeletedBy] nvarchar(160) NOT NULL DEFAULT(''),
            CONSTRAINT [PK_RequirementAttachments] PRIMARY KEY ([Id]),
            CONSTRAINT [FK_RequirementAttachments_Requirements_RequirementId]
                FOREIGN KEY ([RequirementId]) REFERENCES [Requirements] ([Id]),
            CONSTRAINT [CK_RequirementAttachments_SizeBytes] CHECK ([SizeBytes] > 0 AND [SizeBytes] <= 5242880),
            CONSTRAINT [CK_RequirementAttachments_ContentType] CHECK ([ContentType] IN ('application/pdf','image/jpeg','image/png','image/webp'))
        );
    END

    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_RequirementAttachments_RequirementId' AND object_id = OBJECT_ID('RequirementAttachments'))
        CREATE INDEX [IX_RequirementAttachments_RequirementId] ON [RequirementAttachments] ([RequirementId]);

    IF OBJECT_ID('RequirementPublicCreations', 'U') IS NULL
    BEGIN
        CREATE TABLE [RequirementPublicCreations] (
            [Id] uniqueidentifier NOT NULL,
            [RequirementId] uniqueidentifier NOT NULL,
            [IdempotencyKeyHash] nvarchar(128) NOT NULL,
            [UploadTokenHash] nvarchar(128) NOT NULL,
            [UploadTokenValue] nvarchar(160) NOT NULL,
            [ExpiresAt] datetimeoffset NOT NULL,
            [CreatedAt] datetimeoffset NOT NULL,
            CONSTRAINT [PK_RequirementPublicCreations] PRIMARY KEY ([Id]),
            CONSTRAINT [FK_RequirementPublicCreations_Requirements_RequirementId]
                FOREIGN KEY ([RequirementId]) REFERENCES [Requirements] ([Id])
        );
    END

    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_RequirementPublicCreations_IdempotencyKeyHash' AND object_id = OBJECT_ID('RequirementPublicCreations'))
        CREATE UNIQUE INDEX [IX_RequirementPublicCreations_IdempotencyKeyHash] ON [RequirementPublicCreations] ([IdempotencyKeyHash]);
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_RequirementPublicCreations_UploadTokenHash' AND object_id = OBJECT_ID('RequirementPublicCreations'))
        CREATE UNIQUE INDEX [IX_RequirementPublicCreations_UploadTokenHash] ON [RequirementPublicCreations] ([UploadTokenHash]);

    COMMIT TRANSACTION;

    SELECT 'OK' AS Status,
           (SELECT COUNT(*) FROM [Requirements]) AS Requirements,
           OBJECT_ID('RequirementAttachments', 'U') AS RequirementAttachmentsObjectId,
           OBJECT_ID('RequirementPublicCreations', 'U') AS RequirementPublicCreationsObjectId;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
