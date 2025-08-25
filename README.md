# 3ds-nx-js-demo

Esse repositório contém um exemplo simples de integração com a biblioteca 3ds-nx-js.

### Estrutura
1. gen-token-server.js: É um servidor HTTP com apenas um endpoint responsável por gerar o 3DS token, que deve ser gerado para cada autenticação 3DS.
2. index.html: É uma página HTML simples que utiliza a biblioteca 3ds-nx-js para simular uma autenticação 3DS.

### Requisitos

- Node.js (versão 22 ou superior)
- npm (gerenciador de pacotes do Node.js)

### Execução do projeto
Para executar o projeto, siga os passos abaixo:

1. Instale as dependências:
```bash
npm install
```

2. Inicie o servidor que gera o token 3DS:
```bash
npm run gen-token-server
```

3. Em um novo terminal, inicie a aplicação frontend:
```bash
npm run demo
```

4. Acesse a aplicação em seu navegador:
```bash
open http://localhost:3000
```