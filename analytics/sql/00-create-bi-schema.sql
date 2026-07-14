/*
App Trafico MKT - BI schema bootstrap
Ejecutar en la base que alojara las vistas analiticas, recomendado RequirementsDb.
No almacena credenciales y no modifica tablas transaccionales.
*/

IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'bi')
BEGIN
    EXEC('CREATE SCHEMA bi');
END;
GO

IF OBJECT_ID('bi.Holidays', 'U') IS NULL
BEGIN
    CREATE TABLE bi.Holidays (
        HolidayDate date NOT NULL,
        Name nvarchar(180) NOT NULL,
        CountryCode char(2) NOT NULL CONSTRAINT DF_bi_Holidays_CountryCode DEFAULT('EC'),
        IsActive bit NOT NULL CONSTRAINT DF_bi_Holidays_IsActive DEFAULT(1),
        CreatedAt datetimeoffset NOT NULL CONSTRAINT DF_bi_Holidays_CreatedAt DEFAULT(SYSDATETIMEOFFSET()),
        CONSTRAINT PK_bi_Holidays PRIMARY KEY (HolidayDate)
    );
END;
GO

MERGE bi.Holidays AS target
USING (VALUES
    (CONVERT(date, '2026-01-01'), N'Año nuevo'),
    (CONVERT(date, '2026-02-16'), N'Carnaval'),
    (CONVERT(date, '2026-02-17'), N'Carnaval'),
    (CONVERT(date, '2026-04-03'), N'Viernes Santo'),
    (CONVERT(date, '2026-05-01'), N'Dia del Trabajo'),
    (CONVERT(date, '2026-05-24'), N'Batalla de Pichincha'),
    (CONVERT(date, '2026-08-10'), N'Primer Grito de Independencia'),
    (CONVERT(date, '2026-10-09'), N'Independencia de Guayaquil'),
    (CONVERT(date, '2026-11-02'), N'Dia de los Difuntos'),
    (CONVERT(date, '2026-11-03'), N'Independencia de Cuenca'),
    (CONVERT(date, '2026-12-25'), N'Navidad')
) AS source (HolidayDate, Name)
ON target.HolidayDate = source.HolidayDate
WHEN MATCHED THEN UPDATE SET Name = source.Name, CountryCode = 'EC', IsActive = 1
WHEN NOT MATCHED THEN INSERT (HolidayDate, Name, CountryCode, IsActive)
VALUES (source.HolidayDate, source.Name, 'EC', 1);
GO

IF OBJECT_ID('bi.ProductTypeWeights', 'U') IS NULL
BEGIN
    CREATE TABLE bi.ProductTypeWeights (
        ProductType nvarchar(120) NOT NULL,
        Complexity nvarchar(40) NOT NULL,
        EstimatedHours decimal(10,2) NOT NULL,
        Weight decimal(10,4) NOT NULL,
        IsDemo bit NOT NULL CONSTRAINT DF_bi_ProductTypeWeights_IsDemo DEFAULT(1),
        UpdatedAt datetimeoffset NOT NULL CONSTRAINT DF_bi_ProductTypeWeights_UpdatedAt DEFAULT(SYSDATETIMEOFFSET()),
        CONSTRAINT PK_bi_ProductTypeWeights PRIMARY KEY (ProductType)
    );
END;
GO

MERGE bi.ProductTypeWeights AS target
USING (VALUES
    (N'Arte post', N'Media', 4.00, 1.00),
    (N'Flyers', N'Baja', 3.00, 0.80),
    (N'Video Horizontal', N'Alta', 12.00, 2.50),
    (N'Video reel', N'Alta', 10.00, 2.20),
    (N'Boletin de prensa', N'Media', 6.00, 1.30),
    (N'Cobertura', N'Alta', 8.00, 1.80),
    (N'Fotografias', N'Media', 5.00, 1.10)
) AS source (ProductType, Complexity, EstimatedHours, Weight)
ON target.ProductType = source.ProductType
WHEN MATCHED THEN UPDATE SET Complexity = source.Complexity, EstimatedHours = source.EstimatedHours, Weight = source.Weight, IsDemo = 1, UpdatedAt = SYSDATETIMEOFFSET()
WHEN NOT MATCHED THEN INSERT (ProductType, Complexity, EstimatedHours, Weight, IsDemo)
VALUES (source.ProductType, source.Complexity, source.EstimatedHours, source.Weight, 1);
GO

IF OBJECT_ID('bi.ApprovalThresholds', 'U') IS NULL
BEGIN
    CREATE TABLE bi.ApprovalThresholds (
        Id int IDENTITY(1,1) NOT NULL,
        Name nvarchar(80) NOT NULL,
        NormalHours decimal(10,2) NOT NULL,
        AttentionHours decimal(10,2) NOT NULL,
        DelayedHours decimal(10,2) NOT NULL,
        IsActive bit NOT NULL CONSTRAINT DF_bi_ApprovalThresholds_IsActive DEFAULT(1),
        CONSTRAINT PK_bi_ApprovalThresholds PRIMARY KEY (Id)
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM bi.ApprovalThresholds WHERE IsActive = 1)
BEGIN
    INSERT INTO bi.ApprovalThresholds (Name, NormalHours, AttentionHours, DelayedHours)
    VALUES (N'Umbral administrativo inicial', 8, 16, 24);
END;
GO
