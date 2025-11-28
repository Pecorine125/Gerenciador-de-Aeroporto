export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ erro: "Método não permitido" });
    }

    const { pontos } = req.body;

    if (!pontos) {
        return res.status(400).json({ erro: "Nenhum ponto recebido" });
    }

    // Dados do repo
    const owner = "Pecorine125";
    const repo = "Gerenciador-de-Aeroporto";
    const path = "pontos.json";

    const token = process.env.GITHUB_TOKEN;

    if (!token) {
        return res.status(500).json({ erro: "Token não configurado no servidor" });
    }

    // 1. Buscar o sha do arquivo atual
    const arquivo = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
        {
            headers: { Authorization: `Bearer ${token}` }
        }
    );

    const dadosArquivo = await arquivo.json();

    // 2. Criar o novo conteúdo codificado em Base64
    const novoConteudo = Buffer.from(JSON.stringify(pontos, null, 4)).toString("base64");

    // 3. Commit no GitHub
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
                sha: dadosArquivo.sha
            })
        }
    );

    const resposta = await commit.json();

    return res.status(200).json({
        sucesso: true,
        resposta
    });
}
