// Parametros Power Query. No almacenar credenciales en el repositorio.

ServerName = "localhost,14333" meta [IsParameterQuery = true, Type = "Text", IsParameterQueryRequired = true];
DatabaseName = "RequirementsDb" meta [IsParameterQuery = true, Type = "Text", IsParameterQueryRequired = true];
EnvironmentName = "dev" meta [IsParameterQuery = true, Type = "Text", IsParameterQueryRequired = true];
