/*
  Public login layout parametrization
  Applies independent layout settings for:
  - Login popup requirement form
  - Full public requirement page
  - Puma chatbot

  Rollback manual:
    ALTER TABLE [BrandSettings] DROP CONSTRAINT [DF_BrandSettings_PublicRequirementFormLayout];
    ALTER TABLE [BrandSettings] DROP CONSTRAINT [DF_BrandSettings_PublicRequirementFullPageLayout];
    ALTER TABLE [BrandSettings] DROP CONSTRAINT [DF_BrandSettings_LoginChatbotLayout];
    ALTER TABLE [BrandSettings] DROP COLUMN [PublicRequirementFormLayout], [PublicRequirementFullPageLayout], [LoginChatbotLayout];
*/

BEGIN TRANSACTION;

IF OBJECT_ID('BrandSettings', 'U') IS NOT NULL
   AND COL_LENGTH('BrandSettings', 'PublicRequirementFormLayout') IS NULL
BEGIN
    ALTER TABLE [BrandSettings]
        ADD [PublicRequirementFormLayout] nvarchar(20) NOT NULL
            CONSTRAINT [DF_BrandSettings_PublicRequirementFormLayout] DEFAULT('singlePage');

    UPDATE [BrandSettings]
       SET [PublicRequirementFormLayout] = [RequirementFormLayout]
     WHERE [RequirementFormLayout] IN ('singlePage', 'stepper');
END;

IF OBJECT_ID('BrandSettings', 'U') IS NOT NULL
   AND COL_LENGTH('BrandSettings', 'PublicRequirementFullPageLayout') IS NULL
BEGIN
    ALTER TABLE [BrandSettings]
        ADD [PublicRequirementFullPageLayout] nvarchar(20) NOT NULL
            CONSTRAINT [DF_BrandSettings_PublicRequirementFullPageLayout] DEFAULT('singlePage');

    UPDATE [BrandSettings]
       SET [PublicRequirementFullPageLayout] = [RequirementFormLayout]
     WHERE [RequirementFormLayout] IN ('singlePage', 'stepper');
END;

IF OBJECT_ID('BrandSettings', 'U') IS NOT NULL
   AND COL_LENGTH('BrandSettings', 'LoginChatbotLayout') IS NULL
BEGIN
    ALTER TABLE [BrandSettings]
        ADD [LoginChatbotLayout] nvarchar(20) NOT NULL
            CONSTRAINT [DF_BrandSettings_LoginChatbotLayout] DEFAULT('stepper');
END;

UPDATE [BrandSettings]
   SET [PublicRequirementFormLayout] = CASE WHEN [PublicRequirementFormLayout] = 'stepper' THEN 'stepper' ELSE 'singlePage' END,
       [PublicRequirementFullPageLayout] = CASE WHEN [PublicRequirementFullPageLayout] = 'stepper' THEN 'stepper' ELSE 'singlePage' END,
       [LoginChatbotLayout] = CASE WHEN [LoginChatbotLayout] = 'singlePage' THEN 'singlePage' ELSE 'stepper' END;

COMMIT TRANSACTION;

SELECT TOP 5
       [PublicRequirementFormLayout],
       [PublicRequirementFullPageLayout],
       [LoginChatbotLayout]
  FROM [BrandSettings]
 ORDER BY COALESCE([UpdatedAt], [CreatedAt]) DESC;
