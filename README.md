# HybridApp MVP

Aplicação híbrida modular construída com Vue 3, Vite, TypeScript e Capacitor 6.

## Arquitetura

```text
packages/
├── core/       # EventBus, ApiClient e abstração SQLite
├── ui/         # Router, layouts, componentes e estilos
├── modules/    # Serviços GitHub e tarefas em background
└── glue/       # Bridge nativa e handlers de integração
src/            # Entrada e composição da aplicação Vue
```

Os testes unitários e de integração usam Vitest e mocks das APIs nativas. Os testes em ambiente jsdom **não substituem** a validação em dispositivo Android.

## Requisitos

- Node.js 20+
- pnpm (ou npm, ajustando os comandos)
- Android Studio e Android SDK para compilar APK
- JDK compatível com a versão do Android Gradle Plugin usada pelo Capacitor

## Instalação e execução web

```bash
git clone https://github.com/tonybenjamimfernando-oss/MVP.git
cd MVP
pnpm install
pnpm dev
```

## Testes e validação

```bash
pnpm test
pnpm test:watch
pnpm test:coverage
pnpm typecheck
pnpm build
```

Os testes estão em `packages/**/__tests__/**/*.test.ts`. Os mocks de SQLite, serviço em foreground, biometria e notificações evitam depender de plugins Android durante a execução em jsdom.

## Preparar Android

Se a plataforma Android ainda não estiver criada:

```bash
pnpm build
pnpm exec cap add android
pnpm exec cap sync android
pnpm exec cap open android
```

Depois de abrir o projeto no Android Studio, confirma o package ID, permissões e configuração dos plugins. A implementação do serviço em foreground e os fluxos nativos devem ser testados num dispositivo/emulador.

## Criar uma chave de assinatura (uma única vez)

Guarda a chave e as palavras-passe num local seguro. **Não coloques o keystore, passwords ou ficheiros secretos no Git.** Perder a chave de release pode impedir atualizações da aplicação distribuída fora de um fluxo gerido de assinatura.

```bash
keytool -genkeypair -v \
  -keystore hybridapp-release.keystore \
  -alias hybridapp \
  -keyalg RSA -keysize 2048 -validity 10000
```

Copia o keystore para um local seguro fora do repositório. Define as variáveis de ambiente no terminal/ambiente de build:

```bash
export KEYSTORE_PATH="/caminho/seguro/hybridapp-release.keystore"
export KEYSTORE_PASSWORD="a-tua-palavra-passe"
export KEY_ALIAS="hybridapp"
export KEY_PASSWORD="a-palavra-passe-da-chave"
```

Configura o bloco `signingConfigs.release` em `android/app/build.gradle` para ler estas variáveis. Exemplo Groovy:

```gradle
android {
    signingConfigs {
        release {
            storeFile file(System.getenv("KEYSTORE_PATH"))
            storePassword System.getenv("KEYSTORE_PASSWORD")
            keyAlias System.getenv("KEY_ALIAS")
            keyPassword System.getenv("KEY_PASSWORD")
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

Confirma que as variáveis existem antes de iniciar o build e não uses valores de fallback que possam produzir uma assinatura incorreta.

## Gerar o APK release assinado

A partir da raiz do projeto:

```bash
pnpm build
pnpm exec cap sync android
cd android
./gradlew assembleRelease
```

No Windows, usa `gradlew.bat assembleRelease`. O APK deverá ser produzido em:

```text
android/app/build/outputs/apk/release/app-release.apk
```

Verifica a assinatura com as ferramentas Android disponíveis no SDK:

```bash
$ANDROID_HOME/build-tools/<versao>/apksigner verify --verbose android/app/build/outputs/apk/release/app-release.apk
```

Instala o APK num dispositivo de teste e valida login, deep links, notificações, biometria, persistência e tarefas em background antes de distribuir. A assinatura do APK não significa que os fluxos OAuth ou os plugins nativos estejam automaticamente configurados.

## Variáveis de ambiente

Cria um ficheiro local `.env.local` (não o publiques):

```dotenv
VITE_GITHUB_CLIENT_ID=your_client_id
VITE_GITHUB_REDIRECT_URI=hybridapp://oauth/callback
VITE_API_BASE_URL=https://api.github.com
```

O serviço GitHub ainda requer configuração e validação do fluxo OAuth. A troca do código por token deve ocorrer num backend seguro ou num fluxo OAuth apropriado para aplicações nativas; nunca coloques um client secret no frontend.

## Estado do projeto

- Arquitetura modular, serviços principais e UI presentes no repositório.
- Testes automatizados em Vitest para EventBus, API client, base de dados, GitHub, tarefas e integração.
- Build web existente; build Android assinado depende da configuração local do SDK, keystore e Gradle.
- Publicação na Play Store não está incluída nesta fase.

## Licença

MIT
