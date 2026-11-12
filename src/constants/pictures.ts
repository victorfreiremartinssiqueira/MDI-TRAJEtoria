// Fotografias demonstrativas extraídas dos mockups visuais do próprio TRAJEtória.
// Não representam itens reais nem anúncios comerciais.
export const pictures:Record<number,any>={
 1:require('../../assets/images/moletom_bege.jpg'),
 2:require('../../assets/images/camiseta_roxa.jpg'),
 3:require('../../assets/images/calca_cargo.jpg'),
 4:require('../../assets/images/jaqueta_jeans.jpg'),
 5:require('../../assets/images/camiseta_estampada.jpg'),
 6:require('../../assets/images/peca_ilustrativa_2.jpg'),
 7:require('../../assets/images/peca_ilustrativa_3.jpg'),
 8:require('../../assets/images/peca_ilustrativa_4.jpg'),
 9:require('../../assets/images/peca_ilustrativa_5.jpg'),
 10:require('../../assets/images/peca_ilustrativa_7.jpg'),
 11:require('../../assets/images/peca_ilustrativa_8.jpg'),
 12:require('../../assets/images/camiseta_roxa.jpg'),
 13:require('../../assets/images/peca_ilustrativa_1.jpg'),
 14:require('../../assets/images/peca_ilustrativa_6.jpg'),
 15:require('../../assets/images/peca_ilustrativa_3.jpg')
};
export const hoodieGallery=[require('../../assets/images/moletom_bege.jpg'), require('../../assets/images/moletom_detalhe.jpg')];
export function pieceImage(id:number){return pictures[id] || require('../../assets/images/peca_ilustrativa_1.jpg')}
