require('dotenv').config();
const db = require('./config/db');

async function checkDocs() {
  try {
    console.log('Checking documents for ntata bana...');
    
    // Find the user first
    const [users] = await db.query("SELECT id, full_name, email FROM users WHERE full_name LIKE '%ntata%' OR full_name LIKE '%bana%'");
    console.log('Users found:', users);

    if (users.length > 0) {
      const userId = users[0].id;
      
      // Find their requests
      const [requests] = await db.query('SELECT id, reference_number, user_id FROM service_requests WHERE user_id = ?', [userId]);
      console.log('Requests found:', requests);

      if (requests.length > 0) {
        const requestId = requests[0].id;
        
        // Check documents for this request
        const [docs] = await db.query('SELECT * FROM request_documents WHERE request_id = ?', [requestId]);
        console.log('Documents found:', docs);
        
        // Also just check ALL documents to see if they saved under a different request ID
        const [allDocs] = await db.query('SELECT * FROM request_documents');
        console.log(`Total documents in database: ${allDocs.length}`);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkDocs();