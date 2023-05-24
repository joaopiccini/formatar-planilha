const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const alert = require('alert');
const { isValidEmail } = require('docs-validator-br');
const passGenerator = require('generate-password');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });
const port = 3000;

app.set('view engine', 'ejs');
app.set('views', './views');

app.listen(port, () => {
  console.log(`Servidor escutando na porta ${port}`);
});

app.post('/planilha', upload.single('planilha'), (req, res) => {
  const inputFile = req.file;

  if (inputFile && inputFile.originalname.endsWith('.csv')) {
    function formatCpfCnpj(cpfCnpj) {
      if (!cpfCnpj) {
        return '';
      }

      const digits = cpfCnpj.replace(/\D/g, '');

      if(digits.length < 11) {
        return '';
      }

      if (digits.length === 11) {
        return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      } else if (digits.length === 14) {
        return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
      }

      return 'Erro';
    }
    
    function formatPhoneNumber(phoneNumber) {
      if (!phoneNumber) {
        return '';
      }

      const digits = phoneNumber.replace(/\D/g, '');

      if(digits.length < 10) {
        return '';
      }

      if (digits.length === 10) {
        return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
      } else if (digits.length === 11) {
        return digits.replace(/(\d{2})(\d{1})(\d{4})(\d{4})/, '($1) $2 $3-$4');
      } else if (digits.length === 13) {
        return digits.replace('55', '').replace(/(\d{2})(\d{1})(\d{4})(\d{4})/, '($1) $2 $3-$4');
      }

      return 'Erro';
    }

    function generateName() {
      const randomIndex = Math.floor(Math.random() * 1000)
      return `Indefinido ${randomIndex}`
    }
    
    function generateRandomPassword() {
      let password = passGenerator.generate({
        length: 10,
        numbers: true,
        symbols: true
      });
      return password;
    }

    const updatedFilePath = './planilha_atualizada.csv';
    fs.createWriteStream(updatedFilePath);
  
    const headerRow = 'nome;cpf_cnpj;fantasia;foneComercial;foneResidencial;celular;email_principal;senha;status;cliente;prospect;fornecedor;prestadorServico\n';
    fs.writeFile(updatedFilePath, headerRow, (err) => {
      if (err) {
        console.log(err);
      }});
  
    fs.createReadStream(inputFile.path)
    .pipe(csv({ separator: ',' }))
    .on('data', (row) => {
      row.nome = row.nome || generateName();
      row.cpf_cnpj = formatCpfCnpj(row.cpf_cnpj);
      row.fantasia = row.fantasia || '';
      row.foneComercial = formatPhoneNumber(row.foneComercial);
      row.foneResidencial = formatPhoneNumber(row.foneResidencial);
      row.celular = formatPhoneNumber(row.celular);
  
      if (isValidEmail(row.email_principal)) {
        row.email_principal = row.email_principal;
        row.senha = generateRandomPassword();
      } else {
        row.email_principal = '';
        row.senha = '';
      }
      
      row.status = 'A';
      row.cliente = 'sim';
      row.prospect = 'não';
      row.fornecedor = 'não';
      row.prestadorServico = 'não';
  
      fs.appendFileSync(updatedFilePath, Object.values(row).join(';') + '\n', 'utf-8');
      })
      .on('end', () => {
  
        res.download(updatedFilePath, 'planilha_atualizada.csv', (err) => {
          if (err) {
            console.log('Ocorreu um erro ao fazer o download do arquivo:', err);
            alert('Ocorreu um erro ao fazer o download do arquivo.');
          }
          
          fs.unlinkSync(inputFile.path);
          fs.unlinkSync(updatedFilePath);
        });
      });
      return console.log('Processamento da planilha finalizado')
  }
  fs.unlinkSync(inputFile.path);
  console.log('Arquivo enviado não é um CSV válido')
  return alert('Por favor, envie um arquivo CSV válido.');
});
