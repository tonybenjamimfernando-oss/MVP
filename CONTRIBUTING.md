# Contributing

Obrigado pelo interesse em contribuir para o HybridApp MVP.

## Antes de começar
- Procura issues existentes antes de abrir uma nova.
- Para alterações importantes, abre primeiro uma issue para discutir a abordagem.
- Mantém as alterações focadas e evita incluir ficheiros gerados, credenciais ou dados pessoais.

## Desenvolvimento
- Usa Node.js 20+ e pnpm 9.
- Instala as dependências com `pnpm install`.
- Executa `pnpm test` e `pnpm build` antes de submeter alterações.
- Testa fluxos nativos num dispositivo/emulador quando aplicável; testes jsdom não substituem testes Android.

## Pull requests
- Explica o problema e a solução.
- Lista os testes executados e os resultados.
- Inclui capturas de ecrã quando houver alterações visuais.
- Nunca incluas tokens, client secrets, palavras-passe, keystores ou ficheiros `.env`.
