# MVP v0.1.0

## Resumo

Primeira versão de preparação do HybridApp MVP: uma aplicação híbrida modular que reúne a base de autenticação/integração GitHub, navegação por deep links, ferramentas de terminal e validação automatizada.

## Principais áreas

- **Autenticação e GitHub:** estrutura de integração OAuth com configuração por variáveis de ambiente. O fluxo OAuth deve ser configurado e validado com a aplicação OAuth registada; nenhum segredo de cliente deve ser colocado no frontend.
- **Deep Links:** URI de callback configurável, com o esquema `hybridapp://oauth/callback`. A associação e o comportamento nativo devem ser verificados em dispositivo Android.
- **Terminal e ferramentas de desenvolvimento:** base do MVP orientada a tarefas e integração num ambiente híbrido; validar os comandos e permissões no ambiente de execução pretendido.
- **Testes automatizados:** testes unitários e de integração com Vitest, usando mocks para APIs e funcionalidades nativas quando executados em jsdom.
- **CI/CD:** GitHub Actions para instalar dependências, executar `pnpm test` e compilar com `pnpm build`; fluxo de publicação do site através do GitHub Pages.

## Validação

Antes de distribuir, confirmar a execução bem-sucedida de `pnpm test` e `pnpm build`, testar autenticação e deep links em dispositivo/emulador Android e verificar os plugins nativos, notificações, biometria, persistência e tarefas em background.

## Limitações conhecidas

- O build web não equivale a um APK Android assinado.
- A autenticação depende da configuração correta do OAuth e do URI de redirecionamento.
- As funcionalidades nativas precisam de validação num dispositivo/emulador; testes em jsdom não substituem esses testes.
- A publicação na Google Play Store não faz parte desta versão.

## Instalação e execução

Requisitos: Node.js 20+ e pnpm 9.

```bash
pnpm install
pnpm test
pnpm build
pnpm dev
```

## Créditos e licença

Consultar `LICENSE` para os termos de utilização e distribuição.
