const fs = require('fs');
const csv = require('csv-parser');
const json2csv = require('json2csv').parse;

// Função para remover caracteres não numéricos de uma string
function removerCaracteresNaoNumericos(str) {
  if (typeof str === 'string') {
    return str.replace(/\D/g, '');
  }
  return '';
}

// Função para formatar os números de telefone no padrão desejado
function formatarNumerosTelefone(numero) {
  return removerCaracteresNaoNumericos(numero);
}

// Nome do arquivo CSV de entrada e de saída
const nomeArquivoEntrada = process.argv[2];
const nomeArquivoSaida = 'numeros_formatados.csv';

// Array para armazenar os números de telefone formatados
const numerosFormatados = [];

// Ler o arquivo CSV e formatar os números de telefone
fs.createReadStream(nomeArquivoEntrada)
  .pipe(csv())
  .on('data', (row) => {
    const numeroFormatado = formatarNumerosTelefone(row['Números de Telefone']);
    numerosFormatados.push({ 'Números de Telefone': numeroFormatado });
  })
  .on('end', () => {
    // Converter os dados formatados em CSV
    const csvData = json2csv(numerosFormatados, { fields: ['Números de Telefone'] });

    // Escrever os dados formatados no arquivo de saída
    fs.writeFile(nomeArquivoSaida, csvData, (err) => {
      if (err) {
        console.error('Erro ao escrever o arquivo:', err);
        return;
      }

      console.log(`Planilha formatada salva em "${nomeArquivoSaida}"`);
    });
  });
