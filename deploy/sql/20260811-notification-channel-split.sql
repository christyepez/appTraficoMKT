/*
  Hito 7 - Separación de notificaciones Power Automate por Email y Teams.
  Ejecutar contra la base Activities.
*/

BEGIN TRANSACTION;

IF OBJECT_ID('NotificationSettings', 'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('NotificationSettings', 'EmailPowerAutomateWebhookUrl') IS NULL
        ALTER TABLE [NotificationSettings] ADD [EmailPowerAutomateWebhookUrl] nvarchar(1200) NOT NULL DEFAULT('');
    IF COL_LENGTH('NotificationSettings', 'TeamsPowerAutomateWebhookUrl') IS NULL
        ALTER TABLE [NotificationSettings] ADD [TeamsPowerAutomateWebhookUrl] nvarchar(1200) NOT NULL DEFAULT('');
    IF COL_LENGTH('NotificationSettings', 'EmailHtmlTemplate') IS NULL
        ALTER TABLE [NotificationSettings] ADD [EmailHtmlTemplate] nvarchar(max) NOT NULL DEFAULT('<h2>{{subject}}</h2><p>{{message}}</p>');
    IF COL_LENGTH('NotificationSettings', 'TeamsHtmlTemplate') IS NULL
        ALTER TABLE [NotificationSettings] ADD [TeamsHtmlTemplate] nvarchar(max) NOT NULL DEFAULT('<h2>{{subject}}</h2><p>{{message}}</p>');
END;

IF OBJECT_ID('NotificationDeliveryAttempts', 'U') IS NULL
BEGIN
    CREATE TABLE [NotificationDeliveryAttempts] (
        [Id] uniqueidentifier NOT NULL,
        [NotificationRecordId] uniqueidentifier NOT NULL,
        [RequirementId] uniqueidentifier NULL,
        [ActivityId] uniqueidentifier NULL,
        [EventType] nvarchar(max) NOT NULL,
        [Channel] nvarchar(40) NOT NULL,
        [Status] nvarchar(40) NOT NULL,
        [Attempts] int NOT NULL,
        [Error] nvarchar(600) NOT NULL,
        [IdempotencyKey] nvarchar(160) NOT NULL,
        [CreatedAt] datetimeoffset NOT NULL,
        [SentAt] datetimeoffset NULL,
        CONSTRAINT [PK_NotificationDeliveryAttempts] PRIMARY KEY ([Id])
    );
    CREATE UNIQUE INDEX [IX_NotificationDeliveryAttempts_IdempotencyKey] ON [NotificationDeliveryAttempts] ([IdempotencyKey]);
    CREATE INDEX [IX_NotificationDeliveryAttempts_NotificationRecordId] ON [NotificationDeliveryAttempts] ([NotificationRecordId]);
END;

COMMIT TRANSACTION;

SELECT TOP 20 [Channel], [Status], COUNT(*) AS Total
  FROM [NotificationDeliveryAttempts]
 GROUP BY [Channel], [Status];
