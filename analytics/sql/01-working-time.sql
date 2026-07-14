/*
Funcion reutilizable para minutos laborales.
Entrada esperada: timestamps UTC.
Horario: lunes a viernes, 08:30 a 17:30 Ecuador.
*/

CREATE OR ALTER FUNCTION bi.fn_WorkingMinutes
(
    @StartUtc datetimeoffset,
    @EndUtc datetimeoffset
)
RETURNS int
AS
BEGIN
    IF @StartUtc IS NULL OR @EndUtc IS NULL OR @EndUtc <= @StartUtc RETURN 0;

    DECLARE @StartLocal datetime2 = CONVERT(datetime2, @StartUtc AT TIME ZONE 'UTC' AT TIME ZONE 'SA Pacific Standard Time');
    DECLARE @EndLocal datetime2 = CONVERT(datetime2, @EndUtc AT TIME ZONE 'UTC' AT TIME ZONE 'SA Pacific Standard Time');
    DECLARE @CurrentDate date = CONVERT(date, @StartLocal);
    DECLARE @EndDate date = CONVERT(date, @EndLocal);
    DECLARE @Total int = 0;

    WHILE @CurrentDate <= @EndDate
    BEGIN
        DECLARE @Weekday int = DATEPART(weekday, @CurrentDate);
        DECLARE @IsWeekend bit = CASE WHEN @Weekday IN (1, 7) THEN 1 ELSE 0 END;
        DECLARE @IsHoliday bit = CASE WHEN EXISTS (
            SELECT 1 FROM bi.Holidays h WHERE h.HolidayDate = @CurrentDate AND h.IsActive = 1
        ) THEN 1 ELSE 0 END;

        IF @IsWeekend = 0 AND @IsHoliday = 0
        BEGIN
            DECLARE @WorkStart datetime2 = DATEADD(minute, 510, CONVERT(datetime2, @CurrentDate));
            DECLARE @WorkEnd datetime2 = DATEADD(minute, 1050, CONVERT(datetime2, @CurrentDate));
            DECLARE @IntervalStart datetime2 = CASE WHEN @StartLocal > @WorkStart THEN @StartLocal ELSE @WorkStart END;
            DECLARE @IntervalEnd datetime2 = CASE WHEN @EndLocal < @WorkEnd THEN @EndLocal ELSE @WorkEnd END;

            IF @IntervalEnd > @IntervalStart
                SET @Total += DATEDIFF(minute, @IntervalStart, @IntervalEnd);
        END;

        SET @CurrentDate = DATEADD(day, 1, @CurrentDate);
    END;

    RETURN @Total;
END;
GO
