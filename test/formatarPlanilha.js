const fs = require('fs');
const csv = require('csv-parser');

const inputFilePath = process.env.args[2];
const outputFilePath = process.env.args[3];

function formatCpfCnpj(cpfCnpj) {
  if (!cpfCnpj) {
    return '';
  }

  const digits = cpfCnpj.replace(/\D/g, '');

  if (digits.length === 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  } else if (digits.length === 14) {
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }

  return '';
}

function formatPhoneNumber(phoneNumber) {
  if (!phoneNumber) {
    return '';
  }

  const digits = phoneNumber.replace(/\D/g, '');

  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  } else if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{1})(\d{4})(\d{4})/, '($1) $2 $3-$4');
  } else if (digits.length === 13) {
    return digits.replace('55', '').replace(/(\d{2})(\d{1})(\d{4})(\d{4})/, '($1) $2 $3-$4');
  }

  return '';
}

function pickCharacterAndAddInPassword(charset) {
  const randomIndex = Math.floor(Math.random() * charset.length);
  const character = charset[randomIndex];
  return character
}

function generateRandomPassword() {
  const upperCaseCharset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowerCaseCharset = 'abcdefghijklmnopqrstuvwxyz';
  const numbersCharset = '0123456789';
  const specialCharset = '!@#$%*()';
  const length = 8;
  let password = '';

  for (let i = 0; i < length; i++) {
    if (i == 1 || i == 5) {
      const character = pickCharacterAndAddInPassword(upperCaseCharset);
      password += character;
    } else if (i == 2 || i == 6) {
      const character = pickCharacterAndAddInPassword(lowerCaseCharset);
      password += character;
    } else if (i == 3 || i == 7) {
      const character = pickCharacterAndAddInPassword(numbersCharset);
      password += character;
    } else if (i == 4 || i == 8) {
      const character = pickCharacterAndAddInPassword(specialCharset);
      password += character;
    }
  }
  return password;
}

const headerRow = 'nome;cpf_cnpj;fantasia;foneComercial;foneResidencial;celular;email_principal;senha;status;cliente;prospect;fornecedor;prestadorServico\n';
await fs.writeFileSync(outputFilePath, headerRow, 'utf-8');

await fs.createReadStream(inputFilePath.path)
  .pipe(csv({ separator: ',' }))
  .on('data', async (row) => {
    row.nome = row.nome || '';
    row.cpf_cnpj = formatCpfCnpj(row.cpf_cnpj);
    row.fantasia = row.fantasia || '';
    row.foneComercial = formatPhoneNumber(row.foneComercial);
    row.foneResidencial = formatPhoneNumber(row.foneResidencial);
    row.celular = formatPhoneNumber(row.celular);

    if (row.email_principal) {
      row.senha = generateRandomPassword();
    } else {
      row.senha = '';
    }
    
    row.email_principal = row.email_principal || '';
    row.status = 'A';
    row.cliente = 'sim';
    row.prospect = 'não';
    row.fornecedor = 'não';
    row.prestadorServico = 'não';

    await fs.appendFileSync(outputFilePath, Object.values(row).join(';') + '\n', 'utf-8');
  })
  .on('end', () => {
    fs.unlinkSync(inputFilePath); // Remove o arquivo de upload temporário

    res.download(outputFilePath, 'saida.csv', (err) => {
    if (err) {
      console.log('Ocorreu um erro ao fazer o download do arquivo de saída:', err);
      res.status(500).send('Ocorreu um erro ao fazer o download do arquivo de saída.');
    }
  });
});