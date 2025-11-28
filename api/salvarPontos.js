export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Método não permitido" });
    }

    const { pontos } = req.body;

    if (!pontos) {
        return res.status(400).json({ error: "Nenhum ponto recebido" });
    }

    const owner = "Pecorine125";
    const repo = "Gerenciador-de-Aeroporto";
    const path = "pontos.json";

    const token = process.env.GITHUB_TOKEN;

    if (!token) {
        return res.status(500).json({ error: "GITHUB_TOKEN não configurado" });
    }

    // Buscar SHA do arquivo atual
    const atual = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
        {
            headers: { Authorization: `Bearer ${token}` }
        }
    );

    const dados = await atual.json();

    const novoConteudo = Buffer.from(JSON.stringify(pontos, null, 4)).toString("base64");

    const commit = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
        {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: "Atualização automática dos pontos pelo jogo",
                content: novoConteudo,
                sha: dados.sha
            })
        }
    );

    const resposta = await commit.json();

    return res.status(200).json({
        sucesso: true,
        resposta
    });
}
