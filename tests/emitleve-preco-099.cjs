const fs=require('fs');
const html=fs.readFileSync('index.html','utf8');
function a(ok,msg){if(!ok)throw new Error(msg)}
a(html.includes('R$ 0,99'),'Propaganda não mostra R$ 0,99.');
a(html.includes('por NFS-e emitida'),'Propaganda não informa cobrança por emissão.');
a(html.includes('Por menos de R$ 1,00, sua nota fiscal na mão.'),'Frase promocional nova ausente.');
a(html.includes('emitleve_20261014_preco099'),'Campanha não foi renovada.');
a(html.includes('M50 7 90 28 50 49 10 28 50 7Z'),'Logo oficial do EmitLeve não está embutida.');
a(!html.includes('R$ 1,01 por nota fiscal'),'Preço antigo ainda aparece na propaganda.');
console.log('Propaganda EmitLeve R$ 0,99 test OK.');
