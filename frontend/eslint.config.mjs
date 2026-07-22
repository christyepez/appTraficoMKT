import nextVitals from "eslint-config-next/core-web-vitals";

const config = [
  ...nextVitals,
  {
    files: ["app/**/*.tsx"],
    rules: {
      // Las paginas legacy se migraran por hitos; los modulos nuevos conservan
      // todas las reglas de React habilitadas.
      "react-hooks/immutability": "off",
      "react-hooks/set-state-in-effect": "off"
    }
  },
  { ignores: [".next/**", "coverage/**", "out/**", "next-env.d.ts"] }
];

export default config;
