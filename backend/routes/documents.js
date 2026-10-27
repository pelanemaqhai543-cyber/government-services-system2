const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const db = require('../config/db');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/birth-certificate/:userId', verifyToken, async (req, res) => {
  try {
    // 1. Fetch the user's data
    const [users] = await db.query('SELECT full_name, national_id, birth_certificate_number, date_of_birth, gender FROM users WHERE id = ?', [req.params.userId]);
    
    if (users.length === 0) return res.status(404).json({ message: 'User not found' });
    const user = users[0];

    if (!user.birth_certificate_number) {
      return res.status(400).json({ message: 'Birth certificate has not been issued yet.' });
    }

    // 2. Create the PDF
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    
    // Set headers so the browser downloads it as a file
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=BirthCertificate_${user.birth_certificate_number}.pdf`);

    doc.pipe(res);

    // 3. Draw the Certificate
    doc.fontSize(24).text('KINGDOM OF LESOTHO', { align: 'center' });
    doc.fontSize(18).text('MINISTRY OF HOME AFFAIRS', { align: 'center' });
    doc.moveDown();
    doc.fontSize(22).text('BIRTH CERTIFICATE', { align: 'center', underline: true });
    doc.moveDown(2);

    doc.fontSize(14).text(`Certificate Number: ${user.birth_certificate_number}`);
    doc.moveDown();
    doc.text(`Full Name: ${user.full_name}`);
    doc.text(`Date of Birth: ${new Date(user.date_of_birth).toDateString()}`);
    doc.text(`Gender: ${user.gender}`);
    doc.text(`National ID (Generated): ${user.national_id || 'Pending'}`);
    doc.moveDown(3);

    doc.text('This document is digitally generated and verified by the Government of Lesotho.', { align: 'center', fontSize: 10, color: 'gray' });
    
    // 4. Finalize
    doc.end();

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error generating PDF' });
  }
});

module.exports = router;