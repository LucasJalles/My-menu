// js/config.js (Este arquivo não existe mais, foi substituído pelo sistema de módulos)
// O conteúdo abaixo é um mock dos dados que viriam da sua API.
// No seu projeto, estes dados serão carregados pelo menu.js

export const menuData = {
    categories: [
        { id: 'burgers', name: 'Hambúrgueres', imageUrl: 'images/categoria_hamburgueres.png' },
        { id: 'bebidas', name: 'Bebidas', imageUrl: 'images/categoria_bebidas.png' },
        { id: 'acompanhamentos', name: 'Acompanhamentos', imageUrl: 'images/categoria_acompanhamentos.png' },
        { id: 'sobremesas', name: 'Sobremesas', imageUrl: 'images/categoria_sobremesas.png' },
    ],
    items: [
        {
            id: 'burger_classic',
            categoryId: 'burgers',
            name: 'Clássico da Casa',
            description: 'Pão artesanal, blend de carnes nobres, queijo cheddar derretido, alface americana crocante, tomate fresco e nosso molho especial secreto.',
            basePrice: 28.90,
            badge: 'Mais Pedido', // <<< GATILHO MENTAL
            imageUrl: 'images/burger_classic.jpg',
            defaultIngredients: [
                { id: 'di_alface', name: 'Alface Americana', included: true },
                { id: 'di_tomate', name: 'Tomate Fresco', included: true },
                { id: 'di_molho_especial', name: 'Molho Especial', included: true }
            ],
            customizableOptions: [
                { id: 'co_bacon', name: 'Bacon Crocante Extra', priceChange: 4.50, type: 'add', minQuantity: 0, maxQuantity: 3, defaultQuantity: 0 },
                { id: 'co_cebola_caram', name: 'Cebola Caramelizada', priceChange: 3.00, type: 'add', minQuantity: 0, maxQuantity: 2, defaultQuantity: 0 },
                { id: 'co_picles', name: 'Picles Agridoce', priceChange: 1.50, type: 'add', minQuantity: 0, maxQuantity: 1, defaultQuantity: 0 },
            ]
        },
        {
            id: 'burger_veggie',
            categoryId: 'burgers',
            name: 'Delícia Veggie',
            description: 'Pão integral, hambúrguer à base de plantas, queijo prato vegano, rúcula, tomate seco e maionese de castanhas.',
            basePrice: 29.90,
            original_price: 34.50, // <<< GATILHO MENTAL
            badge: 'Oferta!',      // <<< GATILHO MENTAL
            imageUrl: 'images/burger_veggie.jpg',
            defaultIngredients: [
                { id: 'di_rucula', name: 'Rúcula', included: true },
                { id: 'di_tomate_seco', name: 'Tomate Seco', included: true },
                { id: 'di_maionese_castanha', name: 'Maionese de Castanhas', included: true }
            ],
            customizableOptions: [
                { id: 'co_cogumelos', name: 'Mix de Cogumelos Salteados', priceChange: 5.00, type: 'add', minQuantity: 0, maxQuantity: 1, defaultQuantity: 0 },
            ]
        },
        {
            id: 'refri_lata',
            categoryId: 'bebidas',
            name: 'Refrigerante Lata 350ml',
            description: 'Escolha seu sabor preferido.',
            basePrice: 7.00,
            imageUrl: 'images/refri_lata.jpg',
            defaultIngredients: [],
            customizableOptions: [
                { id: 'co_coca', name: 'Coca-Cola', priceChange: 0, type: 'variant', variantGroup: 'sabor_refri', defaultSelected: true },
                { id: 'co_guarana', name: 'Guaraná Antarctica', priceChange: 0, type: 'variant', variantGroup: 'sabor_refri', defaultSelected: false },
            ]
        },
        {
            id: 'batata_frita_m',
            categoryId: 'acompanhamentos',
            name: 'Batata Frita Média',
            badge: 'Escolha do Chef', // <<< GATILHO MENTAL
            description: 'Crocantes e sequinhas, na medida certa da sua fome.',
            basePrice: 12.00,
            imageUrl: 'images/batata_frita_m.jpg',
            defaultIngredients: [],
            customizableOptions: [
                { id: 'co_molho_cheddar_bacon', name: 'Cobertura Cheddar com Bacon Bits', priceChange: 5.50, type: 'add', minQuantity: 0, maxQuantity: 1, defaultQuantity: 0 },
            ]
        },
        {
            id: 'petit_gateau',
            categoryId: 'sobremesas',
            name: 'Petit Gâteau Chocolate',
            description: 'Bolinho quente de chocolate com interior cremoso, acompanhado de sorvete de creme.',
            basePrice: 18.00,
            imageUrl: 'images/petit_gateau.jpg',
            defaultIngredients: [
                {id: 'di_sorvete_creme', name: 'Acompanha Sorvete de Creme', included: true}
            ],
            customizableOptions: []
        }
    ]
};