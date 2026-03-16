export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "method not allowed" });
  }

  const { path, base64, message } = req.body;

  const owner = "almacen-copihue";
  const repo = "almacen-copihue";
  const branch = "main";

  const token = process.env.GITHUB_TOKEN;

  try {
    // 1) Verificar si el archivo ya existe para obtener SHA
    const check = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
      {
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github+json"
        }
      }
    );

    let sha = null;

    if (check.status === 200) {
      const data = await check.json();
      sha = data.sha;
    }

    // 2) Preparar payload
    const payload = {
      message: message || "update image",
      content: base64,
      branch
    };

    if (sha) payload.sha = sha;

    // 3) Subir archivo
    const upload = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        method: "PUT",
        headers: {
          Authorization: `token ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      }
    );

    const result = await upload.json();

    return res.status(upload.status).json(result);

  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}