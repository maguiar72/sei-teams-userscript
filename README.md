# SEI no Teams

Userscript que torna clicáveis os números de processo e de documento do SEI nas conversas do Microsoft Teams (versão web). Um clique abre o SEI em nova aba e pesquisa o número pela Pesquisa Rápida.

Funciona com o SEI de qualquer órgão: o endereço é informado uma única vez, no primeiro clique.

## O que vira link

- Números de processo, como `0001234-56.2026.1.00.0000`.
- Números de documento (7 dígitos) precedidos de uma palavra-chave na mesma linha, como `Despacho SIGLA 0123456` ou `SEI nº 0123456`. Palavras reconhecidas: Despacho, Ofício, SEI, Documento, Doc, Memorando, Informação, Parecer, Portaria, Certidão, Minuta, Decisão, Relatório, Nota Técnica.

## Instalação

1. Instale a extensão [Tampermonkey](https://www.tampermonkey.net/) no Edge ou no Chrome.
2. Em `edge://extensions` (ou `chrome://extensions`), ative o **Modo do desenvolvedor**.
3. Nos detalhes da extensão Tampermonkey, ative **Permitir scripts de usuário**.
4. Abra [sei-teams.user.js](../../raw/main/sei-teams.user.js) e confirme a instalação no Tampermonkey.
5. Abra o Teams em `https://teams.microsoft.com`.
6. No primeiro clique em um número, informe o endereço do SEI do seu órgão, no formato `https://sei.exemplo.gov.br/sei/`.

Para trocar o endereço depois, use o menu do Tampermonkey: **Definir endereço do SEI**.

## Como funciona

- No Teams, o script não altera a página: destaca os números com a CSS Highlight API e trata o clique sobre eles.
- No SEI, preenche e envia o formulário de Pesquisa Rápida da própria página, que já traz a assinatura (`infra_hash`) exigida pelo sistema.
- Se o SEI pedir login, a pesquisa continua logo depois; o número fica guardado por 5 minutos.

## Limitações

- Não funciona no aplicativo desktop do Teams, que não aceita extensões.
- Números de 7 dígitos sem palavra-chave antes não viram link.

## Licença

[MIT](LICENSE)
