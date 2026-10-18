// Lista de restaurantes.
// id      -> slug único (é o que chega no banco/notificação)
// bairro  -> texto que aparece abaixo do nome (aqui usamos o endereço)
// lat/lng -> coordenadas do pin (vieram do Bing Maps; confira o pin no mapa)
// foto    -> caminho dentro de /fotos (ex.: "fotos/casa-bea.jpg"). Vazio = quadrado colorido com a inicial.
// link    -> Instagram, site ou cardápio
const RESTAURANTES = [
  {
    id: "casa-bea",
    nome: "Casa Beá Restaurante",
    bairro: "Av. Desembargador Moreira, 615",
    lat: -3.7317,
    lng: -38.4967,
    foto: "fotos/casa-bea.webp",
    link: "https://www.instagram.com/casabearestaurante",
  },
  {
    id: "nato-confeitaria",
    nome: "Nato Confeitaria",
    bairro: "Rua Tibúrcio Cavalcante, 1656",
    lat: -3.739378,
    lng: -38.503822,
    foto: "fotos/nato-confeitaria.png",
    link: "https://www.instagram.com/nato.confeitaria",
  },
  {
    id: "padocaria-saudavel",
    nome: "Padocaria Saudável",
    bairro: "Rua Júlio Lima, 685",
    lat: -3.7954,
    lng: -38.499298,
    foto: "fotos/padocaria-saudavel.jpg",
    link: "https://www.instagram.com/padocariasaudavel",
  },
  {
    id: "florenca-sem-gluten",
    nome: "Florença sem glúten",
    bairro: "Av. Barão de Studart, 2821",
    lat: -3.74877,
    lng: -38.510948,
    foto: "fotos/florenca-sem-gluten.jpg",
    link: "https://www.instagram.com/florencasemgluten",
  },
  {
    id: "la-dulce-vita",
    nome: "La Dulce Vita",
    bairro: "Rua Antonina do Norte, 350",
    lat: -3.732,
    lng: -38.553699,
    foto: "fotos/la-dulce-vita.jpg",
    link: "https://www.instagram.com/ladulcevitaoficial",
  },
  {
    id: "casannas",
    nome: "Casannas",
    bairro: "Rua Visconde de Mauá, 2140 · Aldeota",
    lat: -3.744117,
    lng: -38.502094,
    foto: "fotos/casannas.jpg",
    link: "https://www.instagram.com/casannas_",
  },
];
