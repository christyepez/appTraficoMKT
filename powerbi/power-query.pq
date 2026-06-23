let
    BaseUrl = "https://localhost",

    GetJson = (path as text) =>
        Json.Document(Web.Contents(BaseUrl, [RelativePath = path])),

    Requerimientos =
        Table.FromRecords(GetJson("api/requirements")),

    Productos =
        Table.FromRecords(GetJson("api/activities")),

    AuditoriaRequerimientos =
        Table.FromRecords(GetJson("api/requirements/audit")),

    AuditoriaProductos =
        Table.FromRecords(GetJson("api/activities/audit")),

    MetricasRequerimientos =
        Record.ToTable(GetJson("api/requirements/metrics")),

    MetricasProductos =
        Record.ToTable(GetJson("api/activities/metrics"))
in
    [
        Requerimientos = Requerimientos,
        Productos = Productos,
        AuditoriaRequerimientos = AuditoriaRequerimientos,
        AuditoriaProductos = AuditoriaProductos,
        MetricasRequerimientos = MetricasRequerimientos,
        MetricasProductos = MetricasProductos
    ]
