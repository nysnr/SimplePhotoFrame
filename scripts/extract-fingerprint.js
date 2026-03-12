let s = "";
process.stdin.on("data", d => s += d).on("end", () => {
  try {
    const start = s.indexOf("[");
    const end = s.lastIndexOf("]");
    if (start === -1 || end === -1 || end < start) throw new Error("JSON array not found in input");
    const jsonText = s.slice(start, end + 1);
    const j = JSON.parse(jsonText);
    const b = j[0] || {};
    const hash = (b.fingerprint && b.fingerprint.hash) || b.fingerprintHash || (b.metadata && b.metadata.fingerprint && b.metadata.fingerprint.hash) || null;
    const artifactUrl = (b.artifacts && (b.artifacts.buildUrl || (Array.isArray(b.artifacts.buildArtifactUrls) && b.artifacts.buildArtifactUrls[0]))) || null;
    console.log(JSON.stringify({ hash, artifactUrl, isForIosSimulator: b.isForIosSimulator }, null, 2));
  } catch (e) {
    process.stderr.write("JSON parse error: " + e.message + "\n");
    process.exit(1);
  }
});