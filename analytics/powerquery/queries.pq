let
    Source = Sql.Database(ServerName, DatabaseName, [CreateNavigationProperties = false]),
    LoadView = (viewName as text) =>
        Source{[Schema = "bi", Item = viewName]}[Data]
in
    [
        DimFecha = LoadView("DimFecha"),
        DimUsuario = LoadView("DimUsuario"),
        DimFacultad = LoadView("DimFacultad"),
        DimSede = LoadView("DimSede"),
        DimCarrera = LoadView("DimCarrera"),
        DimEstado = LoadView("DimEstado"),
        DimTipoRequerimiento = LoadView("DimTipoRequerimiento"),
        DimTipoProducto = LoadView("DimTipoProducto"),
        DimCanalDifusion = LoadView("DimCanalDifusion"),
        DimPublicoObjetivo = LoadView("DimPublicoObjetivo"),
        DimKpi = LoadView("DimKpi"),
        DimComplejidad = LoadView("DimComplejidad"),
        DimCanalOrigen = LoadView("DimCanalOrigen"),
        FactRequerimiento = LoadView("FactRequerimiento"),
        FactProducto = LoadView("FactProducto"),
        FactAprobacion = LoadView("FactAprobacion"),
        FactHistorialEstado = LoadView("FactHistorialEstado"),
        FactSatisfaccion = LoadView("FactSatisfaccion"),
        FactUsoUsuario = LoadView("FactUsoUsuario"),
        FactKpiResultado = LoadView("FactKpiResultado")
    ]
