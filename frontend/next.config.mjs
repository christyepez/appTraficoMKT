const nextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/requirements/:path*",
        destination: `${process.env.REQUIREMENTS_API_URL ?? "http://localhost:5101"}/requirements/:path*`
      },
      {
        source: "/api/activities/:path*",
        destination: `${process.env.ACTIVITIES_API_URL ?? "http://localhost:5102"}/activities/:path*`
      },
      {
        source: "/api/notification-settings/:path*",
        destination: `${process.env.ACTIVITIES_API_URL ?? "http://localhost:5102"}/notification-settings/:path*`
      },
      {
        source: "/api/notification-records/:path*",
        destination: `${process.env.ACTIVITIES_API_URL ?? "http://localhost:5102"}/notification-records/:path*`
      },
      {
        source: "/api/evidence/:path*",
        destination: `${process.env.EVIDENCE_API_URL ?? "http://localhost:5103"}/evidence/:path*`
      },
      {
        source: "/api/approvals/:path*",
        destination: `${process.env.EVIDENCE_API_URL ?? "http://localhost:5103"}/approvals/:path*`
      },
      {
        source: "/api/storage-settings/:path*",
        destination: `${process.env.EVIDENCE_API_URL ?? "http://localhost:5103"}/storage-settings/:path*`
      },
      {
        source: "/api/files/:path*",
        destination: `${process.env.EVIDENCE_API_URL ?? "http://localhost:5103"}/files/:path*`
      },
      {
        source: "/api/auth/:path*",
        destination: `${process.env.IDENTITY_API_URL ?? "http://localhost:5104"}/auth/:path*`
      },
      {
        source: "/api/identity/:path*",
        destination: `${process.env.IDENTITY_API_URL ?? "http://localhost:5104"}/:path*`
      },
      {
        source: "/api/admin/:path*",
        destination: `${process.env.ADMINISTRATION_API_URL ?? "http://localhost:5105"}/:path*`
      }
    ];
  }
};

export default nextConfig;
