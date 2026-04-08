

## Redesign da página de Carregamento — estilo visual com carro e círculo

### Visão geral
Redesenhar completamente a página `Carregamento.tsx` para seguir o estilo da imagem de referência: fundo escuro, imagem do carro vista de cima no centro, círculo animado de progresso ao redor do carro, e stats abaixo.

### Layout (de cima para baixo)

1. **Header** — fundo escuro (`bg-gray-950`), nome do veículo (marca/modelo do primeiro veículo cadastrado ou "Veículo Elétrico"), botão voltar
2. **Imagem do carro** — usar a imagem `Design_sem_nome_20.png` (carro visto de cima), copiar para `src/assets/car-top-view.png`, centralizada
3. **Círculo de progresso SVG** — anel circular ao redor do carro com gradiente verde (primary), animado conforme o progresso da sessão
4. **Timer + status** — tempo decorrido e label de status abaixo do círculo
5. **Barra de segmentos** — representação visual tipo "battery blocks" com porcentagem
6. **Stats row** — 3 colunas: Tempo estimado, Preço (custo), Energia (kWh) com ícones
7. **Botão "Stop Charging"** — verde (primary), arredondado, na parte inferior
8. **Bottom Navigation** — mantém o existente

### Mudanças técnicas

**Novo arquivo de asset**: Copiar `user-uploads://Design_sem_nome_20.png` para `src/assets/car-top-view.png`

**`src/pages/Carregamento.tsx`**: Reescrever o JSX completamente:
- Fundo escuro (`bg-gray-950 text-white`)
- SVG circular com `stroke-dasharray` / `stroke-dashoffset` para o anel de progresso
- Importar imagem do carro e centralizar dentro do círculo
- Remover os Cards e chart (manter apenas dados essenciais: tempo, custo, energia)
- Botão de parar com estilo verde (`bg-primary`) ao invés de destructive
- Toda lógica de negócio (polling, timer, auto-stop, offline) permanece inalterada

### Arquivo editado
- `src/assets/car-top-view.png` (novo)
- `src/pages/Carregamento.tsx` (reescrita visual)

