using System.Net;
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;

var output = args.Length > 0 ? args[0] : Path.Combine(AppContext.BaseDirectory, "certs", "local");
Directory.CreateDirectory(output);

using var rsa = RSA.Create(2048);
var request = new CertificateRequest(
    "CN=localhost",
    rsa,
    HashAlgorithmName.SHA256,
    RSASignaturePadding.Pkcs1);

var san = new SubjectAlternativeNameBuilder();
san.AddDnsName("localhost");
san.AddIpAddress(IPAddress.Parse("127.0.0.1"));
san.AddIpAddress(IPAddress.Parse("::1"));
request.CertificateExtensions.Add(san.Build());
request.CertificateExtensions.Add(new X509BasicConstraintsExtension(false, false, 0, false));
request.CertificateExtensions.Add(new X509KeyUsageExtension(
    X509KeyUsageFlags.DigitalSignature | X509KeyUsageFlags.KeyEncipherment,
    false));

using var cert = request.CreateSelfSigned(DateTimeOffset.UtcNow.AddDays(-1), DateTimeOffset.UtcNow.AddYears(2));

File.WriteAllText(Path.Combine(output, "cert.pem"), cert.ExportCertificatePem());
File.WriteAllText(Path.Combine(output, "key.pem"), rsa.ExportRSAPrivateKeyPem());

Console.WriteLine($"Certificado local creado en {output}");
