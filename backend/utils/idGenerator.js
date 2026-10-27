function generateNationalID(dateOfBirth, gender, sequence) {
  const d = new Date(dateOfBirth);
  
  // 1. Get YY, MM, DD (6 digits total)
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  
  // 2. Gender digit: 5 for Male, 6 for Female (1 digit)
  const genderDigit = gender.toLowerCase() === 'male' ? '5' : '6';
  
  // 3. Sequence padded to 6 digits (600001, 600002, etc.)
  const seq = String(sequence).padStart(6, '0');
  
  // Result: 6 (date) + 6 (seq) + 1 (gender) = STRICTLY 13 DIGITS
  return `${yy}${mm}${dd}${seq}${genderDigit}`;
}

function generateBirthCertNumber() {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 900000) + 100000;
  return `BC-${year}-${random}`;
}

module.exports = { generateNationalID, generateBirthCertNumber };